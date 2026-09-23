import { PDFDocument, degrees } from "pdf-lib";
import { WorkspaceFile, ConvertTargetFormat } from "@/store/useAppStore";

/**
 * Merge multiple PDF files directly in the browser (MDD-203)
 */
export async function mergePdfClientSide(
  files: WorkspaceFile[],
  onProgress?: (progressText: string) => void
): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    onProgress?.(`Memproses dokumen ${i + 1} dari ${files.length}: ${item.name}`);

    const arrayBuffer = await item.file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );

    copiedPages.forEach((page) => {
      if (item.rotation) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + item.rotation) % 360));
      }
      mergedPdf.addPage(page);
    });
  }

  onProgress?.("Finalisasi berkas PDF...");
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/**
 * Get total page count of a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  } catch (err) {
    console.error("Failed to load PDF page count:", err);
    return 1;
  }
}

/**
 * Parse page range string like "1-3, 5, 7-9" into array of 0-based page indices
 */
export function parseRangeIndices(rangeStr: string, totalPages: number): number[] {
  const targetIndices = new Set<number>();
  const segments = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);

  for (const segment of segments) {
    if (segment.includes("-")) {
      const parts = segment.split("-").map((num) => parseInt(num.trim(), 10));
      const start = parts[0];
      const end = parts[1];
      if (!isNaN(start) && !isNaN(end)) {
        for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
          targetIndices.add(p - 1);
        }
      }
    } else {
      const pageNum = parseInt(segment, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        targetIndices.add(pageNum - 1);
      }
    }
  }

  return Array.from(targetIndices).sort((a, b) => a - b);
}

/**
 * Split PDF client-side by specific page ranges
 */
export async function splitPdfClientSide(
  file: File,
  rangeStr: string,
  onProgress?: (progressText: string) => void
): Promise<Blob> {
  onProgress?.("Membaca berkas PDF...");
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const totalPages = sourcePdf.getPageCount();

  const indices = parseRangeIndices(rangeStr, totalPages);
  if (indices.length === 0) {
    throw new Error(`Range halaman tidak valid atau di luar jangkauan (1 - ${totalPages}).`);
  }

  onProgress?.(`Mengekstrak ${indices.length} halaman terpilih...`);
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, indices);
  copiedPages.forEach((p) => newPdf.addPage(p));

  onProgress?.("Menyimpan PDF hasil ekstrak...");
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/**
 * Convert and merge images into a Multi-page PDF (MDD-204 Mode 1)
 */
export async function mergeImagesToPdfClientSide(
  files: WorkspaceFile[],
  onProgress?: (progressText: string) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    onProgress?.(`Menyusun gambar ${i + 1} dari ${files.length}`);

    // If SVG, convert to PNG via canvas first
    let arrayBuffer: ArrayBuffer;
    let isPng = item.type.includes("png") || item.name.toLowerCase().endsWith(".png");

    if (item.type.includes("svg") || item.name.toLowerCase().endsWith(".svg")) {
      const pngBlob = await svgToPngBlob(item.file);
      arrayBuffer = await pngBlob.arrayBuffer();
      isPng = true;
    } else {
      arrayBuffer = await item.file.arrayBuffer();
    }

    let image;
    if (isPng) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);

    if (item.rotation) {
      page.setRotation(degrees(item.rotation));
    }

    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/**
 * Helper to convert SVG File to PNG Blob using Canvas
 */
export async function svgToPngBlob(svgFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgFile);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context failed"));
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert SVG to PNG"));
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };
    img.src = url;
  });
}

/**
 * Merge images by stitching them vertically or horizontally on Canvas (MDD-204 Mode 2)
 */
export async function stitchImagesClientSide(
  files: WorkspaceFile[],
  direction: "vertical" | "horizontal" = "vertical",
  onProgress?: (progressText: string) => void
): Promise<Blob> {
  onProgress?.("Memuat gambar ke memori canvas...");

  const loadedImages: HTMLImageElement[] = await Promise.all(
    files.map(
      (item) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = item.previewUrl || URL.createObjectURL(item.file);
        })
    )
  );

  let totalWidth = 0;
  let totalHeight = 0;

  if (direction === "vertical") {
    totalWidth = Math.max(...loadedImages.map((img) => img.naturalWidth || 400));
    totalHeight = loadedImages.reduce((sum, img) => sum + (img.naturalHeight || 300), 0);
  } else {
    totalWidth = loadedImages.reduce((sum, img) => sum + (img.naturalWidth || 400), 0);
    totalHeight = Math.max(...loadedImages.map((img) => img.naturalHeight || 300));
  }

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not initialize Canvas 2D Context");

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let currentOffset = 0;
  loadedImages.forEach((img, idx) => {
    onProgress?.(`Menggabungkan gambar ${idx + 1}...`);
    const w = img.naturalWidth || 400;
    const h = img.naturalHeight || 300;
    if (direction === "vertical") {
      ctx.drawImage(img, (totalWidth - w) / 2, currentOffset);
      currentOffset += h;
    } else {
      ctx.drawImage(img, currentOffset, (totalHeight - h) / 2);
      currentOffset += w;
    }
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat canvas blob"));
    }, "image/jpeg", 0.95);
  });
}

/**
 * Client-side conversion for image/document formats
 */
export async function convertAssetClientSide(
  file: File,
  targetFormat: ConvertTargetFormat,
  onProgress?: (progressText: string) => void
): Promise<{ blob: Blob; filename: string }> {
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  onProgress?.(`Menyiapkan konversi ke format ${targetFormat.toUpperCase()}...`);

  // Target: PDF
  if (targetFormat === "pdf") {
    if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) {
      const dummyItem: WorkspaceFile = {
        id: "1",
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        rotation: 0,
      };
      const blob = await mergeImagesToPdfClientSide([dummyItem], onProgress);
      return { blob, filename: `${baseName}.pdf` };
    }
    if (ext === "pdf") {
      return { blob: file, filename: `${baseName}-copy.pdf` };
    }
  }

  // Target: JPG / PNG
  if (targetFormat === "jpg" || targetFormat === "png") {
    const isTargetJpg = targetFormat === "jpg";
    const mime = isTargetJpg ? "image/jpeg" : "image/png";
    const outputExt = isTargetJpg ? "jpg" : "png";

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));

        if (isTargetJpg) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (blob) resolve({ blob, filename: `${baseName}.${outputExt}` });
          else reject(new Error("Konversi gambar gagal."));
        }, mime, 0.92);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gagal memuat berkas gambar untuk dikonversi."));
      };
      img.src = url;
    });
  }

  // Target: SVG
  if (targetFormat === "svg") {
    // If already SVG, return
    if (ext === "svg") {
      return { blob: file, filename: `${baseName}.svg` };
    }
    // Embed raster into SVG wrapper
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 800 600" width="100%" height="100%">
  <image href="${dataUrl}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
</svg>`;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    return { blob, filename: `${baseName}.svg` };
  }

  throw new Error(`Format ${targetFormat.toUpperCase()} membutuhkan layanan backend.`);
}
