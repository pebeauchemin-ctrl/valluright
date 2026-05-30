const ENCRYPTED_TOKEN_PREFIX = "enc:v1:";

function getTokenEncryptionSecret() {
  const secret =
    process.env.XERO_TOKEN_ENCRYPTION_KEY ??
    process.env.TOKEN_ENCRYPTION_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error("Xero token encryption is not configured.");
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

async function getEncryptionKey() {
  const secretBytes = new TextEncoder().encode(getTokenEncryptionSecret());
  const keyBytes = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function isEncryptedToken(token: string) {
  return token.startsWith(ENCRYPTED_TOKEN_PREFIX);
}

export async function encryptToken(token: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token),
  );

  return `${ENCRYPTED_TOKEN_PREFIX}${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptToken(token: string) {
  if (!isEncryptedToken(token)) return token;

  const payload = token.slice(ENCRYPTED_TOKEN_PREFIX.length);
  const [ivPart, ciphertextPart] = payload.split(".");
  if (!ivPart || !ciphertextPart) {
    throw new Error("Stored Xero token is malformed.");
  }

  const key = await getEncryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(ivPart) },
    key,
    base64UrlToBytes(ciphertextPart),
  );
  return new TextDecoder().decode(plaintext);
}
