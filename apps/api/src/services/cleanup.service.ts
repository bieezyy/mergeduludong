import fs from "fs";
import path from "path";
import cron from "node-cron";
import { config } from "../config.js";

/**
 * MDD-502: Ephemeral file cleaner.
 * Deletes directories in uploadTempDir that are older than maxAgeMs (default: 1 hour)
 */
export async function cleanExpiredFiles(maxAgeMs: number = 3600000): Promise<number> {
  const baseDir = path.resolve(config.uploadTempDir);
  if (!fs.existsSync(baseDir)) return 0;

  const now = Date.now();
  let deletedCount = 0;

  const entries = await fs.promises.readdir(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = path.join(baseDir, entry.name);
      try {
        const stats = await fs.promises.stat(dirPath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          await fs.promises.rm(dirPath, { recursive: true, force: true });
          deletedCount++;
        }
      } catch (err: any) {
        console.warn(`[Cleanup Warning] Could not delete ${dirPath}:`, err.message);
      }
    }
  }

  return deletedCount;
}

/**
 * Start background cron schedule (runs every 15 minutes)
 */
export function startCleanupScheduler() {
  console.log("[Scheduler] Ephemeral cleanup service started (interval: every 15 min, TTL: 1h)");
  cron.schedule("*/15 * * * *", async () => {
    try {
      const removed = await cleanExpiredFiles(3600000);
      if (removed > 0) {
        console.log(`[Scheduler] Cleaned up ${removed} expired temporary job directories.`);
      }
    } catch (e: any) {
      console.error("[Scheduler Error]:", e.message);
    }
  });
}
