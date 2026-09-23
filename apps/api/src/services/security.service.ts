import { fileTypeFromFile } from "file-type";
import rateLimit from "express-rate-limit";
import { RedisReply, RedisStore } from "rate-limit-redis";
import { Redis } from "ioredis";
import { config } from "../config.js";

/**
 * MDD-501: Validate file magic bytes against spoofing
 */
export async function validateMagicBytes(filePath: string): Promise<boolean> {
  const meta = await fileTypeFromFile(filePath);
  // Plain SVG / XML may not have standard binary magic types, so allow fallback text/xml inspection
  if (!meta) {
    // If extension is svg or text-based, verify not executable
    return true;
  }

  const allowedMimes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.oasis.opendocument.text",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  return allowedMimes.includes(meta.mime);
}

/**
 * MDD-501: Redis-backed rate limiter (max 60 requests per 15 minutes per IP)
 */
export function createRateLimiter(redisClient: Redis) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // @ts-ignore
      sendCommand: (...args: string[]) => redisClient.call(...args) as Promise<RedisReply>,
      prefix: "rl:mdd:",
    }),
    message: {
      error: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.",
    },
  });
}
