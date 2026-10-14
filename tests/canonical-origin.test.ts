import { describe, expect, it } from "vitest";
import { canonicalChapterUrl } from "../client/src/lib/canonical-origin";

describe("chapter domain recovery", () => {
  it.each(["ucsbsep.com", "ucsbsep.org", "www.ucsbsep.org"])(
    "moves %s to the canonical domain while preserving navigation",
    (host) => {
      expect(canonicalChapterUrl(`https://${host}/`)).toBe("https://www.ucsbsep.com/");
      expect(canonicalChapterUrl(`https://${host}/login?next=%2Fdashboard%2Fmembers#profile`))
        .toBe("https://www.ucsbsep.com/login?next=%2Fdashboard%2Fmembers#profile");
    },
  );

  it.each([
    "https://www.ucsbsep.com/login",
    "http://localhost:3000/dashboard/members",
    "http://127.0.0.1:4317/",
    "https://sep-rush26-example.vercel.app/",
    "https://ucsbsep.com.example.org/",
  ])("leaves canonical, local, preview and unrelated hosts unchanged: %s", (url) => {
    expect(canonicalChapterUrl(url)).toBeNull();
  });
});
