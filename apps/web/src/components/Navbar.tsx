"use client";

import React from "react";
import { useAppStore, OperationMode } from "@/store/useAppStore";
import { Files, Image, Scissors, RefreshCw } from "lucide-react";

export const Navbar = () => {
  const { currentMode, setMode } = useAppStore();

  const navItems: { mode: OperationMode; label: string; icon: React.ReactNode }[] = [
    { mode: "document_merge", label: "Document Merge", icon: <Files className="w-4 h-4" /> },
    { mode: "image_merge", label: "Image Merge", icon: <Image className="w-4 h-4" /> },
    { mode: "split", label: "Split PDF", icon: <Scissors className="w-4 h-4" /> },
    { mode: "convert", label: "Convert", icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b bg-white border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode("document_merge")}>
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            Merge<span className="text-blue-600">DuluDong</span>
          </span>
        </div>

        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {navItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentMode === item.mode
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
