# Catatan pemeriksaan aplikasi — 25 September 2026

Pemeriksaan mencakup kode aplikasi, lint, TypeScript, build produksi, audit dependensi, pengujian regresi editor, serta respons HTTP lokal. Perubahan belum di-deploy dan tidak mengubah data artikel yang sudah ada.

## Perbaikan

- Foto di dalam editor diunggah ke Cloudinary, dengan dukungan PNG/JPEG/WebP/GIF, status unggahan, penanganan kegagalan, dan pencegahan penyimpanan saat unggahan berlangsung. Editor yang sudah ditutup tidak menerima hasil unggahan terlambat.
- Fungsi unggahan bersama memeriksa konfigurasi, status HTTP, dan URL hasil. Halaman berita, agenda, redaksi, dan pengaturan menggunakan fungsi tersebut.
- Edit artikel mempertahankan slug dan identitas pembuat sebelumnya. Artikel baru memakai ID dokumen pada slug agar judul yang sama tidak bertabrakan. File pilihan sebelumnya dibersihkan saat membuka artikel lain. Tombol dan pesan penyimpanan draft disesuaikan.
- Draft disaring dari tampilan beranda, kanal, pencarian, artikel terkait, detail, portofolio, metadata, dan sitemap. Pagination melewati kelompok yang hanya berisi draft. Artikel lama tanpa penanda publikasi tetap ditampilkan untuk menjaga kompatibilitas.
- Kegagalan pencatatan pembaca tidak lagi menghalangi isi artikel. Kegagalan memperbarui jumlah komentar setelah komentar tersimpan tidak lagi ditampilkan sebagai kegagalan mengirim komentar.
- HTML artikel dibersihkan sebelum ditampilkan memakai [DOMPurify](https://github.com/cure53/DOMPurify). Data JSON-LD meng-escape karakter `<`. Pesan yang menyarankan membuka seluruh akses Firestore dihapus.
- Pemeriksaan admin dashboard diselaraskan dengan API (`role: admin`). Token tidak valid mendapat HTTP 401. Cookie statistik divalidasi dan ID untuk URL panjang tidak lagi dipotong hingga berpotensi bertabrakan.
- Timestamp portofolio dikonversi menjadi data biasa sebelum dikirim ke komponen client. ThemeProvider tidak lagi mengganti pohon komponen setelah mount. Pencatatan kunjungan tidak dibatalkan oleh cleanup Strict Mode.
- Lokasi root Turbopack diperbaiki. Routing subdomain penulis mengecualikan aset dan memakai konvensi `proxy.ts`. Sitemap dibuat dinamis. Gambar cadangan dan metadata memakai `/icon.png` yang tersedia.
- Next.js dan konfigurasi ESLint diperbarui ke 16.3.6; dependensi transitif diperbarui menggunakan `npm audit fix` tanpa `--force`.

## Batas verifikasi dan pekerjaan yang masih perlu dilakukan

1. **Firestore Rules produksi belum diperiksa.** Aturannya tidak ada dalam repositori. Penyaringan draft di aplikasi bukan pembatasan akses database; query client masih dapat mengambil dokumen draft sebelum menyaringnya. Perlindungan baca/tulis harus diverifikasi di Firebase beserta penyesuaian query, indeks, dan migrasi penanda publikasi untuk artikel lama. Pemeriksaan admin di antarmuka juga tidak menggantikan Rules.
2. **Dua temuan dependensi berisiko rendah masih ada:** Quill 2.0.3 dan react-quill-new 3.8.3. Keduanya merupakan versi terbaru yang dikembalikan registry saat pemeriksaan. Audit menyarankan downgrade react-quill-new; downgrade otomatis tidak diterapkan karena dapat mengubah perilaku editor. Penyaringan HTML memperkecil risiko tampilan artikel, tetapi tidak dianggap menghapus [advisory Quill](https://github.com/advisories/GHSA-v3m3-f69x-jf25).
3. Browser pengujian tidak tersedia. Login admin, unggahan nyata ke Cloudinary, penyimpanan ke Firestore, dan interaksi visual belum diuji end-to-end. Uji unggahan memakai mock, tanpa menulis data produksi.
4. Lint masih memberi peringatan optimasi untuk penggunaan `<img>` pada beberapa tampilan; ini tidak menggagalkan build.

## Menjalankan pemeriksaan ulang

Hasil akhir: build produksi berhasil pada Next.js 16.3.6; TypeScript lolos; lint 0 error dan 8 peringatan optimasi gambar; 6/6 pengujian regresi lolos; `git diff --check` bersih. Tujuh pemeriksaan HTTP lokal lolos (beranda, login, dashboard, dua penolakan API 401, aset ikon di subdomain penulis, dan beranda subdomain penulis). Respons HTTP dashboard belum membuktikan interaksi atau otorisasi client; pengujian login tetap diperlukan.

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit --omit=dev
```

Pengujian menggunakan Node.js 24 pada sesi ini; impor TypeScript langsung pada pengujian membutuhkan Node yang mendukung type stripping.
