"use client";

import React, { useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getPdfPageCount } from "@/lib/clientMergeEngine";
import { UploadCloud, AlertCircle } from "lucide-react";

export const FileUploader = () => {
  const {
    currentMode,
    docSubtype,
    imageSubtype,
    addFiles,
    updateFilePageCount,
  } = useAppStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic accepted extensions based on currentMode and selected dropdown subtype
  let acceptedExtensions: string[] = [];

  if (currentMode === "document_merge") {
    switch (docSubtype) {
      case "pdf":
        acceptedExtensions = [".pdf"];
        break;
      case "docs":
        acceptedExtensions = [".docx", ".doc", ".odt", ".rtf"];
        break;
      case "slide":
        acceptedExtensions = [".pptx", ".ppt", ".odp"];
        break;
      case "sheets":
        acceptedExtensions = [".xlsx", ".xls", ".ods", ".csv"];
        break;
      default:
        acceptedExtensions = [".pdf"];
    }
  } else if (currentMode === "image_merge") {
    switch (imageSubtype) {
      case "jpeg":
        acceptedExtensions = [".jpg", ".jpeg"];
        break;
      case "png":
        acceptedExtensions = [".png"];
        break;
      case "svg":
        acceptedExtensions = [".svg"];
        break;
      default:
        acceptedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
    }
  } else if (currentMode === "split") {
    acceptedExtensions = [".pdf"];
  } else if (currentMode === "convert") {
    acceptedExtensions = [
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
  }

  const validateAndAdd = async (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validList: File[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedExtensions.includes(ext)) {
        setErrorMessage(
          `Format ${ext} tidak sesuai dengan kategori yang dipilih (${acceptedExtensions.join(", ")}).`
        );
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

      // Pre-calculate page counts for PDF files (important for Split PDF mode)
      for (const file of validList) {
        if (file.name.toLowerCase().endsWith(".pdf")) {
          getPdfPageCount(file).then((count) => {
            // Find matched workspace file
            const matched = useAppStore
              .getState()
              .files.find((f) => f.file === file || (f.name === file.name && f.size === file.size));
            if (matched) {
              updateFilePageCount(matched.id, count);
            }
          });
        }
      }
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
          multiple={currentMode !== "split"}
          accept={acceptedExtensions.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
          }}
        />

        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 text-center">
          Tarik & Lepaskan berkas di sini, atau <span className="text-blue-600">Pilih Berkas</span>
        </h3>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Format didukung: <span className="font-medium text-slate-700">{acceptedExtensions.join(", ")}</span> (Maks 50MB per file)
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
