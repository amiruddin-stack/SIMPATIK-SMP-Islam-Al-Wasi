# Sinkronisasi Nilai Google Forms ke SIMPATIK

Folder ini berisi Apps Script untuk mengirim nilai kuis Google Forms ke backend SIMPATIK, membuat tautan praisi identitas, dan memverifikasi kode peserta unik.

## Persyaratan formulir
1. Aktifkan **Jadikan ini sebagai kuis**.
2. Beri kunci jawaban dan poin pada soal objektif.
3. Tambahkan empat pertanyaan **Jawaban singkat** dengan judul persis **NAMA**, **NISN**, **KODE PESERTA**, dan **KELAS**. Aktifkan **Wajib diisi** pada semuanya.
4. Letakkan keempat pertanyaan identitas pada **Bagian 1**. Buat **Bagian 2** untuk seluruh soal ujian.
5. Gunakan satu Google Form untuk satu ujian yang terdaftar di menu Ujian Form.

## Membuat tautan praisi otomatis
1. Buka Google Form menggunakan akun pemilik.
2. Buka **Ekstensi → Apps Script** atau project Apps Script yang terikat pada formulir.
3. Salin isi file `Code.gs` dari folder ini.
4. Pada **Project Settings → Script Properties**, isi `GOOGLE_FORM_ID` dengan ID formulir.
5. Di editor Apps Script, pilih fungsi `generateSimpNisnPrefillUrl`, lalu klik **Jalankan**.
6. Buka **Execution log / Log eksekusi**, lalu salin tautan praisi yang dicetak.
7. Tempel tautan tersebut ke kolom **Link Google Form** saat membuat atau mengubah ujian di SIMPATIK. Jangan menghapus empat parameter `entry....` yang nilainya `SIMPATIK_NAME_PREFILL`, `SIMPATIK_NISN_PREFILL`, `SIMPATIK_CODE_PREFILL`, dan `SIMPATIK_CLASS_PREFILL`.
8. Saat siswa membuka ujian dari akun SIMPATIK for Students, aplikasi meminta kode peserta unik ke backend. Server mengembalikan nama, NISN, dan kelas dari data siswa yang telah diverifikasi; aplikasi mengisi keempat identitas (nama, NISN, kode peserta, kelas) otomatis melalui tautan praisi. Siswa tidak perlu mengetik identitas tersebut.

Jika generator gagal, periksa bahwa keempat pertanyaan ada pada Bagian 1, judulnya tepat, dan jenisnya **Jawaban singkat**.

## Konfigurasi webhook dan trigger
1. Di Script Properties, tambahkan:
   - `SIMPATIK_WEBHOOK_URL` = `https://simpatik-backend.onrender.com/api/google-form-result`
   - `SIMPATIK_WEBHOOK_SECRET` = rahasia acak panjang yang sama dengan environment variable backend `GOOGLE_FORM_WEBHOOK_SECRET`.
2. Pastikan environment variable `GOOGLE_FORM_WEBHOOK_SECRET` tersedia di layanan backend Render.
3. Jalankan `testSimpFormConfiguration` dan berikan izin yang diminta.
4. Jalankan `installGoogleFormSubmitTrigger` satu kali dan izinkan akses.
5. Pastikan trigger terpasang pada formulir yang benar.

## Cara kerja
- SIMPATIK for Students mengambil NISN dan ID siswa dari profil sesi yang sudah aktif.
- Backend memverifikasi token Firebase, kecocokan NISN dengan data siswa, status aktif, kelas, serta jadwal ujian.
- Backend membuat kode peserta acak yang terikat pada satu siswa dan satu ujian; yang disimpan di Firestore hanya hash kode.
- Google Form Bagian 1 menerima nama, NISN, kode peserta, dan kelas melalui parameter praisi; Bagian 2 berisi soal.
- Trigger membaca nama, NISN, kode peserta, kelas, response ID, skor otomatis, total poin, dan waktu pengiriman.
- Backend memeriksa kode peserta, Form ID, NISN, nama, kelas, status dan jadwal ujian; nama dan kelas yang dikirim harus sama dengan data akun yang diverifikasi. Kode peserta hanya dapat digunakan untuk satu pengiriman final.
- Hasil disimpan satu kali per siswa per ujian di koleksi `googleFormResults`. Pengiriman ulang respons yang sama tidak membuat nilai ganda.

## Batasan yang harus diketahui
- Google Forms tidak menyediakan kolom praisi yang terkunci. Siswa masih dapat mengubah jawaban praisi sebelum mengirim, tetapi backend mencocokkan NAMA, NISN, KODE PESERTA, dan KELAS dengan data akun yang diverifikasi; perubahan identitas akan ditolak.
- Kode peserta acak sulit ditebak dan diverifikasi oleh backend, tetapi tautan/formulir yang dibagikan ke orang lain dapat membocorkan kode tersebut. Jangan membagikan tautan ujian pribadi.
- Pada jalur login siswa anonim/direktori yang sudah ada, backend memverifikasi NISN melalui direktori SIMPATIK; jalur ini tidak memiliki klaim studentId bertanda tangan seperti sesi custom-token. Alur login tidak diubah.
- Nilai yang dikirim adalah nilai soal yang sudah dinilai otomatis Google Forms. Esai yang belum dinilai tidak termasuk.
- Google Form memerlukan koneksi internet. Jawaban tiap butir tidak disalin ke Firebase; yang disimpan adalah rekap nilai.
