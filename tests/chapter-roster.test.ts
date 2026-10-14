import { it, expect } from "vitest";
import {
  FOUNDERS,
  FOUNDING_CLASS,
  chapterClassForName,
  chapterRoleForName,
  PUBLIC_CHAPTER_MEMBERS,
} from "../client/src/data/chapter-roster";
it("uses the website's distinct Founder and Founding lists with Alpha as the fallback", () => {
  expect(FOUNDERS).toHaveLength(8);
  expect(FOUNDING_CLASS).toHaveLength(31);
  for (const member of FOUNDERS)
    expect(chapterClassForName(member.name)).toBe("Founder");
  for (const member of FOUNDING_CLASS)
    expect(chapterClassForName(member.name)).toBe("Founding");
  expect(chapterClassForName("New Alpha Member")).toBe("Alpha");
});
it("resolves full names and Notion nicknames without duplicating members or reviving former offices", () => {
  expect(chapterClassForName("Stina Sfatcu")).toBe("Founder");
  expect(chapterClassForName("Vaibhava Rajesh")).toBe("Founding");
  expect(chapterRoleForName("Matthew Roman Vasquez")).toBe(
    "VP of External Affairs"
  );
  expect(chapterRoleForName("Sally Hu")).toBe("Founder");
  expect(chapterRoleForName("Kate Heidenga")).toBe("Co-President");
  expect(PUBLIC_CHAPTER_MEMBERS).toHaveLength(39);
});
