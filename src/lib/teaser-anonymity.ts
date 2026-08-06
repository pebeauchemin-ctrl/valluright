export type TeaserPublicText = {
  field: string;
  text: string;
};

export type TeaserAnonymityWarning = {
  field: string;
  kind: "business_name" | "precise_location";
  matchedText: string;
  message: string;
};

const ENTITY_SUFFIXES = new Set([
  "inc",
  "incorporated",
  "llc",
  "llp",
  "lp",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "company",
  "dba",
  "db",
  "a",
]);

const COMMON_NAME_WORDS = new Set(["the", "and", "for", "of", "at", "in", "by"]);

function normalizedWords(value: string) {
  return value
    .toLowerCase()
    .replace(/d\\s*[/\\.]?\\s*b\\s*[/\\.]?\\s*a/g, " dba ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\\s+/)
    .filter(Boolean);
}

function businessNameTerms(businessName: string) {
  const words = normalizedWords(businessName).filter(
    (word) => !ENTITY_SUFFIXES.has(word) && !COMMON_NAME_WORDS.has(word),
  );
  const phrases = new Set<string>();

  for (let length = Math.min(4, words.length); length >= 2; length -= 1) {
    for (let start = 0; start <= words.length - length; start += 1) {
      phrases.add(words.slice(start, start + length).join(" "));
    }
  }

  if (phrases.size === 0) {
    for (const word of words) {
      if (word.length >= 4) phrases.add(word);
    }
  }

  return [...phrases].sort((left, right) => right.length - left.length);
}

function containsWords(text: string, phrase: string) {
  const normalized = normalizedWords(text).join(" ");
  return normalized.includes(phrase);
}

function locationMatches(text: string) {
  const patterns = [
    /\\b\\d{1,5}\\s+(?:[a-z0-9.'-]+\\s+){0,4}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|highway|hwy|way|parkway|pkwy)\\b/i,
    /\\b\\d{5}(?:-\\d{4})?\\b/,
    /\\b\\d{1,3}\\s+miles?\\s+(?:(?:north|south|east|west|northeast|northwest|southeast|southwest)\\s+)?(?:of|from)\\s+[a-z][a-z .'-]{1,60}/i,
  ];

  return patterns
    .map((pattern) => text.match(pattern)?.[0])
    .filter((match): match is string => Boolean(match));
}

export function analyzeTeaserAnonymity(
  businessName: string | null | undefined,
  publicText: TeaserPublicText[],
): TeaserAnonymityWarning[] {
  const terms = businessName ? businessNameTerms(businessName) : [];
  const warnings: TeaserAnonymityWarning[] = [];

  for (const item of publicText) {
    if (!item.text.trim()) continue;

    const nameMatch = terms.find((term) => containsWords(item.text, term));
    if (nameMatch) {
      warnings.push({
        field: item.field,
        kind: "business_name",
        matchedText: nameMatch,
        message: `This text appears to include the business name: "${nameMatch}".`,
      });
    }

    for (const locationMatch of locationMatches(item.text)) {
      warnings.push({
        field: item.field,
        kind: "precise_location",
        matchedText: locationMatch,
        message: `This text appears to include a precise location: "${locationMatch}".`,
      });
    }
  }

  return warnings;
}
