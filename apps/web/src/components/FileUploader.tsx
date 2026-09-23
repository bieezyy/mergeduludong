"use client";

import React, { useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { UploadCloud, AlertCircle } from "lucide-react";

export const FileUploader = () => {
  const { currentMode, addFiles } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions =
    currentMode === "image_merge"
      ? [".jpg", ".jpeg", ".png", ".webp", ".svg"]
      : [".pdf", ".docx", ".doc", ".odt", ".rtf", ".jpg", ".jpeg", ".png", ".webp", ".svg"];

  const validateAndAdd = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validList: File[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedExtensions.includes(ext)) {
        setErrorMessage(`Format ${ext} tidak didukung pada mode ini.`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(`File ${file.name} melebihi batas 50MB.`);
        return;
      }
      validList.push(file);
    });

    if (validList.length > 0) {
      addFiles(validList);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      validateAndAdd(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragOver
            ? "border-blue-500 bg-blue-50/60"
            : "border-slate-300 hover:border-blue-400 bg-white shadow-sm"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
          }}
        />

        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800">
          Tarik & Lepaskan file di sini, atau <span className="text-blue-600">Pilih File</span>
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Format didukung: {acceptedExtensions.join(", ")} (Maks 50MB per file)
        </p>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
