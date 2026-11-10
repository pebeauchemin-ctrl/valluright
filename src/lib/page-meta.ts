export const SITE_URL = "https://valuright.ai";

export const HOME_TITLE = "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom.";

export const OG_IMAGE = {
  url: `${SITE_URL}/og/valuright-og.png`,
  width: 1200,
  height: 630,
  alt: "ValuRight.ai logo with the line: Know your value. Plan your exit.",
};

export const OG_IMAGE_META = [
  { property: "og:image", content: OG_IMAGE.url },
  { property: "og:image:width", content: String(OG_IMAGE.width) },
  { property: "og:image:height", content: String(OG_IMAGE.height) },
  { property: "og:image:alt", content: OG_IMAGE.alt },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: OG_IMAGE.url },
  { name: "twitter:image:alt", content: OG_IMAGE.alt },
];

/** Title, description and social tags for one public page, all derived from the same three values. */
export function pageMeta({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}
