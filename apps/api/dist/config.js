"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "../../.env" });
exports.config = {
    port: parseInt(process.env.PORT || "4000", 10),
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    gotenbergUrl: process.env.GOTENBERG_URL || "http://localhost:3001",
    uploadTempDir: process.env.UPLOAD_TEMP_DIR || "./uploads_temp",
};
