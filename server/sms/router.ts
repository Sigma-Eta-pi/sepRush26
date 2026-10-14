import { Router, type RequestHandler, type Request } from "express";
import { z } from "zod";
import { fail } from "../process/engine.js";
import type { SmsService, IncomingText } from "./service.js";
import { verifyRelay } from "./voice.js";
export function smsRouter(options: {
  service: SmsService;
  session: RequestHandler;
  identity: (req: Request) => string | undefined;
  enabled: () => boolean;
  configured: () => boolean;
  secret: () => string;
  decode: (payload: Record<string, unknown>) => Promise<IncomingText>;
  demo?: (actorId: string) => Promise<unknown>;
}) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const run =
    (fn: (req: Request) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
      fn(req)
        .then(x => res.json(x))
        .catch(next);
    };
  router.post(
    "/ingest",
    run(async req => {
      if (!options.enabled() || !options.configured())
        fail("Text importing is not enabled or configured.", 503);
      const payload = verifyRelay(req.body, options.secret());
      const item = await options.service.receive(await options.decode(payload));
      // Relay only needs delivery status, never chapter records or profile details.
      return {
        ok: true,
        id: item.id,
        status: item.status,
        retry: ["failed", "processing"].includes(item.status),
      };
    })
  );
  router.use(options.session);
  const identity = (req: Request) =>
    options.identity(req) || fail("Sign in first.", 401);
  router.get(
    "/",
    run(async req => ({
      ...(await options.service.inbox(identity(req))),
      enabled: options.enabled(),
      configured: options.configured(),
      demo: !!options.demo,
    }))
  );
  router.post(
    "/binding",
    run(async req => {
      const b = z
        .object({
          userId: z.string().max(160),
          phone: z.string().max(30),
          verified: z.literal(true),
        })
        .strict()
        .parse(req.body);
      return options.service.bind(identity(req), b.userId, b.phone, b.verified);
    })
  );
  router.post(
    "/unbind",
    run(async req =>
      options.service.unbind(
        identity(req),
        z.string().max(160).parse(req.body.userId)
      )
    )
  );
  router.post(
    "/retry",
    run(async req =>
      options.service.retry(
        identity(req),
        z.string().max(160).parse(req.body.id)
      )
    )
  );
  router.post(
    "/resolve",
    run(async req => {
      const b = z
        .object({
          id: z.string().max(160),
          decision: z.enum(["ignore", "report"]),
          fields: z
            .object({
              pledgeId: z.string().max(160),
              reason: z.string().trim().min(1).max(2000),
              date: z.string().max(10),
              points: z.number().int().min(1).max(3),
            })
            .strict()
            .optional(),
        })
        .strict()
        .parse(req.body);
      return options.service.resolve(identity(req), b.id, b.decision, b.fields);
    })
  );
  if (options.demo)
    router.post(
      "/demo",
      run(async req => {
        await options.service.inbox(identity(req));
        return options.demo!(identity(req));
      })
    );
  router.use((err: any, _req: Request, res: any, next: any) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Check the text-report fields." });
      return;
    }
    next(err);
  });
  return router;
}
