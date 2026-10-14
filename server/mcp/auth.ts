import { randomBytes, randomUUID, createHash } from "node:crypto";
import { Router, urlencoded, type Request, type RequestHandler } from "express";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import type {
  OAuthServerProvider,
  AuthorizationParams,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  InvalidGrantError,
  InvalidTokenError,
  InvalidScopeError,
  InvalidTargetError,
  InvalidClientMetadataError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { McpBackend, Scope } from "./server.js";
export interface AuthStore {
  get(key: string): Promise<any>;
  put(key: string, value: unknown, expiresAt: number): Promise<void>;
  take(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  revokeUser(userId: string): Promise<void>;
}
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const random = () => randomBytes(32).toString("hex");
const hour = 3600000,
  day = 24 * hour;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
export class SepOAuthProvider implements OAuthServerProvider {
  resource: URL;
  constructor(
    readonly origin: string,
    readonly store: AuthStore,
    readonly backend: McpBackend
  ) {
    this.resource = new URL("/api/mcp", origin);
  }
  clientsStore = {
    getClient: async (id: string) => this.store.get(`client:${id}`),
    registerClient: async (
      input: Omit<
        OAuthClientInformationFull,
        "client_id" | "client_id_issued_at"
      >
    ): Promise<OAuthClientInformationFull> => {
      if (!input.redirect_uris.length || input.redirect_uris.length > 8)
        throw new InvalidClientMetadataError(
          "Choose one to eight redirect URLs."
        );
      for (const value of input.redirect_uris) {
        const u = new URL(value);
        if (u.protocol !== "https:" || u.username || u.password || u.hash)
          throw new InvalidClientMetadataError(
            "Redirect URLs must use HTTPS without credentials or fragments."
          );
      }
      const client: OAuthClientInformationFull = {
        client_id: randomUUID(),
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: String(input.client_name || "AI assistant").slice(0, 100),
        redirect_uris: input.redirect_uris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        scope: "sep:read sep:write",
      };
      await this.store.put(
        `client:${client.client_id}`,
        client,
        Date.now() + 365 * day
      );
      return client;
    },
  };
  checkResource(resource?: URL) {
    if (resource && resource.href !== this.resource.href)
      throw new InvalidTargetError(
        "Tokens are issued only for this SEP MCP endpoint."
      );
  }
  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: any
  ) {
    this.checkResource(params.resource);
    // Validate the client's requested scopes. The consent page separately
    // lets the signed-in member opt into role-permitted updates (RFC 6749 §3.3).
    // Token responses report the scopes actually approved by that member.
    const scopes = params.scopes?.length
      ? params.scopes
      : ["sep:read", "sep:write"];
    if (
      !scopes.includes("sep:read") ||
      scopes.some(s => !["sep:read", "sep:write"].includes(s))
    )
      throw new InvalidScopeError("Supported scopes: sep:read sep:write.");
    const request = random();
    await this.store.put(
      `pending:${tokenHash(request)}`,
      {
        clientId: client.client_id,
        clientName: client.client_name,
        redirectUri: params.redirectUri,
        state: params.state,
        codeChallenge: params.codeChallenge,
        scopes,
        resource: this.resource.href,
      },
      Date.now() + 10 * 60000
    );
    res.redirect(`/api/mcp/consent?request=${request}`);
  }
  async code(client: OAuthClientInformationFull, code: string) {
    const row = await this.store.get(`code:${tokenHash(code)}`);
    if (!row || row.clientId !== client.client_id)
      throw new InvalidGrantError("Authorization expired or invalid.");
    return row;
  }
  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    code: string
  ) {
    return (await this.code(client, code)).codeChallenge;
  }
  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    code: string,
    verifier?: string,
    redirect?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    this.checkResource(resource);
    const row = await this.code(client, code);
    // The SDK verifies S256 before calling this method and then omits the verifier.
    if (
      redirect !== row.redirectUri ||
      (verifier !== undefined &&
        createHash("sha256").update(verifier).digest("base64url") !==
          row.codeChallenge)
    )
      throw new InvalidGrantError("Invalid redirect or PKCE verifier.");
    if (!(await this.store.take(`code:${tokenHash(code)}`)))
      throw new InvalidGrantError("Code already used.");
    await this.backend.state(row.userId);
    const grantId = randomUUID();
    await this.store.put(
      `grant:${grantId}`,
      { userId: row.userId, clientId: row.clientId },
      Date.now() + 30 * day
    );
    return this.issue({ ...row, grantId });
  }
  async issue(row: any): Promise<OAuthTokens> {
    const access = random(),
      refresh = random();
    await this.store.put(
      `access:${tokenHash(access)}`,
      { ...row, expiresAt: Math.floor((Date.now() + hour) / 1000) },
      Date.now() + hour
    );
    await this.store.put(
      `refresh:${tokenHash(refresh)}`,
      row,
      Date.now() + 30 * day
    );
    return {
      access_token: access,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refresh,
      scope: row.scopes.join(" "),
    };
  }
  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    token: string,
    scopes?: string[],
    resource?: URL
  ) {
    this.checkResource(resource);
    const key = `refresh:${tokenHash(token)}`,
      row = await this.store.get(key);
    if (
      !row ||
      row.clientId !== client.client_id ||
      !(await this.store.get(`grant:${row.grantId}`))
    )
      throw new InvalidGrantError("Reconnect your SEP account.");
    if (scopes?.some(s => !row.scopes.includes(s)))
      throw new InvalidScopeError("Cannot expand this connection.");
    await this.backend.state(row.userId);
    if (!(await this.store.take(key)))
      throw new InvalidGrantError("Refresh token already used.");
    return this.issue({ ...row, scopes: scopes?.length ? scopes : row.scopes });
  }
  async verifyAccessToken(token: string) {
    const row = await this.store.get(`access:${tokenHash(token)}`);
    if (!row || !(await this.store.get(`grant:${row.grantId}`)))
      throw new InvalidTokenError("Reconnect your SEP account.");
    try {
      await this.backend.state(row.userId);
    } catch {
      throw new InvalidTokenError("Chapter membership is no longer active.");
    }
    return {
      token,
      clientId: row.clientId,
      scopes: row.scopes,
      expiresAt: row.expiresAt,
      resource: this.resource,
      extra: { userId: row.userId },
    };
  }
  async revokeToken(
    client: OAuthClientInformationFull,
    request: { token: string }
  ) {
    const key = tokenHash(request.token),
      row =
        (await this.store.get(`access:${key}`)) ||
        (await this.store.get(`refresh:${key}`));
    if (row?.clientId === client.client_id)
      await this.store.delete(`grant:${row.grantId}`);
  }
}
export function createOAuthRoutes(
  provider: SepOAuthProvider,
  session: RequestHandler,
  identity: (req: Request) => string | undefined
) {
  const router = Router();
  router.use(
    mcpAuthRouter({
      provider,
      issuerUrl: new URL(provider.origin),
      baseUrl: new URL("/api/mcp/oauth/", provider.origin),
      resourceServerUrl: provider.resource,
      scopesSupported: ["sep:read", "sep:write"],
      resourceName: "SEP member platform",
    })
  );
  router.get("/api/mcp/config", session, async (req, res, next) => {
    try {
      const id = identity(req);
      if (!id) return res.status(401).json({ error: "Sign in to SEP first." });
      await provider.backend.state(id);
      res.set("Cache-Control", "no-store").json({
        enabled: true,
        endpoint: provider.resource.href,
        local: !provider.origin.startsWith("https:"),
      });
    } catch (e) {
      next(e);
    }
  });
  router.use("/api/mcp/consent", session);
  router.get("/api/mcp/consent", async (req, res, next) => {
    try {
      res.set({
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
        // no-referrer makes browsers submit HTML forms with Origin: null,
        // which conflicts with the strict same-origin consent check below.
        // Keep the origin for our form without sending referrers to assistants.
        "Referrer-Policy": "same-origin",
      });
      const request = String(req.query.request || ""),
        pending = await provider.store.get(`pending:${tokenHash(request)}`);
      if (!pending)
        return res
          .status(400)
          .send("Connection request expired. Start again in your assistant.");
      const userId = identity(req);
      if (!userId)
        return res.redirect(
          `/login?next=${encodeURIComponent(`/api/mcp/consent?request=${request}`)}`
        );
      const s = await provider.backend.state(userId),
        csrf = random();
      // Claude may request only the minimum sep:read scope from the 401
      // challenge. Always offer an explicit, unchecked update choice to the
      // member; never silently expand an existing grant or refresh token.
      const consentScopes = ["sep:read", "sep:write"];
      // Chromium applies form-action to the redirect destination as well as
      // the form target. Permit only this validated client's callback origin.
      res.set(
        "Content-Security-Policy",
        `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${new URL(pending.redirectUri).origin}; frame-ancestors 'none'`
      );
      await provider.store.put(
        `pending:${tokenHash(request)}`,
        { ...pending, userId, csrfHash: tokenHash(csrf), consentScopes },
        Date.now() + 10 * 60000
      );
      res.cookie("sep_mcp_consent", csrf, {
        httpOnly: true,
        secure: provider.origin.startsWith("https:"),
        sameSite: "lax",
        path: "/api/mcp/consent",
        maxAge: 10 * 60000,
      });
      res
        .type("html")
        .send(
          `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Connect SEP</title><style>body{font:16px system-ui;background:#f5f3ee;color:#233452;padding:24px;max-width:520px;margin:8vh auto;line-height:1.6}button{background:#233452;color:white;padding:14px 20px;border:0;border-radius:8px;font:inherit;margin:10px 12px 0 0}small{display:block;color:#556}label{display:block;margin:20px 0}</style></head><body><h1>Connect your SEP account</h1><p><strong>${esc(pending.clientName || "AI assistant")}</strong> is requesting access as <strong>${esc(s.user.name)}</strong> (${esc(s.user.role)}).</p><p>It can read the platform records you can access, including member contact details and profile information${s.user.role === "master" ? ", class progress, strikes, makeup work and private questions" : ""}.</p><small>Connection destination: ${esc(new URL(pending.redirectUri).host)}. Approve only if you started this connection in your assistant.</small><form method="post" action="/api/mcp/consent"><input type="hidden" name="request" value="${esc(request)}"><label style="padding:18px;border:1px solid #b9c2ce;border-radius:10px;background:white"><input type="checkbox" name="write" value="yes" style="width:20px;height:20px;vertical-align:middle;margin-right:8px"> <strong>Also allow updates permitted by my chapter role</strong><small style="margin-top:8px">Enable this to let your assistant issue or report strikes, assign makeup tasks, and make other changes your chapter role allows. Leave it off for read-only access.</small></label><p>Access expires after 30 days. Disconnecting revokes this connection.</p><button name="decision" value="allow">Connect</button><button name="decision" value="deny">Cancel</button></form></body></html>`
        );
    } catch (e) {
      next(e);
    }
  });
  router.post(
    "/api/mcp/consent",
    urlencoded({ extended: false }),
    async (req, res, next) => {
      try {
        if (req.headers.origin !== provider.origin)
          return res.status(403).send("Use the SEP connection page.");
        const key = `pending:${tokenHash(String(req.body.request || ""))}`,
          pending = await provider.store.get(key);
        if (
          !pending ||
          pending.userId !== identity(req) ||
          tokenHash(req.cookies?.sep_mcp_consent || "") !== pending.csrfHash
        )
          return res
            .status(403)
            .send("Connection request expired. Please start again.");
        await provider.backend.state(pending.userId);
        if (!(await provider.store.take(key)))
          return res.status(409).send("Request already completed.");
        const redirect = new URL(pending.redirectUri);
        if (pending.state) redirect.searchParams.set("state", pending.state);
        if (req.body.decision !== "allow")
          redirect.searchParams.set("error", "access_denied");
        else {
          const code = random();
          await provider.store.put(
            `code:${tokenHash(code)}`,
            {
              ...pending,
              requestedScopes: pending.scopes,
              scopes:
                req.body.write === "yes" &&
                pending.consentScopes?.includes("sep:write")
                  ? ["sep:read", "sep:write"]
                  : ["sep:read"],
            },
            Date.now() + 60000
          );
          redirect.searchParams.set("code", code);
        }
        res.clearCookie("sep_mcp_consent", { path: "/api/mcp/consent" });
        // Vercel supplies res.redirect() with a 307 default, unlike Express's
        // 302. The assistant callback must receive GET, never this form POST.
        res.status(303).set("Location", redirect.href).end();
      } catch (e) {
        next(e);
      }
    }
  );
  return router;
}
export function memoryAuthStore(): AuthStore {
  const rows = new Map<string, { value: unknown; expires: number }>();
  const get = async (key: string) => {
    const row = rows.get(key);
    if (!row || row.expires <= Date.now()) {
      rows.delete(key);
      return undefined;
    }
    return structuredClone(row.value);
  };
  return {
    get,
    put: async (key, value, expires) => {
      rows.set(key, { value: structuredClone(value), expires });
    },
    take: async key => {
      const row = rows.get(key);
      rows.delete(key);
      return row && row.expires > Date.now()
        ? structuredClone(row.value)
        : undefined;
    },
    delete: async key => {
      rows.delete(key);
    },
    revokeUser: async userId => {
      for (const [key, row] of rows)
        if ((row.value as any)?.userId === userId) rows.delete(key);
    },
  };
}
