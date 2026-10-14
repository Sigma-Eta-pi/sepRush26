import { Router, type Request } from "express";
import type { User } from "../../client/src/member-portal/types.js";

const fields = [
  "name",
  "phone",
  "contactEmail",
  "major",
  "year",
  "hometown",
  "bio",
  "linkedin",
  "instagram",
  "pledgeClass",
  "photoUrl",
  "coverUrl",
  "coverPosition",
  "profileTags",
  "profileSections",
  "profileImages",
] as const;
export type ProfileEdit = Pick<User, (typeof fields)[number]>;
const bad = (message: string): never => {
  throw Object.assign(new Error(message), { status: 400 });
};
export function profileImageUrl(value: string) {
  return (
    value === "" ||
    /^https?:\/\//i.test(value) ||
    /^\/api\/process\/directory\/assets\/[a-f0-9]{24}\.jpg$/.test(value) ||
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
  );
}
export function validateProfileEdit(body: unknown): Partial<ProfileEdit> {
  if (!body || typeof body !== "object" || Array.isArray(body))
    bad("Invalid profile.");
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(key => !fields.includes(key as any)))
    bad("Only your profile details can be changed here.");
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field in input)) continue;
    const value = input[field];
    if (field === "profileTags") {
      if (
        !Array.isArray(value) ||
        value.length > 12 ||
        value.some(v => typeof v !== "string" || v.trim().length > 40)
      )
        bad("Use up to 12 tags, each under 40 characters.");
      out[field] = [
        ...new Set((value as string[]).map(v => v.trim()).filter(Boolean)),
      ];
    } else if (field === "profileSections") {
      if (!Array.isArray(value) || value.length > 40)
        bad("Use up to 40 additional details.");
      out[field] = (value as any[]).map(section => {
        if (
          !section ||
          typeof section.title !== "string" ||
          !section.title.trim() ||
          section.title.length > 80 ||
          typeof section.body !== "string" ||
          section.body.length > 5000
        )
          bad("Check your additional detail titles and descriptions.");
        if (/^(role|position|title|class)$/i.test(section.title.trim()))
          bad(
            "Use the class tag for your class. Chapter roles are managed separately."
          );
        const parsed: any = {
          title: section.title.trim(),
          body: section.body.trim(),
        };
        if (section.images !== undefined) {
          if (
            !Array.isArray(section.images) ||
            section.images.length > 10 ||
            section.images.some(
              (v: unknown) =>
                typeof v !== "string" ||
                v.length > 2800000 ||
                !profileImageUrl(v)
            )
          )
            bad("Invalid detail images.");
          parsed.images = section.images;
        }
        if (section.links !== undefined) {
          if (
            !Array.isArray(section.links) ||
            section.links.length > 10 ||
            section.links.some(
              (l: any) =>
                !l ||
                typeof l.label !== "string" ||
                l.label.length > 300 ||
                typeof l.url !== "string" ||
                l.url.length > 2000 ||
                !/^(https?:\/\/|mailto:|tel:)/.test(l.url)
            )
          )
            bad("Invalid detail links.");
          parsed.links = section.links;
        }
        return parsed;
      });
    } else if (field === "profileImages") {
      if (
        !Array.isArray(value) ||
        value.length > 20 ||
        value.some(
          v =>
            typeof v !== "string" || v.length > 2800000 || !profileImageUrl(v)
        )
      )
        bad("Invalid profile images.");
      out[field] = value;
    } else {
      if (typeof value !== "string") bad("Profile fields must be text.");
      const text = (value as string).trim();
      const max = ["photoUrl", "coverUrl"].includes(field)
        ? 2800000
        : field === "bio"
          ? 5000
          : ["linkedin", "instagram"].includes(field)
            ? 2000
            : 150;
      if (text.length > max) bad(`${field} is too long.`);
      if (field === "name" && !text) bad("Please enter your name.");
      if (["photoUrl", "coverUrl"].includes(field) && !profileImageUrl(text))
        bad("Choose a JPG, PNG, WebP image or a valid image URL.");
      if (field === "linkedin" && text && !/^https?:\/\//i.test(text))
        bad("LinkedIn must be a complete https:// link.");
      if (
        field === "contactEmail" &&
        text &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
      )
        bad("Enter a valid contact email.");
      if (
        field === "coverPosition" &&
        !/^center(?: (?:100|\d{1,2})(?:\.\d+)?%)?$/.test(text)
      )
        bad("Invalid cover position.");
      out[field] = text;
    }
  }
  return out as Partial<ProfileEdit>;
}
export function applyProfileEdit(
  user: User,
  edits?: Partial<ProfileEdit>
): User {
  if (!edits) return user;
  const allowed = Object.fromEntries(
    fields.filter(field => field in edits).map(field => [field, edits[field]])
  );
  return {
    ...user,
    ...allowed,
    profileEdited: true,
    photoEdited: user.photoEdited || "photoUrl" in edits,
  };
}
export function ownProfileRouter(options: {
  current: (req: Request) => Promise<User | undefined> | User | undefined;
  save: (id: string, edit: Partial<ProfileEdit>) => Promise<void> | void;
  members?: () => Promise<User[]> | User[];
  archive?: (id: string, archived: boolean) => Promise<void> | void;
}) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  router.get("/", async (req, res, next) => {
    try {
      const user = await options.current(req);
      if (!user) {
        res.status(403).json({ error: "Member access required." });
        return;
      }
      res.json(user);
    } catch (e) {
      next(e);
    }
  });
  router.put("/", async (req, res, next) => {
    try {
      const user = await options.current(req);
      if (!user) {
        res.status(403).json({ error: "Member access required." });
        return;
      }
      const edit = validateProfileEdit(req.body);
      await options.save(user.id, edit);
      res.json(applyProfileEdit(user, edit));
    } catch (e) {
      next(e);
    }
  });
  const target = async (req: Request) => {
    const actor = await options.current(req);
    if (actor?.role !== "master")
      throw Object.assign(
        new Error("Only pledge masters can manage pledge profiles."),
        { status: 403 }
      );
    const member = (await options.members?.())?.find(
      u => u.id === req.params.id && u.role === "pledge"
    );
    if (!member)
      throw Object.assign(new Error("Pledge not found."), { status: 404 });
    return member;
  };
  router.get("/pledges/:id", async (req, res, next) => {
    try {
      res.json(await target(req));
    } catch (e) {
      next(e);
    }
  });
  router.put("/pledges/:id", async (req, res, next) => {
    try {
      const user = await target(req);
      const edit = validateProfileEdit(req.body);
      await options.save(user.id, edit);
      res.json(applyProfileEdit(user, edit));
    } catch (e) {
      next(e);
    }
  });
  router.delete("/pledges/:id", async (req, res, next) => {
    try {
      const user = await target(req);
      if (!options.archive)
        throw Object.assign(new Error("Removal is unavailable."), {
          status: 400,
        });
      await options.archive(user.id, true);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
  router.post("/pledges/:id/restore", async (req, res, next) => {
    try {
      const user = await target(req);
      if (!options.archive)
        throw Object.assign(new Error("Restore is unavailable."), {
          status: 400,
        });
      await options.archive(user.id, false);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
  return router;
}
