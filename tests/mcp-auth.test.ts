import { it, expect } from "vitest";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  SepOAuthProvider,
  memoryAuthStore,
  createOAuthRoutes,
} from "../server/mcp/auth";
import { mcpHttpRouter } from "../server/mcp/http";
import { mcpFixture } from "./mcp-fixture";
async function setup(vercelRedirects = false) {
  const f = mcpFixture(),
    app = express();
  app.use(express.json());
  app.use(cookieParser());
  if (vercelRedirects)
    app.use((_req, res, next) => {
      // Vercel's own response helper survives Express's prototype setup and
      // defaults to a method-preserving 307, not Express's 302.
      Object.defineProperty(res, "redirect", {
        value: (statusOrUrl: number | string, url?: string) => {
          res
            .status(typeof statusOrUrl === "number" ? statusOrUrl : 307)
            .set(
              "Location",
              typeof statusOrUrl === "string" ? statusOrUrl : url!
            )
            .end();
        },
      });
      next();
    });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as any).port}`;
  const provider = new SepOAuthProvider(origin, memoryAuthStore(), f.backend);
  app.use(
    createOAuthRoutes(
      provider,
      (_req, _res, next) => next(),
      req =>
        typeof req.headers["x-test-user"] === "string"
          ? req.headers["x-test-user"]
          : undefined
    )
  );
  app.use("/api/mcp", mcpHttpRouter(provider));
  app.use((err: any, _req: any, res: any, _next: any) =>
    res.status(err.status || 500).json({ error: err.message })
  );
  const form = (path: string, data: Record<string, string>, headers = {}) =>
    fetch(origin + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body: new URLSearchParams(data),
      redirect: "manual",
    });
  const register = async () => {
    const r = await fetch(origin + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Test client",
        redirect_uris: ["https://client.example/callback"],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      }),
    });
    expect(r.status).toBe(201);
    return r.json();
  };
  async function begin(
    client: any,
    scope: string | null = "sep:read sep:write"
  ) {
    const verifier = randomBytes(32).toString("base64url"),
      challenge = createHash("sha256").update(verifier).digest("base64url");
    const query = new URLSearchParams({
      client_id: client.client_id,
      response_type: "code",
      redirect_uri: client.redirect_uris[0],
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource: provider.resource.href,
      scope: "sep:read sep:write",
      state: "test-state",
    });
    if (scope === null) query.delete("scope");
    else query.set("scope", scope);
    const r = await fetch(origin + "/authorize?" + query, {
      redirect: "manual",
    });
    expect(r.status).toBe(vercelRedirects ? 307 : 302);
    return { verifier, path: r.headers.get("location")! };
  }
  async function consent(
    client: any,
    write = true,
    scope: string | null = "sep:read sep:write"
  ) {
    const pending = await begin(client, scope);
    const page = await fetch(origin + pending.path, {
      headers: { "x-test-user": f.master.id },
    });
    expect(page.status).toBe(200);
    // Real HTML form submissions must retain Origin for the CSRF check.
    expect(page.headers.get("referrer-policy")).toBe("same-origin");
    expect(page.headers.get("content-security-policy")).toContain(
      "form-action 'self' https://client.example;"
    );
    const html = await page.text();
    expect(html.includes('name="write"')).toBe(true);
    expect(html).not.toContain("checked");
    const cookie = page.headers.get("set-cookie")!.split(";")[0],
      request = new URL(pending.path, origin).searchParams.get("request")!;
    const r = await form(
      "/api/mcp/consent",
      { request, decision: "allow", ...(write ? { write: "yes" } : {}) },
      { Origin: origin, Cookie: cookie, "x-test-user": f.master.id }
    );
    expect(r.status).toBe(303);
    const redirect = new URL(r.headers.get("location")!);
    expect(redirect.searchParams.get("state")).toBe("test-state");
    return { ...pending, code: redirect.searchParams.get("code")! };
  }
  const exchange = (client: any, grant: any, verifier = grant.verifier) =>
    form("/token", {
      grant_type: "authorization_code",
      client_id: client.client_id,
      code: grant.code,
      code_verifier: verifier,
      redirect_uri: client.redirect_uris[0],
      resource: provider.resource.href,
    });
  return {
    f,
    origin,
    provider,
    form,
    register,
    begin,
    consent,
    exchange,
    close: () =>
      new Promise<void>(resolve => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
it.each([false, true])(
  "completes consent and PKCE, connects a real MCP HTTP client, rotates refresh tokens and revokes access (Vercel helpers: %s)",
  async vercelRedirects => {
    const t = await setup(vercelRedirects);
    try {
      const metadata = await (
        await fetch(t.origin + "/.well-known/oauth-protected-resource/api/mcp")
      ).json();
      expect(metadata.resource).toBe(t.provider.resource.href);
      const client = await t.register(),
        grant = await t.consent(client);
      expect((await t.exchange(client, grant, "wrong")).status).toBe(400);
      const response = await t.exchange(client, grant);
      if (response.status !== 200)
        throw new Error(JSON.stringify(await response.json()));
      expect(response.status).toBe(200);
      const tokens = await response.json();
      expect(tokens.scope).toBe("sep:read sep:write");
      expect((await t.exchange(client, grant)).status).toBe(400);
      const mcp = new Client({ name: "integration-test", version: "1" });
      await mcp.connect(
        new StreamableHTTPClientTransport(t.provider.resource, {
          requestInit: {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          },
        })
      );
      const ctx: any = await mcp.callTool({
        name: "sep_get_context",
        arguments: {},
      });
      expect(ctx.structuredContent.user.id).toBe(t.f.master.id);
      await mcp.close();
      const refresh = await t.form("/token", {
        grant_type: "refresh_token",
        client_id: client.client_id,
        refresh_token: tokens.refresh_token,
        resource: t.provider.resource.href,
      });
      expect(refresh.status).toBe(200);
      const next = await refresh.json();
      expect(
        (
          await t.form("/token", {
            grant_type: "refresh_token",
            client_id: client.client_id,
            refresh_token: tokens.refresh_token,
          })
        ).status
      ).toBe(400);
      await t.provider.revokeToken(client, { token: next.refresh_token });
      await expect(
        t.provider.verifyAccessToken(next.access_token)
      ).rejects.toThrow("Reconnect");
      await expect(
        t.provider.verifyAccessToken(tokens.access_token)
      ).rejects.toThrow("Reconnect");
    } finally {
      await t.close();
    }
  }
);
it("rejects absent, opaque and foreign origins even with a valid consent cookie", async () => {
  const t = await setup();
  try {
    const client = await t.register(),
      pending = await t.begin(client);
    const page = await fetch(t.origin + pending.path, {
      headers: { "x-test-user": t.f.master.id },
    });
    const cookie = page.headers.get("set-cookie")!.split(";")[0];
    const data = {
      request: new URL(pending.path, t.origin).searchParams.get("request")!,
      decision: "allow",
    };
    for (const origin of [undefined, "null", "https://untrusted.example"]) {
      const response = await t.form("/api/mcp/consent", data, {
        Cookie: cookie,
        "x-test-user": t.f.master.id,
        ...(origin ? { Origin: origin } : {}),
      });
      expect(response.status).toBe(403);
    }
    expect(
      (
        await t.form("/api/mcp/consent", data, {
          Origin: t.origin,
          "x-test-user": t.f.master.id,
        })
      ).status
    ).toBe(403);
    // Rejected requests must not consume the genuine member's consent.
    expect(
      (
        await t.form("/api/mcp/consent", data, {
          Origin: t.origin,
          Cookie: cookie,
          "x-test-user": t.f.master.id,
        })
      ).status
    ).toBe(303);
  } finally {
    await t.close();
  }
});
it("requires authentication and same-origin consent, defaults consent to read-only and checks token audience and membership", async () => {
  const t = await setup();
  try {
    expect(
      (
        await fetch(t.origin + "/api/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status
    ).toBe(401);
    const client = await t.register(),
      pending = await t.begin(client);
    const login = await fetch(t.origin + pending.path, { redirect: "manual" });
    expect(login.status).toBe(302);
    expect(login.headers.get("location")).toMatch(/^\/login\?next=/);
    expect(
      (
        await t.form(
          "/api/mcp/consent",
          {
            request: new URL(pending.path, t.origin).searchParams.get(
              "request"
            )!,
            decision: "allow",
          },
          { Origin: "https://untrusted.example", "x-test-user": t.f.master.id }
        )
      ).status
    ).toBe(403);
    const grant = await t.consent(client, false),
      response = await t.exchange(client, grant),
      tokens = await response.json();
    expect(tokens.scope).toBe("sep:read");
    await expect(
      t.provider.exchangeRefreshToken(client, tokens.refresh_token, [
        "sep:read",
        "sep:write",
      ])
    ).rejects.toThrow("Cannot expand");
    await expect(
      t.provider.exchangeRefreshToken(
        client,
        tokens.refresh_token,
        undefined,
        new URL("https://elsewhere.example")
      )
    ).rejects.toThrow("only for this SEP");
    const other = await t.register();
    await expect(
      t.provider.exchangeRefreshToken(other, tokens.refresh_token)
    ).rejects.toThrow("Reconnect");
    t.f.master.archived = true;
    await expect(
      t.provider.verifyAccessToken(tokens.access_token)
    ).rejects.toThrow("no longer active");
    await t.provider.store.revokeUser(t.f.master.id);
    t.f.master.archived = false;
    await expect(
      t.provider.verifyAccessToken(tokens.access_token)
    ).rejects.toThrow("Reconnect");
  } finally {
    await t.close();
  }
});

it.each([
  [null, true, "sep:read sep:write"],
  [null, false, "sep:read"],
  ["sep:read", true, "sep:read sep:write"],
  ["sep:read", false, "sep:read"],
] as const)(
  "handles omitted/explicit scopes (%s) with explicit write consent (%s)",
  async (scope, write, expected) => {
    const t = await setup();
    try {
      const client = await t.register();
      const grant = await t.consent(client, write, scope);
      const response = await t.exchange(client, grant);
      expect(response.status).toBe(200);
      const tokens = await response.json();
      expect(tokens.scope).toBe(expected);
      const mcp = new Client({ name: "scope-choice-regression", version: "1" });
      await mcp.connect(
        new StreamableHTTPClientTransport(t.provider.resource, {
          requestInit: {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          },
        })
      );
      try {
        const tools = (await mcp.listTools()).tools.map(tool => tool.name);
        expect(tools.includes("sep_report_strike")).toBe(write);
        if (write) {
          const result = await mcp.callTool({
            name: "sep_report_strike",
            arguments: {
              requestId: randomUUID(),
              pledgeId: t.f.pledge.id,
              date: "2026-10-12",
              reason: "Synthetic permission regression",
              points: 1,
            },
          });
          expect(result.isError).not.toBe(true);
          expect(
            (await t.f.backend.state(t.f.master.id)).strikes.some(
              s =>
                s.reason === "Synthetic permission regression" &&
                s.status === "approved"
            )
          ).toBe(true);
        }
      } finally {
        await mcp.close();
      }
    } finally {
      await t.close();
    }
  }
);
