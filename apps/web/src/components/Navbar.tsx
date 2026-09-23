"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore, OperationMode, DocumentSubtype, ImageSubtype } from "@/store/useAppStore";
import {
  Files,
  Image as ImageIcon,
  Scissors,
  RefreshCw,
  ChevronDown,
  FileText,
  Presentation,
  Sheet,
  FileCode,
} from "lucide-react";

export const Navbar = () => {
  const {
    currentMode,
    setMode,
    docSubtype,
    setDocSubtype,
    imageSubtype,
    setImageSubtype,
  } = useAppStore();

  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);

  const docDropdownRef = useRef<HTMLDivElement>(null);
  const imgDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docDropdownRef.current && !docDropdownRef.current.contains(event.target as Node)) {
        setDocDropdownOpen(false);
      }
      if (imgDropdownRef.current && !imgDropdownRef.current.contains(event.target as Node)) {
        setImageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Removed "Semua Format Dokumen"
  const docOptions: { subtype: DocumentSubtype; label: string; icon: React.ReactNode; desc: string }[] = [
    { subtype: "pdf", label: "Merge PDF", icon: <FileText className="w-4 h-4 text-red-500" />, desc: "Gabung berkas PDF murni" },
    { subtype: "docs", label: "Merge Docs", icon: <FileText className="w-4 h-4 text-blue-500" />, desc: "Word .docx, .doc, .odt, .rtf" },
    { subtype: "slide", label: "Merge Slide", icon: <Presentation className="w-4 h-4 text-amber-500" />, desc: "PowerPoint .pptx, .ppt, .odp" },
    { subtype: "sheets", label: "Merge Sheets", icon: <Sheet className="w-4 h-4 text-emerald-500" />, desc: "Excel .xlsx, .xls, .ods, .csv" },
  ];

  const imageOptions: { subtype: ImageSubtype; label: string; icon: React.ReactNode; desc: string }[] = [
    { subtype: "all", label: "Semua Format Gambar", icon: <ImageIcon className="w-4 h-4" />, desc: "JPG, PNG, WebP, SVG" },
    { subtype: "jpeg", label: "Merge JPEG/JPG", icon: <ImageIcon className="w-4 h-4 text-blue-500" />, desc: "Format foto .jpg dan .jpeg" },
    { subtype: "png", label: "Merge PNG", icon: <ImageIcon className="w-4 h-4 text-purple-500" />, desc: "Format PNG transparan/grafis" },
    { subtype: "svg", label: "Merge SVG", icon: <FileCode className="w-4 h-4 text-orange-500" />, desc: "Grafik vektor SVG" },
  ];

  return (
    <header className="border-b bg-white border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => {
            setMode("document_merge");
            setDocSubtype("pdf");
          }}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            Merge<span className="text-blue-600">DuluDong</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {/* 1. Document Merge (With Dropdown) */}
          <div className="relative" ref={docDropdownRef}>
            <div
              className={`flex items-center rounded-lg text-sm font-medium transition-all ${
                currentMode === "document_merge"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <button
                onClick={() => {
                  setMode("document_merge");
                }}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <Files className="w-4 h-4" />
                <span>{docOptions.find((o) => o.subtype === docSubtype)?.label || "Merge PDF"}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDocDropdownOpen(!docDropdownOpen);
                  setImageDropdownOpen(false);
                }}
                className="pr-2 pl-0.5 py-1.5 hover:text-blue-700 transition-colors cursor-pointer"
                title="Pilih jenis dokumen"
              >
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {docDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pilih Kategori Dokumen
                </div>
                {docOptions.map((opt) => (
                  <button
                    key={opt.subtype}
                    onClick={() => {
                      setMode("document_merge");
                      setDocSubtype(opt.subtype);
                      setDocDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                      currentMode === "document_merge" && docSubtype === opt.subtype
                        ? "bg-blue-50/70 text-blue-700 font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="mt-0.5">{opt.icon}</div>
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Image Merge (With Dropdown) */}
          <div className="relative" ref={imgDropdownRef}>
            <div
              className={`flex items-center rounded-lg text-sm font-medium transition-all ${
                currentMode === "image_merge"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <button
                onClick={() => {
                  setMode("image_merge");
                }}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <ImageIcon className="w-4 h-4" />
                <span>
                  {imageSubtype === "all"
                    ? "Image Merge"
                    : imageOptions.find((o) => o.subtype === imageSubtype)?.label}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageDropdownOpen(!imageDropdownOpen);
                  setDocDropdownOpen(false);
                }}
                className="pr-2 pl-0.5 py-1.5 hover:text-blue-700 transition-colors cursor-pointer"
                title="Pilih jenis gambar"
              >
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {imageDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pilih Kategori Gambar
                </div>
                {imageOptions.map((opt) => (
                  <button
                    key={opt.subtype}
                    onClick={() => {
                      setMode("image_merge");
                      setImageSubtype(opt.subtype);
                      setImageDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                      currentMode === "image_merge" && imageSubtype === opt.subtype
                        ? "bg-blue-50/70 text-blue-700 font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="mt-0.5">{opt.icon}</div>
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Split PDF */}
          <button
            onClick={() => setMode("split")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentMode === "split"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Split PDF</span>
          </button>

          {/* 4. Convert */}
          <button
            onClick={() => setMode("convert")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentMode === "convert"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Convert</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
