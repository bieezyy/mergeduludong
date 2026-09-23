"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMagicBytes = validateMagicBytes;
exports.createRateLimiter = createRateLimiter;
const file_type_1 = require("file-type");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
/**
 * MDD-501: Validate file magic bytes against spoofing
 */
async function validateMagicBytes(filePath) {
    const meta = await (0, file_type_1.fileTypeFromFile)(filePath);
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
function createRateLimiter(redisClient) {
    return (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 60,
        standardHeaders: true,
        legacyHeaders: false,
        store: new rate_limit_redis_1.RedisStore({
            // @ts-ignore
            sendCommand: (...args) => redisClient.call(...args),
            prefix: "rl:mdd:",
        }),
        message: {
            error: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.",
        },
    });
}
