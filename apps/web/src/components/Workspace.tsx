"use client";

import React from "react";
import { useAppStore, WorkspaceFile } from "@/store/useAppStore";
import { RotateCw, Trash2, ArrowLeft, ArrowRight, FileText, Image as ImageIcon } from "lucide-react";

export const Workspace = () => {
  const { files, removeFile, rotateFile, reorderFiles, clearFiles, currentMode } = useAppStore();

  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto my-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {currentMode === "split" ? "Berkas PDF Siap Di-split" : `Workspace Dokumen (${files.length} file)`}
          </h2>
          <p className="text-xs text-slate-500">
            {currentMode === "split"
              ? "Pratinjau berkas PDF sebelum mengekstrak halaman."
              : "Atur urutan, putar halaman, atau hapus file sebelum proses merge."}
          </p>
        </div>
        <button
          onClick={clearFiles}
          className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all"
        >
          Bersihkan Semua
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
        {files.map((item, index) => (
          <FileCard
            key={item.id}
            item={item}
            index={index}
            total={files.length}
            isSplitMode={currentMode === "split"}
            onRemove={() => removeFile(item.id)}
            onRotate={() => rotateFile(item.id)}
            onMoveLeft={() => reorderFiles(index, index - 1)}
            onMoveRight={() => reorderFiles(index, index + 1)}
          />
        ))}
      </div>
    </div>
  );
};

interface FileCardProps {
  item: WorkspaceFile;
  index: number;
  total: number;
  isSplitMode?: boolean;
  onRemove: () => void;
  onRotate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

const FileCard: React.FC<FileCardProps> = ({
  item,
  index,
  total,
  isSplitMode,
  onRemove,
  onRotate,
  onMoveLeft,
  onMoveRight,
}) => {
  const isImage = item.type.startsWith("image/");

  return (
    <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group">
      {/* Thumbnail area */}
      <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden p-2">
        {isImage && item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.name}
            style={{ transform: `rotate(${item.rotation}deg)` }}
            className="max-h-full max-w-full object-contain transition-transform duration-300"
          />
        ) : (
          <div
            style={{ transform: `rotate(${item.rotation}deg)` }}
            className="flex flex-col items-center justify-center text-slate-400 transition-transform duration-300"
          >
            {isImage ? (
              <ImageIcon className="w-12 h-12" />
            ) : (
              <FileText className="w-12 h-12 text-blue-500" />
            )}
            <span className="text-xs uppercase font-bold mt-2">
              {item.name.split(".").pop()}
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          #{index + 1}
        </div>

        {item.pageCount !== undefined && item.pageCount > 0 && (
          <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {item.pageCount} Hal
          </div>
        )}
      </div>

      {/* Info & action buttons */}
      <div className="p-3 bg-white flex flex-col justify-between flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate" title={item.name}>
          {item.name}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {(item.size / 1024 / 1024).toFixed(2)} MB
          {item.pageCount !== undefined && item.pageCount > 0 && ` • ${item.pageCount} Halaman`}
        </p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3">
          {!isSplitMode ? (
            <div className="flex items-center gap-1">
              <button
                disabled={index === 0}
                onClick={onMoveLeft}
                title="Pindah ke kiri"
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={index === total - 1}
                onClick={onMoveRight}
                title="Pindah ke kanan"
                className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRotate}
                title="Putar 90°"
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Siap diekstrak</div>
          )}

          <button
            onClick={onRemove}
            title="Hapus"
            className="p-1 rounded text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
