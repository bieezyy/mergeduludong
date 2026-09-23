"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { FileUploader } from "@/components/FileUploader";
import { Workspace } from "@/components/Workspace";
import {
  mergePdfClientSide,
  mergeImagesToPdfClientSide,
  stitchImagesClientSide,
} from "@/lib/clientMergeEngine";
import { Loader2, Download, Sparkles } from "lucide-react";

export default function HomePage() {
  const { currentMode, files, isProcessing, statusMessage, setProcessing } = useAppStore();
  const [imageOutputMode, setImageOutputMode] = useState<"pdf" | "stitched">("pdf");

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMergeAction = async () => {
    if (files.length === 0) return;

    try {
      setProcessing(true, "Memulai proses penggabungan...");

      // Check if pure PDF
      const isAllPdf = files.every((f) => f.name.toLowerCase().endsWith(".pdf"));
      const isAllImage = files.every((f) => f.type.startsWith("image/"));

      if (currentMode === "document_merge" && isAllPdf) {
        // MDD-203 Pure PDF Client-side Merge
        const resultBlob = await mergePdfClientSide(files, (msg) =>
          setProcessing(true, msg)
        );
        triggerDownload(resultBlob, `merged-${Date.now()}.pdf`);
      } else if (currentMode === "image_merge" || isAllImage) {
        // MDD-204 Image Merger
        if (imageOutputMode === "pdf") {
          const resultBlob = await mergeImagesToPdfClientSide(files, (msg) =>
            setProcessing(true, msg)
          );
          triggerDownload(resultBlob, `images-merged-${Date.now()}.pdf`);
        } else {
          const resultBlob = await stitchImagesClientSide(files, "vertical", (msg) =>
            setProcessing(true, msg)
          );
          triggerDownload(resultBlob, `stitched-image-${Date.now()}.jpg`);
        }
      } else {
        // Heterogeneous merge (e.g. DOCX + PDF) -> Delegate to Backend API (MDD-301 / MDD-302)
        setProcessing(true, "Mengunggah dokumen ke server worker antrean...");
        const formData = new FormData();
        formData.append("jobId", `job-${Date.now()}`);
        formData.append("operation", currentMode);
        files.forEach((f) => formData.append("files", f.file));

        const res = await fetch("http://localhost:4000/api/v1/jobs/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Gagal mengunggah dokumen ke server.");
        }

        const data = await res.json();
        setProcessing(false);
        alert(`Dokumen berhasil diantrekan di server! Job ID: ${data.jobId}`);
        return;
      }

      setProcessing(false);
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message}`);
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Gabungkan Dokumen & Gambar dengan Cepat
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Mendukung PDF, Word, JPG, PNG, dan format lainnya. Proses instan langsung di browsermu atau via worker antrean cepat.
        </p>
      </div>

      <FileUploader />
      <Workspace />

      {/* Control bar when files exist */}
      {files.length > 0 && (
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            {currentMode === "image_merge" && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setImageOutputMode("pdf")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    imageOutputMode === "pdf"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Output PDF
                </button>
                <button
                  onClick={() => setImageOutputMode("stitched")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    imageOutputMode === "stitched"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Output Single Image (Stitched)
                </button>
              </div>
            )}
            <span className="text-xs text-slate-500">
              Total {files.length} berkas siap diproses.
            </span>
          </div>

          <button
            disabled={isProcessing}
            onClick={handleMergeAction}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusMessage || "Memproses..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gabungkan Sekarang</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
