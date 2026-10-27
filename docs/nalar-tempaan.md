# Penerbitan otomatis Nalar Tempaan

Penerima ini menerbitkan artikel Nalar Tempaan pada KaryaKader yang sudah ada,
sesuai permintaan pengguna untuk publikasi otomatis tanpa tahap draf.
Integrasi mempertahankan halaman admin dan fitur website yang ada.
Tidak ada layanan pembuat tulisan/API AI baru di sini.

## Yang sudah disiapkan dan yang belum

- `GET /api/nalar-tempaan`: pemeriksaan autentikasi dan koneksi Firestore.
- `POST /api/nalar-tempaan`: menerima JSON artikel, menerbitkannya, dan mencegah duplikasi.
- Status route ini `Langsung Terbit`, `published: true`, `publishAt: null`.
  Artikel baru masuk kategori `Nalar Tempaan`, tampil di website publik,
  dan tetap dapat disunting melalui `/dashboard`.
- Isi 300–500 kata, 1–3 rujukan, sampul wajib melalui URL HTTPS yang sudah
  diunggah. Tautan tidak diambil oleh server. Validitas fakta dan sumber,
  kesesuaian gambar dan lisensinya tetap perlu diperiksa secara editorial.
- Ini belum menghubungkan penjadwal ChatGPT, belum membuat artikel/gambar
  secara berkala, belum mengganti pengiriman email, dan belum mengaktifkan
  otomatisasi lama. Pengirim dan deployment harus diuji sebelum jadwal aktif.
- Skrip pengirim dapat dijalankan oleh layanan yang mempunyai akses jaringan
  dan token. Token dalam env laptop tidak otomatis tersedia bagi tugas ChatGPT.
  Untuk pengiriman tanpa interaksi, dibutuhkan integrasi/connector atau runner
  yang benar-benar tersedia bagi penjadwal. Menambahkan URL ke prompt saja
  tidak memasang koneksi tersebut.

## Pasang di proyek

Terapkan file baru dengan lokasi yang sama seperti pada patch:

1. `lib/nalar-tempaan.ts`
2. `app/api/nalar-tempaan/route.ts`
3. `scripts/send-nalar-tempaan.mjs`
4. `tests/nalar-tempaan.test.mjs`
5. `docs/nalar-tempaan.md`

Jalankan pengujian dengan Node 22.18+ atau Node 24:

```sh
node --test tests/nalar-tempaan.test.mjs
npm run lint
npx tsc --noEmit
```

## Konfigurasi server/hosting

Sistem menggunakan konfigurasi Firebase Admin yang sudah dipakai API
inventaris: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, dan
`FIREBASE_ADMIN_PRIVATE_KEY`. Jangan mengubah nilainya bila sudah berfungsi.

Tambahkan satu variabel server: `NALAR_TEMPAAN_INGEST_TOKEN` berupa token acak
minimal 32 karakter (disarankan 32 byte acak). Buat dan simpan melalui pengelola
rahasia/hosting. Jangan menaruhnya di variabel `NEXT_PUBLIC_*`, git, prompt,
atau percakapan. Ini token integrasi website, bukan OpenAI API key.

Di Vercel, variabel berada pada Project > Settings > Environment Variables.
Terapkan ke environment yang memang akan diuji, lalu deploy ulang agar kode dan
variabel berlaku. Gunakan domain utama, bukan subdomain penulis.

Sampul sebaiknya diunggah ke Cloudinary yang sudah dipakai website
(`https://res.cloudinary.com/...`). Konfigurasi `images.remotePatterns` saat ini
hanya mengizinkan host tersebut. API memvalidasi HTTPS, tetapi bila pengirim
memakai host gambar lain, tambahkan host spesifik itu ke konfigurasi Next.js
dan deploy ulang agar sampul dapat ditampilkan. Jangan membuka semua host.
Pastikan indeks Firestore untuk kategori dan `createdAt` yang digunakan halaman
`/nalar` tersedia, serta perlindungan akses hosting mengizinkan pengirim server.

## Pengirim lokal untuk uji koneksi

Dengan Node 22.18+ atau 24, simpan dua variabel di `.env.local` yang diabaikan git:

- `NALAR_TEMPAAN_ENDPOINT`: `https://karyakader.id/api/nalar-tempaan`
- `NALAR_TEMPAAN_INGEST_TOKEN`: token sama persis dengan token pada server.

Periksa bahwa endpoint bisa mengakses database tanpa membuat artikel:

```sh
node --env-file=.env.local scripts/send-nalar-tempaan.mjs --check
```

Uji tulis satu artikel yang sudah selesai dan disimpan sebagai JSON lokal:

```sh
node --env-file=.env.local scripts/send-nalar-tempaan.mjs artikel-nalar.json
```

Format JSON:

```json
{
  "editionId": "2026-10-30-1000-wib",
  "title": "Judul artikel",
  "content": "Isi artikel dalam teks biasa sepanjang 300–500 kata. Pisahkan paragraf dengan dua karakter baris baru.",
  "sources": [
    { "title": "Judul sumber yang sudah diperiksa", "url": "https://example.org/artikel" }
  ],
  "imageUrl": "https://example.org/sampul-yang-sudah-diunggah.jpg",
  "tags": ["Mahasiswa", "Nalar Tempaan"]
}
```

Contoh di atas hanya menunjukkan struktur, bukan isi siap kirim. Ganti
`content` dengan tulisan 300–500 kata dan `sources` dengan sumber terverifikasi.
HTML kiriman diperlakukan sebagai teks dan di-escape untuk mencegah injeksi.
Gunakan `editionId` yang sama untuk semua percobaan ulang satu edisi.

Keberhasilan `--check` hanya mengonfirmasi koneksi baca, bukan hasil penyimpanan.
Keberhasilan POST menghasilkan HTTP 201. Pengujian POST ke produksi akan
menerbitkan artikel, jadi gunakan artikel sungguhan yang memang layak terbit.
Buka `/dashboard`, muat ulang daftar berita, periksa kategori Nalar Tempaan
dan status Terbit, lalu buka `articlePath` dari hasil API untuk memeriksa halaman
publik. Mengirim ulang JSON yang sama menghasilkan HTTP
200 dengan `duplicate: true` dan tidak menimpa suntingan atau status redaksi.

## Arti hasil API

| HTTP | Arti |
| --- | --- |
| 200 | Pemeriksaan koneksi berhasil atau edisi identik sudah pernah diterima |
| 201 | Artikel baru berhasil diterbitkan |
| 400 | JSON/field/jumlah kata/rujukan tidak valid |
| 401 | Token salah atau tidak dikirim |
| 409 | ID edisi bentrok, artikel sudah dihapus, atau ID artikel sudah ada |
| 413 | Body melebihi 64 KiB |
| 415 | Content-Type bukan application/json |
| 503 | Token server belum diatur atau Firebase belum tersedia |

Database menyimpan tanda terima di `nalar_tempaan_deliveries`; hanya backend
Firebase Admin yang memerlukannya. Jangan membuka hak tulis publik untuk
koleksi ini atau `articles`. Jika artikel dihapus oleh redaksi, pengulangan kiriman
tidak akan menghidupkannya kembali. Tidak ada operasi penimpaan maupun hapus.

## Sebelum penjadwalan diaktifkan

Pastikan pengirim tanpa interaksi yang dipilih dapat menyimpan token secara
aman, mengunggah sampul sungguhan, mengirim JSON, dan membaca hasil HTTP.
Uji sekali sampai artikel terbit dan terlihat di halaman publik. Setelah itu hubungkan pembuatan
konten dari tugas ChatGPT ke konektor pengiriman yang dipilih. Penjadwalan
diatur pada tahap konektor sesuai kebutuhan pengguna. Jangan mengaktifkan tugas lama hanya dengan instruksi URL bila
tugas tersebut belum memiliki alat untuk mengirim ke endpoint.
