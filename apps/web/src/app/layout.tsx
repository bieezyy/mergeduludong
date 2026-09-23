import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MergeDuluDong - Platform Merge & Convert Dokumen & Gambar",
  description: "Gabungkan dokumen PDF, Word, gambar JPG/PNG/SVG dengan mudah, cepat, dan aman.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 bg-white">
          <p>© {new Date().getFullYear()} MergeDuluDong. Ephemeral & Secure Processing.</p>
        </footer>
      </body>
    </html>
  );
}
