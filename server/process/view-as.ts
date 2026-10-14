import type { Request, RequestHandler } from "express";

export const VIEW_AS_HEADER = "x-sep-view-as";
/** The member an admin asked to view as, once the guard has allowed it. */
export const viewAsId = (req: Request): string | undefined =>
  req.res?.locals.viewAs;
/**
 * Admins may load the portal as another member, read-only. The header is
 * ignored for nobody: a non-admin sending it is refused, and so is any write.
 */
export function viewAsGuard(
  isAdmin: (req: Request) => boolean | Promise<boolean>
): RequestHandler {
  return async (req, res, next) => {
    try {
      const id = req.get(VIEW_AS_HEADER);
      if (!id) return next();
      if (id.length > 150 || !(await isAdmin(req))) {
        res
          .status(403)
          .json({ error: "Only chapter admins can view as another member." });
        return;
      }
      if (!["GET", "HEAD"].includes(req.method)) {
        res.status(403).json({
          error:
            "You’re viewing as another member, so nothing can be changed. Exit the view to make changes.",
        });
        return;
      }
      res.locals.viewAs = id;
      next();
    } catch (e) {
      next(e);
    }
  };
}
