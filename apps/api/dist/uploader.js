"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const config_js_1 = require("./config.js");
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        let jobId = req.body.jobId;
        if (!jobId) {
            jobId = (0, uuid_1.v4)();
            req.body.jobId = jobId;
        }
        const targetDir = path_1.default.resolve(config_js_1.config.uploadTempDir, jobId);
        if (!fs_1.default.existsSync(targetDir)) {
            fs_1.default.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
        // Sanitize filename and prepend unique timestamp
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const fileFilter = (_req, file, cb) => {
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
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${ext} is not supported`));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max per file
        files: 20,
    },
});
