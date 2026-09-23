"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitPdf = splitPdf;
exports.convertSingleFile = convertSingleFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
const archiver_1 = __importDefault(require("archiver"));
const sharp_1 = __importDefault(require("sharp"));
const gotenberg_service_js_1 = require("./gotenberg.service.js");
/**
 * MDD-401: Split PDF by range string (e.g., "1-3, 5") or split all pages into a ZIP
 */
async function splitPdf(inputPdfPath, outputDir, mode, rangeStr) {
    const pdfBuffer = await fs_1.default.promises.readFile(inputPdfPath);
    const sourcePdf = await pdf_lib_1.PDFDocument.load(pdfBuffer);
    const totalPages = sourcePdf.getPageCount();
    if (mode === "extract" && rangeStr) {
        // Parse range e.g. "1-3, 5" (1-indexed for users)
        const targetIndices = new Set();
        const segments = rangeStr.split(",").map((s) => s.trim());
        for (const segment of segments) {
            if (segment.includes("-")) {
                const [start, end] = segment.split("-").map((num) => parseInt(num, 10));
                for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
                    targetIndices.add(p - 1);
                }
            }
            else {
                const pageNum = parseInt(segment, 10);
                if (pageNum >= 1 && pageNum <= totalPages) {
                    targetIndices.add(pageNum - 1);
                }
            }
        }
        const extractedPdf = await pdf_lib_1.PDFDocument.create();
        const sortedIndices = Array.from(targetIndices).sort((a, b) => a - b);
        const pages = await extractedPdf.copyPages(sourcePdf, sortedIndices);
        pages.forEach((p) => extractedPdf.addPage(p));
        const outputPath = path_1.default.join(outputDir, "extracted-pages.pdf");
        await fs_1.default.promises.writeFile(outputPath, await extractedPdf.save());
        return outputPath;
    }
    else {
        // Split all into a ZIP archive
        const zipPath = path_1.default.join(outputDir, "split-pages.zip");
        const output = fs_1.default.createWriteStream(zipPath);
        const archive = (0, archiver_1.default)("zip", { zlib: { level: 9 } });
        archive.pipe(output);
        for (let i = 0; i < totalPages; i++) {
            const singlePdf = await pdf_lib_1.PDFDocument.create();
            const [copiedPage] = await singlePdf.copyPages(sourcePdf, [i]);
            singlePdf.addPage(copiedPage);
            const pdfBytes = await singlePdf.save();
            archive.append(Buffer.from(pdfBytes), { name: `page-${i + 1}.pdf` });
        }
        await archive.finalize();
        await new Promise((resolve, reject) => {
            output.on("close", () => resolve());
            output.on("error", reject);
        });
        return zipPath;
    }
}
/**
 * MDD-402: Standalone Converter for Documents and Images
 */
async function convertSingleFile(inputPath, outputDir, targetFormat) {
    const ext = path_1.default.extname(inputPath).toLowerCase();
    const baseName = path_1.default.basename(inputPath, ext);
    // Document to PDF
    if (targetFormat === "pdf") {
        if ([".docx", ".doc", ".odt", ".rtf"].includes(ext)) {
            const outputPath = path_1.default.join(outputDir, `${baseName}.pdf`);
            return await (0, gotenberg_service_js_1.convertOfficeToPdf)(inputPath, outputPath);
        }
    }
    // Image to Image conversion (SVG, WebP, PNG, JPG)
    if (["png", "jpg", "webp"].includes(targetFormat)) {
        const outputPath = path_1.default.join(outputDir, `${baseName}.${targetFormat === "jpg" ? "jpeg" : targetFormat}`);
        let transformer = (0, sharp_1.default)(inputPath);
        if (targetFormat === "jpg") {
            transformer = transformer.jpeg({ quality: 90 });
        }
        else if (targetFormat === "png") {
            transformer = transformer.png();
        }
        else if (targetFormat === "webp") {
            transformer = transformer.webp({ quality: 85 });
        }
        await transformer.toFile(outputPath);
        return outputPath;
    }
    throw new Error(`Kombinasi konversi dari ${ext} ke ${targetFormat} belum didukung`);
}
