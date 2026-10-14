// Headshots keyed by kebab-case name: client/src/images/headshots/<slug>.jpg
const HEADSHOTS = import.meta.glob<string>("@/images/headshots/*.jpg", {
  eager: true,
  import: "default",
});

export function photoFor(slug: string): string | undefined {
  const hit = Object.entries(HEADSHOTS).find(([p]) =>
    p.endsWith(`/${slug}.jpg`)
  );
  return hit?.[1];
}

export * from "./chapter-roster.js";
import { chapterMemberForName } from "./chapter-roster.js";

export function chapterPhotoForName(name: string) {
  const member = chapterMemberForName(name);
  return member?.photoSlug
    ? (photoFor(`${member.photoSlug}-face`) ?? photoFor(member.photoSlug))
    : undefined;
}
