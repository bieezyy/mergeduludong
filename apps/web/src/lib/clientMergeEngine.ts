import { PDFDocument, degrees } from "pdf-lib";
import { WorkspaceFile } from "@/store/useAppStore";

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

    const arrayBuffer = await item.file.arrayBuffer();
    let image;

    if (item.type.includes("png")) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // JPEG / WebP converted to JPG
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
    totalWidth = Math.max(...loadedImages.map((img) => img.naturalWidth));
    totalHeight = loadedImages.reduce((sum, img) => sum + img.naturalHeight, 0);
  } else {
    totalWidth = loadedImages.reduce((sum, img) => sum + img.naturalWidth, 0);
    totalHeight = Math.max(...loadedImages.map((img) => img.naturalHeight));
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
    if (direction === "vertical") {
      ctx.drawImage(img, (totalWidth - img.naturalWidth) / 2, currentOffset);
      currentOffset += img.naturalHeight;
    } else {
      ctx.drawImage(img, currentOffset, (totalHeight - img.naturalHeight) / 2);
      currentOffset += img.naturalWidth;
    }
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat canvas blob"));
    }, "image/jpeg", 0.95);
  });
}
