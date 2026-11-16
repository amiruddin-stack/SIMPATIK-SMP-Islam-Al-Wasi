# Sinkronisasi Nilai Google Forms ke SIMPATIK

Folder ini berisi Apps Script untuk mengirim nilai kuis Google Forms ke endpoint backend SIMPATIK secara otomatis.

## Persyaratan formulir
1. Formulir diaktifkan sebagai **Kuis**.
2. Soal objektif diberi kunci jawaban dan poin.
3. Tambahkan pertanyaan wajib dengan judul persis **NISN**. Jenis jawaban teks singkat.
4. NISN harus diisi sesuai data siswa di SIMPATIK.
5. Gunakan satu Google Form untuk satu ujian yang terdaftar di menu Ujian Form.

> Catatan keamanan: Google Forms tidak menyediakan kolom tersembunyi yang benar-benar aman. Isian NISN pada form harus dianggap sebagai identitas yang diklaim siswa. Backend akan memeriksa NISN, status siswa, dan kecocokan kelas, tetapi verifikasi bahwa pengisi benar-benar pemilik NISN memerlukan mekanisme kode peserta unik atau akun Google terverifikasi.

## Konfigurasi Apps Script
1. Buka Google Form contoh dengan akun pemilik.
2. Buka menu titik tiga → **Editor skrip** (atau buat project Apps Script yang terikat ke formulir).
3. Salin isi `Code.gs` dari folder ini.
4. Buka **Project Settings → Script Properties** dan tambahkan:
   - `GOOGLE_FORM_ID` = ID Form dari URL edit.
   - `SIMPATIK_WEBHOOK_URL` = `https://simpatik-backend.onrender.com/api/google-form-result`
   - `SIMPATIK_WEBHOOK_SECRET` = rahasia acak panjang yang sama dengan environment variable backend `GOOGLE_FORM_WEBHOOK_SECRET`.
5. Jalankan `testSimpFormConfiguration` dan berikan izin yang diminta.
6. Jalankan `installGoogleFormSubmitTrigger` satu kali dan izinkan akses.
7. Pastikan trigger terpasang pada formulir yang benar.

## Konfigurasi SIMPATIK
1. Tambahkan environment variable `GOOGLE_FORM_WEBHOOK_SECRET` di layanan backend Render.
2. Deploy ulang backend setelah endpoint `/api/google-form-result` tersedia.
3. Buat ujian di menu **Ujian Form** dengan URL Google Form yang sama. Simpan ujian dengan status Aktif.
4. Hasil diterima di koleksi Firestore `googleFormResults`.

## Cara kerja
- Trigger berjalan ketika siswa mengirim Google Form.
- Apps Script membaca NISN, response ID, skor otomatis, total poin, dan waktu pengiriman.
- Backend memvalidasi secret webhook, ID form yang sudah didaftarkan, status ujian, NISN siswa, status aktif siswa, dan kelas.
- Hasil disimpan dengan ID deterministik dari Form ID + Response ID. Pengiriman ulang tidak membuat nilai ganda.

## Batasan saat ini
- Nilai yang dikirim adalah nilai soal yang sudah dinilai otomatis Google Forms. Esai yang belum dinilai tidak termasuk.
- Google Form memerlukan internet untuk dikirim.
- NISN pada pertanyaan Form belum merupakan autentikasi kuat. Untuk mencegah siswa mengatasnamakan siswa lain, tahap berikutnya perlu kode peserta unik per siswa/per ujian atau verifikasi akun sekolah.
- Belum ada pengiriman jawaban per butir ke Firebase; yang disimpan pada tahap ini adalah rekap nilai.
