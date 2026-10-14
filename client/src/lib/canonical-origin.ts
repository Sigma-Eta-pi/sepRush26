const chapterAliases = new Set([
  "ucsbsep.com",
  "ucsbsep.org",
  "www.ucsbsep.org",
]);

/** Recover cached alias pages before rendering can start authenticated requests. */
export function canonicalChapterUrl(href: string): string | null {
  const url = new URL(href);
  if (!chapterAliases.has(url.hostname)) return null;
  url.protocol = "https:";
  url.hostname = "www.ucsbsep.com";
  url.port = "";
  return url.href;
}
