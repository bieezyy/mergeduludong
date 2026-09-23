import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import archiver from "archiver";
import sharp from "sharp";
import { convertOfficeToPdf } from "./gotenberg.service.js";

/**
 * MDD-401: Split PDF by range string (e.g., "1-3, 5") or split all pages into a ZIP
 */
export async function splitPdf(
  inputPdfPath: string,
  outputDir: string,
  mode: "extract" | "split_all",
  rangeStr?: string
): Promise<string> {
  const pdfBuffer = await fs.promises.readFile(inputPdfPath);
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();

  if (mode === "extract" && rangeStr) {
    // Parse range e.g. "1-3, 5" (1-indexed for users)
    const targetIndices = new Set<number>();
    const segments = rangeStr.split(",").map((s) => s.trim());

    for (const segment of segments) {
      if (segment.includes("-")) {
        const [start, end] = segment.split("-").map((num) => parseInt(num, 10));
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          targetIndices.add(p - 1);
        }
      } else {
        const pageNum = parseInt(segment, 10);
        if (pageNum >= 1 && pageNum <= totalPages) {
          targetIndices.add(pageNum - 1);
        }
      }
    }

    const extractedPdf = await PDFDocument.create();
    const sortedIndices = Array.from(targetIndices).sort((a, b) => a - b);
    const pages = await extractedPdf.copyPages(sourcePdf, sortedIndices);
    pages.forEach((p) => extractedPdf.addPage(p));

    const outputPath = path.join(outputDir, "extracted-pages.pdf");
    await fs.promises.writeFile(outputPath, await extractedPdf.save());
    return outputPath;
  } else {
    // Split all into a ZIP archive
    const zipPath = path.join(outputDir, "split-pages.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    for (let i = 0; i < totalPages; i++) {
      const singlePdf = await PDFDocument.create();
      const [copiedPage] = await singlePdf.copyPages(sourcePdf, [i]);
      singlePdf.addPage(copiedPage);
      const pdfBytes = await singlePdf.save();
      archive.append(Buffer.from(pdfBytes), { name: `page-${i + 1}.pdf` });
    }

    await archive.finalize();
    await new Promise<void>((resolve, reject) => {
      output.on("close", () => resolve());
      output.on("error", reject);
    });

    return zipPath;
  }
}

/**
 * MDD-402: Standalone Converter for Documents and Images
 */
export async function convertSingleFile(
  inputPath: string,
  outputDir: string,
  targetFormat: "pdf" | "png" | "jpg" | "webp"
): Promise<string> {
  const ext = path.extname(inputPath).toLowerCase();
  const baseName = path.basename(inputPath, ext);

  // Document to PDF
  if (targetFormat === "pdf") {
    if ([".docx", ".doc", ".odt", ".rtf"].includes(ext)) {
      const outputPath = path.join(outputDir, `${baseName}.pdf`);
      return await convertOfficeToPdf(inputPath, outputPath);
    }
  }

  // Image to Image conversion (SVG, WebP, PNG, JPG)
  if (["png", "jpg", "webp"].includes(targetFormat)) {
    const outputPath = path.join(outputDir, `${baseName}.${targetFormat === "jpg" ? "jpeg" : targetFormat}`);
    let transformer = sharp(inputPath);

    if (targetFormat === "jpg") {
      transformer = transformer.jpeg({ quality: 90 });
    } else if (targetFormat === "png") {
      transformer = transformer.png();
    } else if (targetFormat === "webp") {
      transformer = transformer.webp({ quality: 85 });
    }

    await transformer.toFile(outputPath);
    return outputPath;
  }

  throw new Error(`Kombinasi konversi dari ${ext} ke ${targetFormat} belum didukung`);
}
