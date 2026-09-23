import fs from "fs";
import path from "path";
import { PDFDocument, degrees } from "pdf-lib";
import sharp from "sharp";
import { convertOfficeToPdf } from "./gotenberg.service.js";

export interface FileItemToProcess {
  path: string;
  originalName: string;
  mimetype: string;
  rotation?: number;
}

/**
 * MDD-304 & MDD-403: Orchestrate heterogeneous documents into a single PDF
 */
export async function orchestrateHeterogeneousMerge(
  jobDir: string,
  files: FileItemToProcess[],
  options: { normalizeA4?: boolean } = {}
): Promise<string> {
  const finalPdf = await PDFDocument.create();

  // Step 1: Normalize all inputs into temporary intermediate PDFs
  const intermediatePdfPaths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = path.extname(file.path).toLowerCase();
    const tempPdfOutput = path.join(jobDir, `temp_converted_${i}.pdf`);

    if (ext === ".pdf") {
      intermediatePdfPaths.push(file.path);
    } else if ([".docx", ".doc", ".odt", ".rtf"].includes(ext)) {
      await convertOfficeToPdf(file.path, tempPdfOutput);
      intermediatePdfPaths.push(tempPdfOutput);
    } else if ([".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
      // Convert image/svg to intermediate PDF via sharp & pdf-lib
      const pngBuffer = await sharp(file.path).png().toBuffer();
      const imgPdf = await PDFDocument.create();
      const embeddedImg = await imgPdf.embedPng(pngBuffer);

      let width = embeddedImg.width;
      let height = embeddedImg.height;

      // MDD-403: Smart Page Normalization (A4 standard: 595.28 x 841.89 pt)
      if (options.normalizeA4) {
        const a4Width = 595.28;
        const a4Height = 841.89;
        const page = imgPdf.addPage([a4Width, a4Height]);
        const scale = Math.min(a4Width / width, a4Height / height);
        const drawWidth = width * scale;
        const drawHeight = height * scale;

        page.drawImage(embeddedImg, {
          x: (a4Width - drawWidth) / 2,
          y: (a4Height - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });
      } else {
        const page = imgPdf.addPage([width, height]);
        page.drawImage(embeddedImg, { x: 0, y: 0, width, height });
      }

      const imgPdfBytes = await imgPdf.save();
      await fs.promises.writeFile(tempPdfOutput, imgPdfBytes);
      intermediatePdfPaths.push(tempPdfOutput);
    } else {
      throw new Error(`Format ${ext} tidak dapat diintegrasikan ke PDF`);
    }
  }

  // Step 2: Merge all intermediate PDFs in order
  for (let i = 0; i < intermediatePdfPaths.length; i++) {
    const pdfPath = intermediatePdfPaths[i];
    const originalFileConfig = files[i];
    const pdfBuffer = await fs.promises.readFile(pdfPath);
    const sourceDoc = await PDFDocument.load(pdfBuffer);
    const copiedPages = await finalPdf.copyPages(sourceDoc, sourceDoc.getPageIndices());

    copiedPages.forEach((page) => {
      if (originalFileConfig?.rotation) {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + originalFileConfig.rotation) % 360));
      }
      finalPdf.addPage(page);
    });
  }

  // Step 3: Write final merged file
  const finalPdfPath = path.join(jobDir, "merged-result.pdf");
  const finalPdfBytes = await finalPdf.save();
  await fs.promises.writeFile(finalPdfPath, finalPdfBytes);

  return finalPdfPath;
}
