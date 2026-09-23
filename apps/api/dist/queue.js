"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentQueue = exports.redisConnection = void 0;
exports.initWorker = initWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const path_1 = __importDefault(require("path"));
const config_js_1 = require("./config.js");
const pipeline_service_js_1 = require("./services/pipeline.service.js");
const converter_service_js_1 = require("./services/converter.service.js");
exports.redisConnection = new ioredis_1.Redis({
    host: config_js_1.config.redis.host,
    port: config_js_1.config.redis.port,
    password: config_js_1.config.redis.password,
    maxRetriesPerRequest: null,
});
exports.documentQueue = new bullmq_1.Queue("document-conversion", {
    connection: exports.redisConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});
function initWorker() {
    const worker = new bullmq_1.Worker("document-conversion", async (job) => {
        const { jobId, files, operation, options } = job.data;
        console.log(`[Worker] Starting Job ${jobId} - Operation: ${operation}`);
        const jobDir = path_1.default.resolve(config_js_1.config.uploadTempDir, jobId);
        await job.updateProgress(15);
        let resultPath = "";
        if (operation === "document_merge") {
            // MDD-304: Merge heterogeneous docs
            resultPath = await (0, pipeline_service_js_1.orchestrateHeterogeneousMerge)(jobDir, files, options);
            await job.updateProgress(85);
        }
        else if (operation === "split_pdf") {
            // MDD-401: Split PDF
            const targetPdf = files[0].path;
            resultPath = await (0, converter_service_js_1.splitPdf)(targetPdf, jobDir, options?.mode || "extract", options?.range);
            await job.updateProgress(90);
        }
        else if (operation === "convert_file") {
            // MDD-402: Standalone Converter
            const targetFile = files[0].path;
            resultPath = await (0, converter_service_js_1.convertSingleFile)(targetFile, jobDir, options?.targetFormat || "pdf");
            await job.updateProgress(90);
        }
        await job.updateProgress(100);
        return {
            success: true,
            jobId,
            fileName: path_1.default.basename(resultPath),
            downloadUrl: `/api/v1/jobs/${jobId}/download`,
        };
    }, {
        connection: exports.redisConnection,
        concurrency: 4,
    });
    worker.on("completed", (job) => {
        console.log(`[Worker] Job ${job.id} completed successfully.`);
    });
    worker.on("failed", (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });
    return worker;
}
