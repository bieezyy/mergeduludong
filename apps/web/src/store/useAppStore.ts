import { create } from "zustand";

export type OperationMode = "document_merge" | "image_merge" | "split" | "convert";

export type DocumentSubtype = "all" | "pdf" | "docs" | "slide" | "sheets";
export type ImageSubtype = "all" | "jpeg" | "png" | "svg";

export interface WorkspaceFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  rotation: number; // 0, 90, 180, 270
  previewUrl?: string;
  pageCount?: number;
}

interface AppState {
  currentMode: OperationMode;
  docSubtype: DocumentSubtype;
  imageSubtype: ImageSubtype;
  splitRange: string;
  splitMode: "range" | "all";
  files: WorkspaceFile[];
  isProcessing: boolean;
  statusMessage: string;
  setMode: (mode: OperationMode) => void;
  setDocSubtype: (subtype: DocumentSubtype) => void;
  setImageSubtype: (subtype: ImageSubtype) => void;
  setSplitRange: (range: string) => void;
  setSplitMode: (splitMode: "range" | "all") => void;
  addFiles: (newFiles: File[]) => void;
  updateFilePageCount: (id: string, count: number) => void;
  removeFile: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  rotateFile: (id: string) => void;
  clearFiles: () => void;
  setProcessing: (isProcessing: boolean, message?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentMode: "document_merge",
  docSubtype: "all",
  imageSubtype: "all",
  splitRange: "",
  splitMode: "range",
  files: [],
  isProcessing: false,
  statusMessage: "",

  setMode: (mode) => set({ currentMode: mode, files: [] }),
  setDocSubtype: (subtype) => set({ docSubtype: subtype }),
  setImageSubtype: (subtype) => set({ imageSubtype: subtype }),
  setSplitRange: (range) => set({ splitRange: range }),
  setSplitMode: (splitMode) => set({ splitMode }),

  addFiles: (newFiles) =>
    set((state) => {
      const mapped = newFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        rotation: 0,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));
      return { files: [...state.files, ...mapped] };
    }),

  updateFilePageCount: (id, count) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, pageCount: count } : f)),
    })),

  removeFile: (id) =>
    set((state) => {
      const target = state.files.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return { files: state.files.filter((f) => f.id !== id) };
    }),

  reorderFiles: (fromIndex, toIndex) =>
    set((state) => {
      const updated = [...state.files];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { files: updated };
    }),

  rotateFile: (id) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f
      ),
    })),

  clearFiles: () =>
    set((state) => {
      state.files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
      return { files: [] };
    }),

  setProcessing: (isProcessing, message = "") =>
    set({ isProcessing, statusMessage: message }),
}));
