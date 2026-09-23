# Detailed Tickets: MDD-101 to MDD-302 (Tickets 1 - 9)
**Project**: MergeDuluDong  
**Scope**: Epic 1, Epic 2, and start of Epic 3  

---

## Ticket 1: MDD-101 - Project & Monorepo Initialization
- **Type**: Task / Setup
- **Epic**: Epic 1 (Project Setup & Infrastructure)
- **Priority**: High
- **Description**: Setup struktur monorepo/folder proyek yang memisahkan aplikasi Frontend (Next.js/React + Tailwind CSS) dan Backend API/Worker (Node.js/Express atau NestJS).
- **Acceptance Criteria**:
  - Struktur folder teratur (`apps/web`, `apps/api` atau monorepo setup serupa).
  - TypeScript strict mode terkonfigurasi di frontend dan backend.
  - ESLint dan Prettier terintegrasi.
  - Skrip `npm run dev` atau sejenisnya dapat menjalankan development environment secara mulus.

---

## Ticket 2: MDD-102 - Docker Compose Setup for Redis & Gotenberg
- **Type**: DevOps / Infrastructure
- **Epic**: Epic 1 (Project Setup & Infrastructure)
- **Priority**: High
- **Description**: Buat file `docker-compose.yml` untuk menjalankan layanan pendukung konversi dokumen dan message broker antrean worker.
- **Acceptance Criteria**:
  - Konfigurasi Redis container dengan persistensi data dan port binding standar (6379).
  - Konfigurasi Gotenberg container (versi 8+) dengan modul LibreOffice dan Chromium aktif.
  - Healthcheck terkonfigurasi untuk kedua service.
  - File `.env.example` terdokumentasi dengan variabel koneksi Redis & Gotenberg.

---

## Ticket 3: MDD-103 - Base UI Shell, Layout & Global Navigation
- **Type**: Frontend Feature
- **Epic**: Epic 1 (Project Setup & Infrastructure)
- **Priority**: Medium
- **Description**: Bangun layout utama web termasuk Navbar, Footer, sistem tema (Tailwind), dan state management global untuk tracking proses aktif.
- **Acceptance Criteria**:
  - Navbar dengan navigasi utama: Merge (Document / Image), Split, Convert.
  - Responsive design (Mobile & Desktop).
  - Global state store (Zustand/Context) untuk menyimpan file yang diunggah dan status operasi.

---

## Ticket 4: MDD-201 - Drag-and-Drop File Uploader with Format Validation
- **Type**: Frontend Feature
- **Epic**: Epic 2 (Client-Side Workspace & Merge Engine)
- **Priority**: High
- **Description**: Buat komponen Uploader yang mendukung drag-and-drop banyak file secara bersamaan dengan validasi ekstensi dan ukuran file di sisi client.
- **Acceptance Criteria**:
  - Mendukung drag-and-drop dan klik file dialog.
  - Validasi tipe file sesuai mode terpilih:
    - *Document Merge*: `.pdf`, `.docx`, `.doc`, `.odt`, `.rtf`, `.jpg`, `.png`, `.svg`.
    - *Image Merge*: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`.
  - Validasi ukuran maksimal file (misal: 50MB per file).
  - Menampilkan toast/pesan error yang jelas jika file tidak valid.

---

## Ticket 5: MDD-202 - Interactive Pre-Merge Workspace
- **Type**: Frontend Feature
- **Epic**: Epic 2 (Client-Side Workspace & Merge Engine)
- **Priority**: High
- **Description**: Workspace visual untuk menampilkan thumbnail dokumen/gambar sebelum proses merge dilakukan.
- **Acceptance Criteria**:
  - Render visual thumbnail preview untuk setiap halaman PDF menggunakan `pdfjs-dist`.
  - Preview langsung untuk file gambar (`<img>` thumbnail).
  - Reordering kartu halaman/file menggunakan drag-and-drop (`@dnd-kit`).
  - Kontrol per halaman: tombol rotasi halaman (90°, 180°, 270°) dan tombol hapus halaman.

---

## Ticket 6: MDD-203 - Client-Side Pure PDF Merger
- **Type**: Frontend Feature / Core Engine
- **Epic**: Epic 2 (Client-Side Workspace & Merge Engine)
- **Priority**: High
- **Description**: Buat engine penggabung file PDF murni menggunakan `pdf-lib` langsung di browser pengguna tanpa melibatkan server.
- **Acceptance Criteria**:
  - Menggabungkan 2 atau lebih file PDF sesuai urutan dan orientasi rotasi dari Workspace.
  - Penanganan file PDF terproteksi password (memberikan prompt password atau notifikasi error).
  - Menghasilkan file blob PDF gabungan dan otomatis memicu download di browser.
  - Memory cleanup: melepaskan object URLs setelah download selesai.

---

## Ticket 7: MDD-204 - Client-Side Image Merger (Multi-Page PDF & Stitched)
- **Type**: Frontend Feature / Core Engine
- **Epic**: Epic 2 (Client-Side Workspace & Merge Engine)
- **Priority**: High
- **Description**: Engine client-side untuk menggabungkan format gambar menjadi Multi-Page PDF atau menjadi 1 gambar komposit/panjang (*stitched*).
- **Acceptance Criteria**:
  - Mode 1: Convert dan susun gambar menjadi Multi-page PDF via `pdf-lib`.
  - Mode 2: Jahit gambar (*stitch*) vertikal, horizontal, atau grid via HTML5 Canvas.
  - Pilihan export output gambar gabungan (PNG / JPG / WEBP).
  - Pengaturan margin, orientasi, dan resolusi dasar.

---

## Ticket 8: MDD-301 - Backend Multi-part Upload Endpoint & Temp Storage
- **Type**: Backend Feature
- **Epic**: Epic 3 (Backend Worker & Heavy Conversion)
- **Priority**: High
- **Description**: Endpoint API untuk menerima upload file heterogen yang membutuhkan konversi di server.
- **Acceptance Criteria**:
  - Endpoint `POST /api/v1/jobs/upload` dengan Multer.
  - Simpan file ke direktori temporary yang terisolasi berdasarkan `jobId` (UUID v4).
  - Validasi magic number MIME type file di server.
  - Return metadata job ID dan daftar file yang terdaftar.

---

## Ticket 9: MDD-302 - BullMQ Worker Queue & Redis Setup
- **Type**: Backend Feature / Infrastructure
- **Epic**: Epic 3 (Backend Worker & Heavy Conversion)
- **Priority**: High
- **Description**: Setup arsitektur background worker menggunakan BullMQ dan Redis untuk memproses antrean tugas konversi secara asynchronous.
- **Acceptance Criteria**:
  - Inisialisasi antrean `document-conversion` dengan BullMQ.
  - Konfigurasi batas concurrency worker untuk mencegah penggunaan CPU/RAM berlebih.
  - Mekanisme retry (misal: 2 kali percobaan) jika terjadi network glitch ke Gotenberg.
  - Endpoint `GET /api/v1/jobs/:jobId/status` untuk mengecek progress/status antrean.
