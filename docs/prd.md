# Product Requirement Document (PRD)
**Project**: MergeDuluDong  
**Status**: Draft  
**Version**: 1.0.0  

---

## 1. Ringkasan Eksekutif & Visi Produk
**MergeDuluDong** adalah platform web berbasis produktivitas untuk manipulasi dokumen dan gambar (Merge, Split, Convert) dengan alur kerja yang cepat, aman, dan fleksibel. Platform ini mengatasi kompleksitas penggabungan format heterogen (PDF, DOCX, JPG, PNG, SVG) dengan pendekatan hybrid (client-side processing untuk tugas ringan dan worker-queue server untuk konversi berat).

---

## 2. Masalah & Solusi
| Masalah | Solusi |
|---|---|
| User bingung menggabungkan berbagai format file yang berbeda (misal: PDF + Word + Gambar). | Sistem *Universal Pipeline*: Konversi intermediate otomatis ke PDF sebelum proses merge. |
| Output merge gambar sering tidak jelas (apakah jadi 1 PDF atau 1 gambar gabungan). | Pemisahan eksplisit mode: **Document Merge** (output PDF) dan **Image Merge** (output Image Stitched/PDF). |
| Privasi dan keamanan data dokumen sensitif. | *Ephemeral Storage*: File otomatis terhapus dalam 1 jam setelah selesai diproses. |
| Beban server tinggi dan lambat jika semua proses merge dilakukan di backend. | *Client-Side First*: Proses merge PDF/gambar standar dijalankan di browser (WASM/Canvas). |

---

## 3. Fitur Utama

### 3.1. Mode Merge
* **Document Merge**:
  * Input yang didukung: PDF, DOCX, DOC, ODT, RTF, JPG, PNG, SVG.
  * Pipeline: Dokumen non-PDF dikonversi menjadi PDF sementara, kemudian digabungkan ke 1 dokumen PDF akhir.
  * Opsi: Normalisasi ukuran halaman (A4, Letter, atau Fit to Original), penomoran halaman otomatis.
* **Image Merge**:
  * Input yang didukung: JPG, PNG, WEBP, SVG.
  * Pilihan output:
    1. *Multi-page PDF*: Gambar disusun per halaman PDF.
    2. *Stitched Image (Grid/Vertical/Horizontal)*: Gambar digabung menjadi 1 file gambar besar (PNG/JPG).
  * Opsi: Pengaturan margin, orientasi, dan background color.

### 3.2. Split Document & Image
* **PDF Split**:
  * Ekstrak rentang halaman tertentu (misal: halaman 1-3, 5).
  * Pisah setiap halaman menjadi file PDF terpisah.
* **Image Split / Crop**:
  * Memotong gambar berukuran panjang atau grid menjadi bagian-bagian terpisah (ZIP output).

### 3.3. File Converter
* Document ke PDF: DOCX/DOC/ODT -> PDF.
* Image ke Image: SVG -> PNG/JPG/WEBP, WebP -> JPG/PNG.
* PDF ke Image: Ekstrak halaman PDF menjadi lembaran JPG/PNG.

### 3.4. Interactive Workspace (Pre-Merge Canvas)
* Thumbnail preview per halaman/file.
* Drag-and-drop untuk mengubah urutan (reorder).
* Fitur rotasi per halaman (90°, 180°, 270°).
* Tombol hapus halaman/file yang tidak diinginkan.

---

## 4. Alur Kerja Pengguna (User Flow)
1. **Pilih Operasi**: Pengguna memilih menu utama (Merge, Split, atau Convert).
2. **Pilih Mode (Khusus Merge)**: Pengguna memilih *Document Merge* atau *Image Merge*.
3. **Upload File**: Drag-and-drop file multi-format.
4. **Interactive Adjustment**:
   - Melihat visual thumbnail.
   - Atur urutan file/halaman.
   - Pilih opsi layout (Orientasi, Ukuran Halaman, Mode Output).
5. **Eksekusi Pemrosesan**:
   - Jika murni PDF/Image (Client-side): Langsung diproses instan via browser.
   - Jika butuh konversi (DOCX/SVG kompleks): Upload ke worker antrean backend.
6. **Download**: Pengguna mengunduh hasil (file tunggal atau ZIP).
7. **Pembersihan Otomatis**: File sementara di server dihapus dalam 1 jam (TTL).

---

## 5. Arsitektur Teknis & Stack Rekomendasi
* **Frontend**: Next.js / React + Tailwind CSS.
  - Client Processing: `pdf-lib`, `PDF.js` (render thumbnail preview), HTML5 Canvas / Fabric.js.
* **Backend API & Worker**: Node.js (NestJS / Express) atau Python (FastAPI).
  - Queue Engine: Redis + BullMQ (Node) / Celery (Python).
  - Document Engine: Gotenberg (Headless Chromium & LibreOffice dalam Docker).
  - Image Engine: `sharp` (Node.js) atau `Pillow` / `ImageMagick`.
* **Storage**: Temporary local volume / S3 bucket dengan auto-lifecycle policy (1 jam TTL).

---

## 6. Kriteria Keberhasilan (Non-Functional Requirements)
* **Kecepatan**: Merge client-side selesai < 3 detik untuk file di bawah 20MB.
* **Reliabilitas Server**: Server tidak kehabisan RAM dengan isolasi worker pool (max concurrent process limits).
* **Keamanan**:
  - Scanning file input terhadap executable/macro berbahaya.
  - Enkripsi transit (HTTPS) dan pembersihan otomatis tanpa retensi riwayat file user.
