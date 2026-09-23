"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_js_1 = require("./config.js");
const uploader_js_1 = require("./uploader.js");
const queue_js_1 = require("./queue.js");
const security_service_js_1 = require("./services/security.service.js");
const cleanup_service_js_1 = require("./services/cleanup.service.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// MDD-501: Rate Limiter on API routes
app.use("/api/", (0, security_service_js_1.createRateLimiter)(queue_js_1.redisConnection));
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// MDD-301 & MDD-501: Secure Upload endpoint
app.post("/api/v1/jobs/upload", uploader_js_1.uploadMiddleware.array("files", 20), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "Tidak ada file yang diunggah" });
        }
        // MDD-501: Validate magic bytes
        for (const file of files) {
            const isValid = await (0, security_service_js_1.validateMagicBytes)(file.path);
            if (!isValid) {
                // Remove uploaded batch on failure
                fs_1.default.rmSync(path_1.default.dirname(file.path), { recursive: true, force: true });
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
        const payload = {
            jobId,
            files: filePayload,
            operation,
            options: req.body.options ? JSON.parse(req.body.options) : {},
        };
        const job = await queue_js_1.documentQueue.add(`job-${jobId}`, payload, { jobId });
        return res.status(202).json({
            message: "File berhasil diverifikasi dan diantrekan",
            jobId,
            queueJobId: job.id,
            filesCount: files.length,
        });
    }
    catch (err) {
        console.error("[Upload Error]:", err);
        return res.status(500).json({ error: err.message || "Upload error" });
    }
});
// Check job status
app.get("/api/v1/jobs/:jobId/status", async (req, res) => {
    const { jobId } = req.params;
    const job = await queue_js_1.documentQueue.getJob(jobId);
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
app.get("/api/v1/jobs/:jobId/download", async (req, res) => {
    const { jobId } = req.params;
    const jobDir = path_1.default.resolve(config_js_1.config.uploadTempDir, jobId);
    if (!fs_1.default.existsSync(jobDir)) {
        return res.status(404).json({ error: "File sudah kedaluwarsa atau tidak ditemukan" });
    }
    const files = await fs_1.default.promises.readdir(jobDir);
    const resultFile = files.find((f) => f.startsWith("merged-result") ||
        f.startsWith("extracted-pages") ||
        f.endsWith(".zip") ||
        f.endsWith(".pdf"));
    if (!resultFile) {
        return res.status(404).json({ error: "File hasil belum siap" });
    }
    const filePath = path_1.default.join(jobDir, resultFile);
    res.download(filePath);
});
app.listen(config_js_1.config.port, () => {
    console.log(`[Server] MergeDuluDong API running on port ${config_js_1.config.port}`);
    try {
        (0, queue_js_1.initWorker)();
        (0, cleanup_service_js_1.startCleanupScheduler)();
    }
    catch (err) {
        console.warn("[Startup Warning]:", err);
    }
});
