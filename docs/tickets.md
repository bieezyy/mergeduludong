# Tickets Breakdown
**Project**: MergeDuluDong  
**Total Tickets**: 18 Tickets (Across 6 Epics)

---

## Ringkasan Distribusi Ticket
- **Epic 1: Project Setup & Infrastructure** (3 Tickets)
- **Epic 2: Client-Side Workspace & Merge Engine** (4 Tickets)
- **Epic 3: Backend Worker & Conversion Engine** (4 Tickets)
- **Epic 4: Split & Convert Modules** (3 Tickets)
- **Epic 5: Security & Ephemeral Storage** (2 Tickets)
- **Epic 6: Quality Assurance & Deployment** (2 Tickets)

---

### Epic 1: Project Setup & Infrastructure
- **MDD-101**: Setup Monorepo / Proyek Frontend (Next.js) & Backend (Express/NestJS) dengan TypeScript dan Tailwind CSS.
- **MDD-102**: Setup Docker Compose untuk Redis dan Gotenberg container.
- **MDD-103**: Konfigurasi base layout UI, navigation, dan state management (Zustand/Context).

### Epic 2: Client-Side Workspace & Merge Engine
- **MDD-201**: Implementasi Drag-and-Drop file uploader dengan validasi format dan batas ukuran.
- **MDD-202**: Interactive Pre-merge Workspace (render thumbnail via PDF.js, reordering via `@dnd-kit`, rotate, dan remove page).
- **MDD-203**: Client-side PDF Merger menggunakan `pdf-lib` (PDF ke PDF).
- **MDD-204**: Client-side Image Merger (JPG/PNG/WEBP ke Multi-page PDF dan Image Stitched via Canvas).

### Epic 3: Backend Worker & Conversion Engine
- **MDD-301**: Setup upload endpoint multi-part form data dengan Multer ke temporary storage.
- **MDD-302**: Integrasi BullMQ worker queue untuk tugas konversi asynchronous.
- **MDD-303**: Worker konversi dokumen (DOCX/DOC/ODT/RTF -> PDF) via Gotenberg API.
- **MDD-304**: Integrasi pipeline penggabungan dokumen heterogen (convert first -> merge -> return download link).

### Epic 4: Split & Convert Modules
- **MDD-401**: Modul PDF Splitter (ekstrak rentang halaman atau split per halaman dengan output file/ZIP).
- **MDD-402**: Modul Standalone File Converter (DOCX to PDF, Image to WebP/PNG/JPG).
- **MDD-403**: Fitur Page Normalization (opsi auto-fit ke dimensi standar A4/Letter saat merge).

### Epic 5: Security & Ephemeral Storage
- **MDD-501**: Implementasi File Sanitization, validasi magic number / MIME type, dan rate limiter.
- **MDD-502**: Implementasi automated cleanup cron job (menghapus temporary files dengan TTL > 1 jam).

### Epic 6: Quality Assurance & Deployment
- **MDD-601**: Unit test & integration test untuk client-side merge logic dan background worker.
- **MDD-602**: Konfigurasi Docker production build dan environment configuration guide.
