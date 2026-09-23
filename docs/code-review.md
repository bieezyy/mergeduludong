# Code Review Guidelines & Checklist
**Project**: MergeDuluDong  
**Version**: 1.0.0  

---

## 1. Prinsip Utama Code Review
1. **Security & Privacy First**: Jangan pernah menyimpan data pengguna lebih dari batas TTL (1 jam) dan pastikan tidak ada data sensitif masuk ke logs.
2. **Resource Management**: Operasi file manipulation berisiko tinggi terhadap memory leak dan buffer overflow; selalu gunakan stream dan pastikan file descriptor/temp memory dibersihkan.
3. **Fail Gracefully**: Format file korup atau tidak didukung harus memberikan pesan error yang jelas tanpa menyebabkan worker crash.

---

## 2. Checklist Review

### 2.1. Keamanan & Sanitasi File
- [ ] Validasi tipe file menggunakan magic bytes / file signatures, bukan hanya ekstensi string nama file.
- [ ] Batas ukuran payload file (max payload size) ditegakkan di level reverse proxy / API gateway dan aplikasi.
- [ ] Nama file yang di-upload disanitasi (hindari path traversal attacks seperti `../../`).
- [ ] Endpoint unduh file menggunakan token temporer atau ID acak (UUID v4) yang tidak bisa ditebak.

### 2.2. Manajemen Memori & Performa
- [ ] File berukuran besar diproses menggunakan streaming atau temporary disk storage, bukan ditampung utuh di RAM.
- [ ] Worker queue membatasi concurrency (concurrency limit) agar server tidak kehabisan CPU/RAM saat traffic tinggi.
- [ ] Client-side PDF rendering melepaskan object URLs (`URL.revokeObjectURL`) setelah thumbnail selesai dirender untuk mencegah memory leak di browser.
- [ ] Cleanup temporary files selalu dieksekusi di blok `finally` atau melalui background TTL cron job.

### 2.3. Logika Bisnis & Format Heterogen
- [ ] Alur intermediate conversion (Word -> PDF sebelum merge) menangani kegagalan konversi per-dokumen dengan baik.
- [ ] Mode *Document Merge* dan *Image Merge* terisolasi secara benar tanpa ambigu pada format output.
- [ ] Orientasi dan rotasi halaman PDF/gambar dihitung secara konsisten sebelum render/merge akhir.

### 2.4. Standar Kode & Testing
- [ ] TypeScript strict mode aktif tanpa penggunaan `any` sembarangan.
- [ ] Error handling tersentralisasi dan tidak mengekspos internal stack trace ke response pengguna.
- [ ] Setiap helper merge/split memiliki unit test dengan file sample (PDF/Image dummy).
