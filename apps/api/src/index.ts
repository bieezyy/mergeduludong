import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { config } from "./config.js";
import { uploadMiddleware } from "./uploader.js";
import { documentQueue, initWorker, redisConnection, ConversionJobPayload } from "./queue.js";
import { validateMagicBytes, createRateLimiter } from "./services/security.service.js";
import { startCleanupScheduler } from "./services/cleanup.service.js";

const app = express();

app.use(cors());
app.use(express.json());

// MDD-501: Rate Limiter on API routes
app.use("/api/", createRateLimiter(redisConnection));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// MDD-301 & MDD-501: Secure Upload endpoint
app.post(
  "/api/v1/jobs/upload",
  uploadMiddleware.array("files", 20),
  async (req, res): Promise<any> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Tidak ada file yang diunggah" });
      }

      // MDD-501: Validate magic bytes
      for (const file of files) {
        const isValid = await validateMagicBytes(file.path);
        if (!isValid) {
          // Remove uploaded batch on failure
          fs.rmSync(path.dirname(file.path), { recursive: true, force: true });
          return res.status(400).json({
            error: `File ${file.originalname} gagal lolos verifikasi tanda tangan berkas (magic bytes).`,
          });
        }
      }

      const jobId = req.body.jobId;
      const operation = req.body.operation || "document_merge";

      const filePayload = files.map((f) => ({
        originalName: f.originalname,
        path: f.path,
        mimetype: f.mimetype,
        size: f.size,
      }));

      const payload: ConversionJobPayload = {
        jobId,
        files: filePayload,
        operation,
        options: req.body.options ? JSON.parse(req.body.options) : {},
      };

      const job = await documentQueue.add(`job-${jobId}`, payload, { jobId });

      return res.status(202).json({
        message: "File berhasil diverifikasi dan diantrekan",
        jobId,
        queueJobId: job.id,
        filesCount: files.length,
      });
    } catch (err: any) {
      console.error("[Upload Error]:", err);
      return res.status(500).json({ error: err.message || "Upload error" });
    }
  }
);

// Check job status
app.get("/api/v1/jobs/:jobId/status", async (req, res): Promise<any> => {
  const { jobId } = req.params;
  const job = await documentQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job tidak ditemukan" });
  }

  const state = await job.getState();
  return res.json({
    jobId,
    state,
    progress: job.progress,
    result: state === "completed" ? job.returnvalue : undefined,
    error: state === "failed" ? job.failedReason : undefined,
  });
});

// MDD-304: Download processed file
app.get("/api/v1/jobs/:jobId/download", async (req, res): Promise<any> => {
  const { jobId } = req.params;
  const jobDir = path.resolve(config.uploadTempDir, jobId);

  if (!fs.existsSync(jobDir)) {
    return res.status(404).json({ error: "File sudah kedaluwarsa atau tidak ditemukan" });
  }

  const files = await fs.promises.readdir(jobDir);
  const resultFile = files.find(
    (f) =>
      f.startsWith("merged-result") ||
      f.startsWith("extracted-pages") ||
      f.endsWith(".zip") ||
      f.endsWith(".pdf")
  );

  if (!resultFile) {
    return res.status(404).json({ error: "File hasil belum siap" });
  }

  const filePath = path.join(jobDir, resultFile);
  res.download(filePath);
});

app.listen(config.port, () => {
  console.log(`[Server] MergeDuluDong API running on port ${config.port}`);
  try {
    initWorker();
    startCleanupScheduler();
  } catch (err) {
    console.warn("[Startup Warning]:", err);
  }
});
