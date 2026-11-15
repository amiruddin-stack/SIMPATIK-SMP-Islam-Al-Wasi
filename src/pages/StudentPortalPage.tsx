import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap, KeyRound, UserPlus } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { RegistrationPage } from './MasterDataPage';
import { ExamPage } from './ExamPage';

type StudentView = 'home' | 'register' | 'login';
type StudentProfile = { id: string; name: string; className: string; nis: string; nisn: string; gender: string };


export const StudentPortalPage: React.FC = () => {
  const [view, setView] = useState<StudentView>('home');
  const [nisn, setNisn] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [studentSession, setStudentSession] = useState(false);

  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (!alive) return;
      if (!user) { setStudentSession(false); setStudent(null); return; }
      try {
        const saved = localStorage.getItem('simpatik_student_identity');
        if (!saved) { setStudentSession(false); setStudent(null); return; }
        const profile = JSON.parse(saved) as StudentProfile;
        if (!profile.id || !profile.name || !profile.className) throw new Error('Identitas siswa tidak valid.');
        setStudent(profile);
        setStudentSession(true);
      } catch (error) {
        console.error('Gagal memulihkan sesi siswa:', error);
        localStorage.removeItem('simpatik_student_identity');
        setStudentSession(false);
        setStudent(null);
      }
    });
    return () => { alive = false; unsubscribe(); };
  }, []);

  const loginStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedNisn = nisn.replace(/\D/g, '');
    if (!/^\d{10}$/.test(normalizedNisn)) {
      setMessage('NISN harus terdiri dari 10 angka.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizedNisn));
      const lookupId = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
      const lookupSnapshot = await getDoc(doc(db, 'studentLoginLookup', lookupId));
      if (!lookupSnapshot.exists()) {
        throw new Error('NISN tidak ditemukan. Pastikan pendaftaran sudah disetujui admin.');
      }

      const lookup = lookupSnapshot.data();
      if (String(lookup.nisn || '') !== normalizedNisn || !lookup.studentId) {
        throw new Error('Data NISN tidak cocok. Silakan hubungi admin sekolah.');
      }

      if (auth.currentUser) await signOut(auth);
      await signInAnonymously(auth);

      const directorySnapshot = await getDoc(doc(db, 'studentExamDirectory', String(lookup.studentId)));
      if (!directorySnapshot.exists()) {
        await signOut(auth);
        throw new Error('Akun siswa belum aktif atau belum disinkronkan admin.');
      }

      const directory = directorySnapshot.data();
      if (directory.status !== 'Aktif' || !directory.name || !directory.className) {
        await signOut(auth);
        throw new Error('Akun siswa belum aktif. Silakan hubungi admin sekolah.');
      }

      const profile: StudentProfile = {
        id: String(directory.id || lookup.studentId),
        name: String(directory.name),
        className: String(directory.className),
        nis: '',
        nisn: normalizedNisn,
        gender: ''
      };
      localStorage.setItem('simpatik_student_identity', JSON.stringify(profile));
      setStudent(profile);
      setStudentSession(true);
    } catch (error) {
      console.error('Login siswa gagal:', error);
      setMessage(error instanceof Error ? error.message : 'Tidak dapat masuk. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  if (view === 'register') return (
    <div className="min-h-screen bg-[#F7FBF8] px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => setView('home')} className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#087F49] hover:bg-[#E3F7EC]"><ArrowLeft size={17}/> Kembali</button>
        <RegistrationPage type="siswa" studentPortal />
      </div>
    </div>
  );

  if (studentSession && student) return (
    <main className="min-h-screen bg-[#F7FBF8] px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B8F4D] to-[#087640] px-6 py-7 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><GraduationCap size={30}/></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-white/80">SIMPATIK for Student</p><h1 className="mt-1 text-xl font-black">Assalamu’alaikum</h1></div>
          </div>
          <p className="mt-4 text-lg font-extrabold">{student.name}</p>
          <p className="text-sm text-white/85">Kelas {student.className} · Akun Aktif</p>
        </header>
        <section className="rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-slate-800">Profil Saya</h2><span className="rounded-full bg-[#E3F7EC] px-3 py-1 text-xs font-bold text-[#0B8F4D]">Disetujui</span></div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-slate-500">NIS</dt><dd className="font-semibold text-slate-800">{student.nis || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">NISN</dt><dd className="font-semibold text-slate-800">{student.nisn || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">Jenis kelamin</dt><dd className="font-semibold text-slate-800">{student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">Kelas</dt><dd className="font-semibold text-slate-800">{student.className}</dd></div>
          </dl>
        </section>
        <section className="rounded-2xl border border-[#D9EEE2] bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-3"><h2 className="text-lg font-extrabold text-slate-800">Ujian Saya</h2><p className="text-xs text-slate-500">Ujian yang diaktifkan guru untuk kelas {student.className} akan muncul otomatis di sini.</p></div>
          <ExamPage studentMode />
        </section>
        {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{message}</p>}
        <button type="button" onClick={() => { localStorage.removeItem('simpatik_student_identity'); setStudent(null); setStudentSession(false); void signOut(auth); }} className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">Keluar dari akun siswa</button>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7FBF8] px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#D9EEE2] bg-white shadow-[0_18px_55px_rgba(8,127,73,0.09)]">
        <header className="bg-gradient-to-br from-[#0B8F4D] to-[#087640] px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><GraduationCap size={34}/></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">SMP Islam Al-Wasi’</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">SIMPATIK for Student</h1>
          <p className="mt-3 text-sm leading-6 text-white/90">Selamat datang siswa-siswi terbaik SMP Islam Al-Wasi’</p>
        </header>
        <div className="grid gap-3 p-5 sm:p-6">
          <button type="button" onClick={() => { setMessage(''); setView('register'); }} className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9EEE2] p-4 text-left transition hover:border-[#0B8F4D] hover:bg-[#F5FCF7]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><UserPlus size={23}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">Mendaftar</span><span className="mt-1 block text-xs leading-5 text-slate-500">Isi NISN, nama lengkap, dan pilih kelas. Tunggu persetujuan admin.</span></span>
            <ArrowRight className="text-[#087F49]" size={19}/>
          </button>
          <button type="button" onClick={() => { setMessage(''); setView('login'); }} className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9EEE2] p-4 text-left transition hover:border-[#0B8F4D] hover:bg-[#F5FCF7]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><KeyRound size={23}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">Masuk</span><span className="mt-1 block text-xs leading-5 text-slate-500">Untuk siswa yang sudah disetujui admin. Masuk menggunakan NISN.</span></span>
            <ArrowRight className="text-[#087F49]" size={19}/>
          </button>
        </div>
        {view === 'login' && <div className="border-t border-[#E7F1EA] px-5 py-5 sm:px-6">
          <div className="mb-3"><h2 className="font-bold text-slate-800">Masuk SIMPATIK for Student</h2><p className="mt-1 text-xs leading-5 text-slate-500">Masukkan NISN. Perangkat akan diingat setelah login berhasil.</p></div>
          <form onSubmit={loginStudent} className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">NISN<input value={nisn} onChange={e => setNisn(e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="Masukkan 10 digit NISN" className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#E3F7EC]"/></label>
            {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{message}</p>}
            <button type="submit" disabled={busy} className="rounded-xl bg-[#0B8F4D] px-4 py-3 font-bold text-white transition hover:bg-[#087640] disabled:opacity-60">{busy ? 'Memeriksa NISN…' : 'Masuk'}</button>
          </form>
        </div>}
        <footer className="border-t border-[#E7F1EA] px-5 py-4 text-center text-[11px] text-slate-400">Qurani, Ramah Anak dan Berkarakter · SIMPATIK</footer>
      </section>
    </main>
  );
};
