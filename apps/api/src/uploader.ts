import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { config } from "./config.js";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    let jobId = req.body.jobId;
    if (!jobId) {
      jobId = uuidv4();
      req.body.jobId = jobId;
    }
    const targetDir = path.resolve(config.uploadTempDir, jobId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename and prepend unique timestamp
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = [
    ".pdf",
    ".docx",
    ".doc",
    ".odt",
    ".rtf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".svg",
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not supported`));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 20,
  },
});
