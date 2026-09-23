# Implementation Plan
**Project**: MergeDuluDong  
**Version**: 1.0.0  

---

## 1. Tahapan Pengembangan (Phases)

### Phase 1: Foundation & Project Setup
- Setup repository, linting, formatting, dan CI pipeline dasar.
- Inisialisasi arsitektur frontend (Next.js/React + Tailwind CSS) & backend worker (Node.js/BullMQ/Redis).
- Konfigurasi Docker compose untuk Redis dan Gotenberg (LibreOffice/Chromium headless).

### Phase 2: Client-Side Core Engine (PDF & Image)
- Implementasi library client-side (`pdf-lib`, PDF.js, Canvas API).
- Fitur drag-and-drop workspace dengan thumbnail preview, reordering, dan rotasi halaman.
- Engine merge client-side untuk:
  - PDF + PDF (Multi-page).
  - JPG/PNG/WEBP ke Multi-page PDF.
  - Image Stitched (Vertical/Horizontal/Grid via Canvas).

### Phase 3: Server-Side Worker & Heavy Conversion
- Setup REST API endpoint untuk upload file berat/heterogen.
- Implementasi worker queue dengan BullMQ untuk:
  - Konversi DOCX/ODT/RTF -> PDF via Gotenberg.
  - Konversi SVG kompleks & rasterisasi gambar via Sharp.
- Mekanisme polling / SSE / WebSocket untuk status progress konversi.

### Phase 4: Split, Convert, & Utility Features
- Split PDF (range extraction, split-by-page).
- Document & Image Converter module.
- Auto-normalization (menyeragamkan ukuran halaman A4/Letter dan orientasi).

### Phase 5: Security, Ephemeral Storage, & Cleanup
- Implementasi validasi MIME type & sanitasi file.
- Scheduled cleanup job (TTL 1 jam) untuk menghapus temporary files.
- Rate limiting API dan proteksi resource allocation (max upload size & concurrency).

### Phase 6: Testing, Polish, & Deployment
- Unit & integration tests (frontend component tests & worker queue tests).
- Benchmark performa dan optimasi memory leak.
- Setup production deployment (Dockerized backend, static/edge frontend).

---

## 2. Dependencies & Prerequisites
- **Node.js**: v20 LTS
- **Docker & Docker Compose**: Untuk Redis dan Gotenberg service
- **Frontend Libraries**: `pdf-lib`, `pdfjs-dist`, `@dnd-kit` (drag & drop), `lucide-react`, `tailwind`
- **Backend Libraries**: `bullmq`, `ioredis`, `sharp`, `multer`, `archiver` (ZIP generation)
