import multer from "multer";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
      cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP allowed"));
  },
});

const router = Router();

router.post("/photo", requireAuth, upload.single("photo"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const b64 = req.file.buffer.toString("base64");
  const url = `data:${req.file.mimetype};base64,${b64}`;
  res.json({ url });
});

export default router;
