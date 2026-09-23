"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanExpiredFiles = cleanExpiredFiles;
exports.startCleanupScheduler = startCleanupScheduler;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const config_js_1 = require("../config.js");
/**
 * MDD-502: Ephemeral file cleaner.
 * Deletes directories in uploadTempDir that are older than maxAgeMs (default: 1 hour)
 */
async function cleanExpiredFiles(maxAgeMs = 3600000) {
    const baseDir = path_1.default.resolve(config_js_1.config.uploadTempDir);
    if (!fs_1.default.existsSync(baseDir))
        return 0;
    const now = Date.now();
    let deletedCount = 0;
    const entries = await fs_1.default.promises.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const dirPath = path_1.default.join(baseDir, entry.name);
            try {
                const stats = await fs_1.default.promises.stat(dirPath);
                const age = now - stats.mtimeMs;
                if (age > maxAgeMs) {
                    await fs_1.default.promises.rm(dirPath, { recursive: true, force: true });
                    deletedCount++;
                }
            }
            catch (err) {
                console.warn(`[Cleanup Warning] Could not delete ${dirPath}:`, err.message);
            }
        }
    }
    return deletedCount;
}
/**
 * Start background cron schedule (runs every 15 minutes)
 */
function startCleanupScheduler() {
    console.log("[Scheduler] Ephemeral cleanup service started (interval: every 15 min, TTL: 1h)");
    node_cron_1.default.schedule("*/15 * * * *", async () => {
        try {
            const removed = await cleanExpiredFiles(3600000);
            if (removed > 0) {
                console.log(`[Scheduler] Cleaned up ${removed} expired temporary job directories.`);
            }
        }
        catch (e) {
            console.error("[Scheduler Error]:", e.message);
        }
    });
}
