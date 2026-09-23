import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import path from "path";
import fs from "fs";
import { config } from "./config.js";
import { orchestrateHeterogeneousMerge } from "./services/pipeline.service.js";
import { splitPdf, convertSingleFile } from "./services/converter.service.js";

export const redisConnection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

export const documentQueue = new Queue("document-conversion", {
  connection: redisConnection,
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

export interface ConversionJobPayload {
  jobId: string;
  files: Array<{
    originalName: string;
    path: string;
    mimetype: string;
    size: number;
    rotation?: number;
  }>;
  operation: "document_merge" | "split_pdf" | "convert_file";
  options?: Record<string, any>;
}

export function initWorker() {
  const worker = new Worker(
    "document-conversion",
    async (job: Job<ConversionJobPayload>) => {
      const { jobId, files, operation, options } = job.data;
      console.log(`[Worker] Starting Job ${jobId} - Operation: ${operation}`);
      const jobDir = path.resolve(config.uploadTempDir, jobId);

      await job.updateProgress(15);

      let resultPath = "";

      if (operation === "document_merge") {
        // MDD-304: Merge heterogeneous docs
        resultPath = await orchestrateHeterogeneousMerge(jobDir, files, options);
        await job.updateProgress(85);
      } else if (operation === "split_pdf") {
        // MDD-401: Split PDF
        const targetPdf = files[0].path;
        resultPath = await splitPdf(
          targetPdf,
          jobDir,
          options?.mode || "extract",
          options?.range
        );
        await job.updateProgress(90);
      } else if (operation === "convert_file") {
        // MDD-402: Standalone Converter
        const targetFile = files[0].path;
        resultPath = await convertSingleFile(
          targetFile,
          jobDir,
          options?.targetFormat || "pdf"
        );
        await job.updateProgress(90);
      }

      await job.updateProgress(100);

      return {
        success: true,
        jobId,
        fileName: path.basename(resultPath),
        downloadUrl: `/api/v1/jobs/${jobId}/download`,
      };
    },
    {
      connection: redisConnection,
      concurrency: 4,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
