import { RequestHandler, Request } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const name = crypto.randomBytes(16).toString("hex") + ext.toLowerCase();
    cb(null, name);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];
  if (!allowed.includes(file.mimetype))
    return cb(new Error("Invalid file type"));
  cb(null, true);
};

const uploadMw = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const handleUpload: RequestHandler[] = [
  uploadMw.single("file"),
  (req: Request, res) => { // Use the augmented Request type directly
    const f = req.file;
    if (!f) return res.status(400).json({ message: "No file" });
    const rel = "/uploads/" + f.filename;
    res.json({ url: rel });
  },
];