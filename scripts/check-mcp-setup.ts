import "dotenv/config";

// Public checks that create no clients, grants, tokens or chapter records.
// Never print environment values or send credentials.
const supplied = process.argv[2] || process.env.APP_ORIGIN;
if (!supplied) {
  console.error("Usage: pnpm check:mcp https://www.ucsbsep.com");
  process.exit(1);
}
const url = new URL(supplied);
if (
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/" ||
  (url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    ))
) {
  throw new Error("Use a bare HTTPS origin, or HTTP localhost for preview.");
}
const origin = url.origin;
let failed = false;
async function check(
  label: string,
  path: string,
  valid: (response: Response, body: any) => boolean,
  init: RequestInit = {}
) {
  try {
    const response = await fetch(origin + path, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    const body = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : null;
    const ok = valid(response, body);
    console.log(`${ok ? "PASS" : "FAIL"} ${label} (HTTP ${response.status})`);
    failed ||= !ok;
    return ok ? body : null;
  } catch {
    failed = true;
    console.log(`FAIL ${label}: endpoint could not be checked`);
  }
}
const discovery = await check(
  "OAuth discovery",
  "/.well-known/oauth-authorization-server",
  (r, b) =>
    r.ok &&
    b?.issuer === url.href &&
    b?.code_challenge_methods_supported?.includes("S256") &&
    ["authorization_endpoint", "token_endpoint", "registration_endpoint"].every(
      key => {
        try {
          return new URL(b[key]).origin === origin;
        } catch {
          return false;
        }
      }
    )
);
if (discovery) {
  await check(
    "Advertised authorization route rejects missing client",
    new URL(discovery.authorization_endpoint).pathname,
    (r, b) => r.status === 400 && b?.error === "invalid_request"
  );
  await check(
    "Advertised token route rejects missing credentials",
    new URL(discovery.token_endpoint).pathname,
    (r, b) =>
      [400, 401].includes(r.status) &&
      ["invalid_request", "invalid_client"].includes(b?.error),
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=authorization_code",
    }
  );
}
await check(
  "Consent page preserves same-origin browser form submissions",
  "/api/mcp/consent",
  r => r.status === 400 && r.headers.get("referrer-policy") === "same-origin"
);
await check(
  "Protected resource discovery",
  "/.well-known/oauth-protected-resource/api/mcp",
  (r, b) =>
    r.ok &&
    b?.resource === origin + "/api/mcp" &&
    b?.authorization_servers?.includes(url.href)
);
await check(
  "MCP rejects unauthenticated access",
  "/api/mcp",
  r =>
    r.status === 401 &&
    !!r.headers.get("www-authenticate")?.includes("resource_metadata=")
);
await check(
  "MCP POST rejects unauthenticated initialization",
  "/api/mcp",
  r =>
    r.status === 401 &&
    !!r.headers.get("www-authenticate")?.includes("resource_metadata="),
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "sep-public-check", version: "1" },
      },
    }),
  }
);
if (url.protocol === "https:") {
  await check(
    "Google login configured",
    "/api/auth/config",
    (r, b) => r.ok && typeof b?.clientId === "string" && b.clientId.length > 0
  );
} else {
  console.log(
    "LOCAL ONLY: passing preview checks cannot connect cloud ChatGPT or Claude."
  );
}
console.log(
  "These checks do not establish an assistant connection. Complete OAuth in each assistant, then verify a read and a permitted update."
);
process.exitCode = failed ? 1 : 0;
