# Detailed Tickets: MDD-303 to MDD-602 (Tickets 10 - 18)
**Project**: MergeDuluDong  
**Scope**: Epic 3 (Completion), Epic 4, Epic 5, and Epic 6  

---

## Ticket 10: MDD-303 - Document Conversion Worker (Office to PDF via Gotenberg)
- **Type**: Backend Feature / Worker Engine
- **Epic**: Epic 3 (Backend Worker & Heavy Conversion)
- **Priority**: High
- **Description**: Implementasi worker processor yang mengirim dokumen Office (DOCX, DOC, ODT, RTF) ke Gotenberg API untuk dikonversi menjadi file PDF perantara (*intermediate PDF*).
- **Acceptance Criteria**:
  - Worker membaca job dari antrean `document-conversion`.
  - Integrasi HTTP client ke Gotenberg LibreOffice route (`/forms/libreoffice/convert`).
  - Menyimpan hasil konversi PDF ke folder temporary job.
  - Penanganan error dokumen korup atau terproteksi kata sandi dengan status error yang deskriptif.

---

## Ticket 11: MDD-304 - Heterogeneous Merge Pipeline Orchestration
- **Type**: Backend Feature / Core Engine
- **Epic**: Epic 3 (Backend Worker & Heavy Conversion)
- **Priority**: High
- **Description**: Orkestrasi alur penggabungan dokumen campuran (misal: PDF + Word + Gambar) dari antrean hingga menjadi satu file PDF final.
- **Acceptance Criteria**:
  - Konversi semua file non-PDF ke PDF sementara secara paralel/batch.
  - Menggabungkan seluruh PDF sementara menggunakan `pdf-lib` (Node.js) sesuai urutan halaman dari client.
  - Menghasilkan file PDF final siap unduh.
  - Endpoint `GET /api/v1/jobs/:jobId/download` dengan streaming response dan header file download.

---

## Ticket 12: MDD-401 - PDF Splitter Module
- **Type**: Fullstack Feature
- **Epic**: Epic 4 (Split & Convert Modules)
- **Priority**: Medium
- **Description**: Fitur untuk memecah file PDF berdasarkan rentang halaman (*page ranges*) atau memisahkan setiap halaman menjadi file PDF terpisah.
- **Acceptance Criteria**:
  - Input parsing rentang halaman fleksibel (contoh: `1-3, 5, 8-10`).
  - Opsi: "Extract selected pages into one PDF" atau "Split each page into separate PDFs".
  - Jika output terdiri dari banyak file, otomatis dikompresi menjadi file `.zip` via library `archiver`.
  - Dukungan pemrosesan di client-side untuk file PDF berukuran kecil (<20MB).

---

## Ticket 13: MDD-402 - Standalone File Converter Module
- **Type**: Fullstack Feature
- **Epic**: Epic 4 (Split & Convert Modules)
- **Priority**: Medium
- **Description**: Fitur mandiri untuk konversi satu atau banyak file dari satu format ke format lain tanpa proses merge.
- **Acceptance Criteria**:
  - Konversi Dokumen: DOCX/DOC/ODT -> PDF.
  - Konversi Gambar: SVG -> PNG/JPG/WEBP, WEBP -> JPG/PNG, PNG -> JPG.
  - PDF ke Gambar: Ekstrak halaman PDF menjadi lembaran JPG/PNG dalam bentuk arsip ZIP.
  - Pengaturan kualitas gambar output (kompresi 60% - 100%).

---

## Ticket 14: MDD-403 - Smart Page Normalization
- **Type**: Core Feature / Enhancement
- **Epic**: Epic 4 (Split & Convert Modules)
- **Priority**: Low
- **Description**: Modul opsi layout untuk menyeragamkan ukuran dimensi halaman dokumen heterogen saat digabungkan.
- **Acceptance Criteria**:
  - Opsi preset ukuran: A4 (standar), US Letter, atau Fit to Original.
  - Opsi penataan gambar/dokumen yang lebih kecil: Center dengan margin, Fit to Page (Aspect Ratio preserved), atau Stretch.
  - Preview visual efek normalisasi di interactive workspace sebelum merge dieksekusi.

---

## Ticket 15: MDD-501 - File Security, Magic Bytes Validation & Rate Limiter
- **Type**: Security / Backend
- **Epic**: Epic 5 (Security & Ephemeral Storage)
- **Priority**: High
- **Description**: Lapisan pertahanan keamanan backend untuk mencegah upload file berbahaya dan penyalahgunaan resource server.
- **Acceptance Criteria**:
  - Validasi *magic bytes* (file signature) menggunakan library seperti `file-type`, menolak file executable berkedok `.pdf` atau `.docx`.
  - Sanitasi nama file dan pencegahan serangan *Path Traversal* (`../`).
  - Rate limiting berbasis IP menggunakan Redis (`express-rate-limit` / Redis store) untuk endpoint upload dan konversi.
  - Sanitasi dokumen SVG terhadap script/XSS injection sebelum dirender.

---

## Ticket 16: MDD-502 - Ephemeral Storage & Scheduled Auto-Cleanup Job
- **Type**: Backend / DevOps
- **Epic**: Epic 5 (Security & Ephemeral Storage)
- **Priority**: High
- **Description**: Mekanisme penghapusan berkala untuk semua file temporary pengguna demi kepatuhan privasi data dan efisiensi ruang disk.
- **Acceptance Criteria**:
  - Cron job berkala (setiap 15 atau 30 menit) menggunakan `node-cron` atau BullMQ repeatable job.
  - Menghapus folder job dan file temporary yang berusia lebih dari 1 jam (TTL = 3600 detik).
  - Penghapusan instan file temporary segera setelah user selesai mengunduh (opsional via parameter `deleteOnDownload=true`).
  - Logging status cleanup tanpa mengekspos nama file atau konten dokumen.

---

## Ticket 17: MDD-601 - Automated Unit & Integration Testing
- **Type**: QA / Testing
- **Epic**: Epic 6 (Quality Assurance & Deployment)
- **Priority**: Medium
- **Description**: Buat rangkaian tes otomatis untuk memastikan keandalan pipeline merge, split, dan antrean worker.
- **Acceptance Criteria**:
  - Unit test fungsi PDF manipulation (`pdf-lib`) dengan mock dan fixture PDF dummy.
  - Integration test untuk alur antrean worker: Upload -> Queue -> Gotenberg mock/live -> Result.
  - Test validasi security (memastikan upload file palsu/berbahaya ditolak).
  - Code coverage minimal 75% pada core processing engine.

---

## Ticket 18: MDD-602 - Production Docker & Deployment Configuration
- **Type**: DevOps / Infrastructure
- **Epic**: Epic 6 (Quality Assurance & Deployment)
- **Priority**: High
- **Description**: Konfigurasi deployment siap produksi dengan containerized environment dan panduan instalasi.
- **Acceptance Criteria**:
  - Multi-stage `Dockerfile` untuk Frontend (Next.js standalone build) dan Backend API/Worker.
  - File `docker-compose.prod.yml` yang menghubungkan Frontend, Backend, Redis, dan Gotenberg dengan network terisolasi.
  - Konfigurasi batas alokasi RAM dan CPU pada masing-masing container.
  - File `README.md` dan `.env.production.example` yang menjelaskan langkah deploy dari awal.
