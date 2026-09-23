"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { FileUploader } from "@/components/FileUploader";
import { Workspace } from "@/components/Workspace";
import { GiveACoffee } from "@/components/GiveACoffee";
import {
  mergePdfClientSide,
  mergeImagesToPdfClientSide,
  stitchImagesClientSide,
  splitPdfClientSide,
} from "@/lib/clientMergeEngine";
import { Loader2, Download, Sparkles, Scissors, Info, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const {
    currentMode,
    docSubtype,
    imageSubtype,
    splitRange,
    splitMode,
    setSplitRange,
    setSplitMode,
    files,
    isProcessing,
    statusMessage,
    setProcessing,
  } = useAppStore();

  const [imageOutputMode, setImageOutputMode] = useState<"pdf" | "stitched">("pdf");
  const [docsNoticeOpen, setDocsNoticeOpen] = useState(false);

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

  const handleAction = async () => {
    if (files.length === 0) return;

    try {
      // 1. Split PDF Mode
      if (currentMode === "split") {
        const target = files[0];
        if (!target.name.toLowerCase().endsWith(".pdf")) {
          alert("Hanya berkas PDF yang dapat di-split.");
          return;
        }

        const totalPages = target.pageCount || 1;
        let rangeToProcess = splitRange.trim();

        if (splitMode === "all") {
          rangeToProcess = `1-${totalPages}`;
        }

        if (!rangeToProcess) {
          alert("Silakan masukkan nomor atau range halaman yang ingin diekstrak (contoh: 1-3, 5).");
          return;
        }

        setProcessing(true, "Mengekstrak halaman PDF...");
        const resultBlob = await splitPdfClientSide(target.file, rangeToProcess, (msg) =>
          setProcessing(true, msg)
        );
        triggerDownload(
          resultBlob,
          `${target.name.replace(/\.pdf$/i, "")}-split-pages-${rangeToProcess.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`
        );
        setProcessing(false);
        return;
      }

      // 2. Pure PDF Client-side Merge
      const isAllPdf = files.every((f) => f.name.toLowerCase().endsWith(".pdf"));
      const isAllImage = files.every(
        (f) =>
          f.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|svg)$/i.test(f.name)
      );

      if (currentMode === "document_merge" && (isAllPdf || docSubtype === "pdf")) {
        setProcessing(true, "Memulai penggabungan berkas PDF...");
        const resultBlob = await mergePdfClientSide(files, (msg) =>
          setProcessing(true, msg)
        );
        triggerDownload(resultBlob, `merged-documents-${Date.now()}.pdf`);
        setProcessing(false);
        return;
      }

      // 3. Image Merge Mode
      if (currentMode === "image_merge" || isAllImage) {
        setProcessing(true, "Memulai penyusunan gambar...");
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
        setProcessing(false);
        return;
      }

      // 4. Heterogeneous Merge (Word .docx, PPTX, XLSX, etc.) -> Needs Backend API (Docker Gotenberg)
      setProcessing(true, "Mengunggah dokumen ke server konversi worker...");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const formData = new FormData();
      formData.append("jobId", `job-${Date.now()}`);
      formData.append("operation", currentMode);
      files.forEach((f) => formData.append("files", f.file));

      let res: Response;
      try {
        res = await fetch(`${apiUrl}/api/v1/jobs/upload`, {
          method: "POST",
          body: formData,
        });
      } catch (networkErr) {
        setProcessing(false);
        setDocsNoticeOpen(true);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengunggah dokumen ke server konversi.");
      }

      const data = await res.json();
      setProcessing(false);
      alert(`Dokumen berhasil diantrekan di server! Job ID: ${data.jobId}`);
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message || err}`);
      setProcessing(false);
    }
  };

  // Header Title & Description
  const getHeaderInfo = () => {
    switch (currentMode) {
      case "split":
        return {
          title: "Split & Ekstrak Halaman PDF",
          desc: "Unggah berkas PDF dan pilih halaman atau rentang halaman yang ingin dipisahkan secara instan langsung di browsermu.",
        };
      case "image_merge":
        return {
          title: "Gabungkan Gambar Menjadi Satu",
          desc: "Mendukung JPG, PNG, SVG, dan WebP. Simpan sebagai file multi-halaman PDF atau satu gambar panjang vertikal.",
        };
      case "convert":
        return {
          title: "Konversi Format Berkas",
          desc: "Ubah format berkas dokumen dan gambar dengan cepat dan mempertahankan kualitas aslinya.",
        };
      default:
        return {
          title: "Gabungkan Dokumen & Gambar dengan Cepat",
          desc: "Mendukung PDF, Word, PowerPoint, Excel, JPG, PNG, dan format lainnya. Proses instan langsung di browsermu.",
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-8 flex flex-col items-center w-full">
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {headerInfo.title}
        </h1>
        <p className="mt-3 text-base text-slate-600">{headerInfo.desc}</p>
      </div>

      <FileUploader />
      <Workspace />

      {/* Split PDF Page Selection Box */}
      {currentMode === "split" && files.length > 0 && (
        <div className="w-full max-w-3xl bg-white border border-blue-200 rounded-2xl p-6 shadow-sm mb-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold text-base">
            <Scissors className="w-5 h-5 text-blue-600" />
            <span>Pengaturan Halaman Split PDF</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="splitMode"
                checked={splitMode === "range"}
                onChange={() => setSplitMode("range")}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>Pilih Halaman Tertentu / Rentang (Range)</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="splitMode"
                checked={splitMode === "all"}
                onChange={() => setSplitMode("all")}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>Ekstrak Semua Halaman (1 - {files[0].pageCount || 1})</span>
            </label>
          </div>

          {splitMode === "range" && (
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder={`Contoh: 1-3, 5 (Maks: ${files[0].pageCount || 1} halaman)`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setSplitRange(`1-${files[0].pageCount || 1}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all"
                >
                  Pilih Semua
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  Gunakan tanda hubung <code>-</code> untuk rentang (misal <code>1-5</code>) dan koma <code>,</code> untuk halaman tunggal (misal <code>1-3, 5, 8</code>). Total halaman berkas: <strong>{files[0].pageCount || 1}</strong>.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control bar when files exist */}
      {files.length > 0 && (
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
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
            onClick={handleAction}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusMessage || "Memproses..."}</span>
              </>
            ) : currentMode === "split" ? (
              <>
                <Scissors className="w-4 h-4" />
                <span>Ekstrak & Unduh PDF</span>
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

      {/* Docs / Office Fallback Modal / Alert */}
      {docsNoticeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Server Worker Dokumen Belum Aktif
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Penggabungan file <strong>DOCX/Word, PPTX, atau Excel</strong> memerlukan backend konversi LibreOffice (Docker/Gotenberg) yang saat ini belum berjalan di <code>http://localhost:4000</code>.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-500 mt-3">
              <strong>Solusi Cepat:</strong><br />
              1. Simpan dokumen Word Anda sebagai <strong>PDF</strong> terlebih dahulu (<em>File &gt; Save As &gt; PDF</em>).<br />
              2. Unggah file PDF tersebut di menu <strong>Merge PDF</strong> untuk penggabungan instan langsung di browser tanpa butuh backend server!
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDocsNoticeOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-all"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give a Coffee Section */}
      <GiveACoffee />
    </div>
  );
}
