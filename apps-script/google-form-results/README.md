# Sinkronisasi Nilai Google Forms ke SIMPATIK

Folder ini berisi Apps Script untuk mengirim nilai kuis Google Forms ke backend SIMPATIK dan membuat tautan praisi NISN otomatis.

## Persyaratan formulir
1. Aktifkan **Jadikan ini sebagai kuis**.
2. Beri kunci jawaban dan poin pada soal objektif.
3. Tambahkan pertanyaan **Jawaban singkat** dengan judul persis **NISN**.
4. Aktifkan **Wajib diisi** pada pertanyaan NISN.
5. Gunakan satu Google Form untuk satu ujian yang terdaftar di menu Ujian Form.

## Membuat tautan praisi NISN otomatis
1. Buka Google Form menggunakan akun pemilik.
2. Buka **Ekstensi → Apps Script** atau project Apps Script yang terikat pada formulir.
3. Salin isi file `Code.gs` dari folder ini.
4. Pada **Project Settings → Script Properties**, isi `GOOGLE_FORM_ID` dengan ID formulir.
5. Di editor Apps Script, pilih fungsi `generateSimpNisnPrefillUrl`, lalu klik **Jalankan**.
6. Buka **Execution log / Log eksekusi**, lalu salin tautan praisi yang dicetak.
7. Tempel tautan tersebut ke kolom **Link Google Form** saat membuat atau mengubah ujian di SIMPATIK. Jangan menghapus parameter `entry....=SIMPATIK_NISN_PREFILL` dari tautan tersebut.
8. Saat siswa membuka ujian dari akun SIMPATIK for Students, aplikasi mengganti penanda tersebut dengan NISN dari profil siswa yang sedang login. Siswa tidak perlu mengetik NISN.

Jika fungsi generator gagal, periksa bahwa pertanyaan bernama persis `NISN` dan tipenya **Jawaban singkat**.

## Konfigurasi webhook dan trigger
1. Di Script Properties, tambahkan:
   - `SIMPATIK_WEBHOOK_URL` = `https://simpatik-backend.onrender.com/api/google-form-result`
   - `SIMPATIK_WEBHOOK_SECRET` = rahasia acak panjang yang sama dengan environment variable backend `GOOGLE_FORM_WEBHOOK_SECRET`.
2. Tambahkan environment variable `GOOGLE_FORM_WEBHOOK_SECRET` di layanan backend Render.
3. Jalankan `testSimpFormConfiguration` dan berikan izin yang diminta.
4. Jalankan `installGoogleFormSubmitTrigger` satu kali dan izinkan akses.
5. Pastikan trigger terpasang pada formulir yang benar.

## Cara kerja
- SIMPATIK for Students mengambil NISN dari profil sesi siswa yang sudah aktif.
- NISN diisikan otomatis ke tautan Google Form melalui parameter praisi Google Forms.
- Trigger berjalan ketika siswa mengirim formulir.
- Apps Script membaca NISN, response ID, skor otomatis, total poin, dan waktu pengiriman.
- Backend memvalidasi secret webhook, ID form, status dan jadwal ujian, keberadaan NISN, status aktif siswa, serta kecocokan kelas.
- Hasil disimpan satu kali per siswa per ujian di koleksi `googleFormResults`. Pengiriman ulang tidak membuat nilai ganda.

## Batasan yang harus diketahui
- Google Forms tidak menyediakan kolom praisi yang terkunci. Siswa masih dapat mengubah jawaban NISN sebelum mengirim.
- Backend memeriksa bahwa NISN terdaftar, aktif, dan berasal dari kelas yang ditugaskan. Karena Google Forms tidak mengirim identitas sesi SIMPATIK, pemeriksaan webhook saat ini belum dapat membuktikan bahwa pengisi adalah pemilik sesi SIMPATIK yang membuka form. Karena itu, praisi menghilangkan salah ketik biasa, tetapi bukan perlindungan penuh terhadap siswa yang sengaja mengganti NISN.
- Untuk pengikatan identitas yang benar-benar kuat ke sesi, diperlukan mekanisme kode peserta/token unik yang diverifikasi backend dan harus ditambahkan sebagai pertanyaan kedua pada Google Form. Jangan menganggap NISN praisi sebagai autentikasi.
- Nilai yang dikirim adalah nilai soal yang sudah dinilai otomatis Google Forms. Esai yang belum dinilai tidak termasuk.
- Google Form memerlukan koneksi internet. Jawaban tiap butir tidak disalin ke Firebase; yang disimpan adalah rekap nilai.
