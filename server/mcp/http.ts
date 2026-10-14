import { Router } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { createSepMcpServer, type Scope } from "./server.js";
import type { SepOAuthProvider } from "./auth.js";
export function mcpHttpRouter(provider: SepOAuthProvider) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  router.use((req, res, next) => {
    if (req.headers.origin && req.headers.origin !== provider.origin)
      return res.status(403).json({ error: "Origin is not allowed." });
    next();
  });
  router.use(
    requireBearerAuth({
      verifier: provider,
      requiredScopes: ["sep:read"],
      expectedResource: provider.resource,
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(
        provider.resource
      ),
    })
  );
  router.post("/", async (req, res, next) => {
    try {
      const userId = String(req.auth!.extra!.userId),
        scopes = req.auth!.scopes as Scope[];
      const server = await createSepMcpServer(provider.backend, userId, scopes);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      next(e);
    }
  });
  router.all("/", (_req, res) => {
    res.set("Allow", "POST");
    res.status(405).json({ error: "Use Streamable HTTP POST." });
  });
  return router;
}
