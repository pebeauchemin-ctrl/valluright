const ENCRYPTED_TOKEN_PREFIX_V1 = "enc:v1:";
const ENCRYPTED_TOKEN_PREFIX_V2 = "enc:v2:";
const TOKEN_ENCRYPTION_KEY_MIN_LENGTH = 32;
const TOKEN_KEY_SALT = new TextEncoder().encode("valuright:oauth-token-encryption:v2");
const TOKEN_KEY_INFO = new TextEncoder().encode("ValuRight OAuth token AES-GCM key");
const TOKEN_RECONNECT_MESSAGE =
  "Saved accounting connection credentials could not be read. Disconnect and reconnect the accounting integration.";

function getTokenEncryptionSecret() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required for OAuth token encryption.");
  }
  if (secret.length < TOKEN_ENCRYPTION_KEY_MIN_LENGTH) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be at least 32 characters.");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function getEncryptionKeyV1() {
  const secretBytes = new TextEncoder().encode(getTokenEncryptionSecret());
  const keyBytes = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function getEncryptionKeyV2() {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getTokenEncryptionSecret()),
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: TOKEN_KEY_SALT,
      info: TOKEN_KEY_INFO,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isEncryptedToken(token: string) {
  return (
    token.startsWith(ENCRYPTED_TOKEN_PREFIX_V1) || token.startsWith(ENCRYPTED_TOKEN_PREFIX_V2)
  );
}

export async function encryptToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKeyV2();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token),
  );

  return `${ENCRYPTED_TOKEN_PREFIX_V2}${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptToken(token: string) {
  if (!isEncryptedToken(token)) return token;

  try {
    const isV1 = token.startsWith(ENCRYPTED_TOKEN_PREFIX_V1);
    const payload = token.slice(
      isV1 ? ENCRYPTED_TOKEN_PREFIX_V1.length : ENCRYPTED_TOKEN_PREFIX_V2.length,
    );
    const [ivPart, ciphertextPart] = payload.split(".");
    if (!ivPart || !ciphertextPart) {
      throw new Error("Stored OAuth token is malformed.");
    }

    const key = isV1 ? await getEncryptionKeyV1() : await getEncryptionKeyV2();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(ivPart) },
      key,
      base64UrlToBytes(ciphertextPart),
    );
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("TOKEN_ENCRYPTION_KEY") ||
        error.message === "Stored OAuth token is malformed.")
    ) {
      throw error;
    }
    throw new Error(TOKEN_RECONNECT_MESSAGE);
  }
}
