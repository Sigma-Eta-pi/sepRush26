// Public read-only smoke check. The root document must redirect before it can
// start same-origin API calls from an alias host (the source of a CORS outage).
import assert from "node:assert/strict";

const canonical = "https://www.ucsbsep.com";
for (const host of ["ucsbsep.com", "ucsbsep.org", "www.ucsbsep.org"]) {
  for (const path of ["/", "/login?next=%2Fdashboard", "/api/auth/config"]) {
    const response = await fetch(`https://${host}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    assert.ok([301, 308].includes(response.status), `${host}${path} must permanently redirect`);
    assert.equal(response.headers.get("location"), canonical + path);
    console.log(`PASS ${host}${path} redirects to the canonical origin`);
  }
}
for (const [path, status] of [
  ["/", 200],
  ["/login", 200],
  ["/api/auth/config", 200],
  ["/api/content/home", 200],
  ["/api/auth/me", 401],
] as const) {
  const response = await fetch(canonical + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(response.status, status, `Canonical ${path} status`);
  assert.equal(response.headers.get("location"), null);
  if (path.startsWith("/api/")) {
    assert.match(response.headers.get("content-type") || "", /application\/json/);
  }
  console.log(`PASS canonical ${path} returns ${status} without a redirect`);
}
