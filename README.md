# Arsip Digital Agung

Website arsip portofolio pribadi dengan tema navy, login username `agung`, kategori Surat Tugas, SK, Dokumentasi, Data Diri, Kerja Sama, Sertifikat, dan Lainnya. Data dan file disimpan di Supabase dengan Row Level Security (RLS) dan bucket privat.

## 1. Siapkan Supabase

1. Buka https://supabase.com/ lalu buat akun dan **New project**.
2. Simpan password database di tempat aman.
3. Setelah project aktif, buka **SQL Editor → New query**.
4. Salin seluruh isi `supabase/schema.sql`, lalu klik **Run**.
5. Buka **Project Settings → API**. Salin `Project URL` dan `anon/public key`.
6. Buka **Authentication → Users → Add user**. Buat user dengan email milik Anda dan password kuat. Aktifkan email confirmation sesuai kebutuhan. Jangan membagikan password kepada siapa pun.
7. Catat email yang dipakai. Aplikasi memetakan username `agung` ke email akun ini.

## 2. Jalankan di komputer (opsional untuk uji coba)

1. Instal Node.js versi 20 atau lebih baru.
2. Ekstrak ZIP ini, buka folder proyek di VS Code.
3. Duplikat `.env.example` menjadi `.env`, lalu isi:
   - `VITE_SUPABASE_URL` = Project URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = anon/public key Supabase
   - `VITE_LOGIN_EMAIL` = email akun Supabase yang dibuat pada langkah 6
4. Buka terminal di folder proyek dan jalankan:

   ```bash
   npm install
   npm run dev
   ```

5. Buka alamat lokal yang tampil di terminal. Login dengan username `agung` dan password yang Anda buat di Supabase.

## 3. Publikasikan melalui GitHub Pages

1. Buat repository GitHub baru, misalnya `arsip-digital-agung`. Untuk penggunaan GitHub Pages gratis, pilih **Public**. Ingat, frontend website akan dapat diakses publik; keamanan data wajib berasal dari Supabase RLS dan bucket privat.
2. Upload seluruh isi folder proyek ke repository, termasuk folder `.github` dan `supabase`.
3. Di GitHub buka **Settings → Secrets and variables → Actions → New repository secret**. Tambahkan tiga secrets berikut:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LOGIN_EMAIL`
4. Buka **Settings → Pages → Build and deployment → Source**, pilih **GitHub Actions**.
5. Buka tab **Actions**. Workflow `Deploy to GitHub Pages` akan berjalan setelah file masuk ke branch `main`.
6. Setelah workflow hijau, buka **Settings → Pages** untuk melihat alamat website.

## Penting tentang privasi

- Website statis GitHub Pages tidak dapat menyembunyikan kode frontend. `anon/public key` memang akan terlihat di browser; ini normal untuk Supabase. **Jangan pernah memasukkan service_role key atau password database ke file frontend atau GitHub.**
- Privasi dokumen dijaga oleh kebijakan RLS di tabel `documents` dan kebijakan bucket privat di `storage.objects`. Pastikan SQL pada langkah 1 berhasil dijalankan.
- Jangan membuat bucket `arsip-pribadi` menjadi public.
- Saat ini username `agung` dipetakan ke satu email Supabase melalui `VITE_LOGIN_EMAIL`. Login tetap menggunakan username `agung` pada halaman.
- Batas upload bucket diset 50 MB per file. Sesuaikan `file_size_limit` bila diperlukan.
- Situs GitHub Pages dapat dibuka oleh siapa pun yang mengetahui URL, tetapi tanpa akun/password mereka tidak dapat melihat arsip yang dilindungi kebijakan Supabase. Jangan menaruh data pribadi dalam source code atau file statis.

## Struktur proyek

- `src/App.jsx` — antarmuka dan logika aplikasi
- `src/styles.css` — desain navy responsif
- `supabase/schema.sql` — tabel, RLS, dan bucket privat
- `.github/workflows/deploy.yml` — deployment otomatis ke GitHub Pages
