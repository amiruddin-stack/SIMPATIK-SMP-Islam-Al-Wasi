import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, KeyRound, LockKeyhole, LogOut, Settings, ShieldCheck, UserCircle2, UserPlus } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { normalizeStudentNisn, studentNisnHash } from '../lib/studentLookup';
import { RegistrationPage } from './MasterDataPage';
import { ExamPage } from './ExamPage';

type StudentView = 'home' | 'register' | 'login';
type StudentSection = 'home' | 'profile' | 'ils' | 'exams' | 'settings';
type StudentProfile = { id: string; name: string; className: string; nis: string; nisn: string; gender: string; status: string };

const studentMenu = [
  { id: 'profile' as const, label: 'Profil', Icon: UserCircle2 },
  { id: 'ils' as const, label: 'Islamic Life Skill', Icon: BookOpen },
  { id: 'exams' as const, label: 'Ujian', Icon: GraduationCap },
  { id: 'settings' as const, label: 'Pengaturan', Icon: Settings },
];

export const StudentPortalPage: React.FC = () => {
  const [view, setView] = useState<StudentView>('home');
  const [section, setSection] = useState<StudentSection>('home');
  const [nisn, setNisn] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [studentSession, setStudentSession] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

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
        setStudent({ ...profile, nis: profile.nis || '', nisn: profile.nisn || '', gender: profile.gender || '', status: profile.status || 'Aktif' });
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

  useEffect(() => {
    setPin(localStorage.getItem('simpatik_student_pin') || '');
  }, []);

  const loginStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedNisn = normalizeStudentNisn(nisn);
    if (!normalizedNisn || normalizedNisn.length > 30) {
      setMessage('Masukkan NISN yang benar (maksimal 30 karakter).');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const lookupId = await studentNisnHash(normalizedNisn);
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

      let extraProfile: Record<string, unknown> = {};
      try {
        const studentSnapshot = await getDoc(doc(db, 'students', String(lookup.studentId)));
        if (studentSnapshot.exists()) extraProfile = studentSnapshot.data();
      } catch (profileError) {
        console.warn('Data profil tambahan tidak dapat dimuat:', profileError);
      }

      const profile: StudentProfile = {
        id: String(directory.id || lookup.studentId),
        name: String(directory.name),
        className: String(directory.className),
        nis: String(extraProfile.nis || ''),
        nisn: normalizedNisn,
        gender: String(extraProfile.gender || ''),
        status: String(extraProfile.status || directory.status || 'Aktif')
      };
      localStorage.setItem('simpatik_student_identity', JSON.stringify(profile));
      setStudent(profile);
      setStudentSession(true);
      setSection('home');
    } catch (error) {
      console.error('Login siswa gagal:', error);
      setMessage(error instanceof Error ? error.message : 'Tidak dapat masuk. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const logoutStudent = async () => {
    localStorage.removeItem('simpatik_student_identity');
    setStudent(null);
    setStudentSession(false);
    setSection('home');
    await signOut(auth);
  };

  const savePin = () => {
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinMessage('PIN harus terdiri dari 4–6 angka.');
      return;
    }
    localStorage.setItem('simpatik_student_pin', newPin);
    setPin(newPin);
    setNewPin('');
    setPinMessage('PIN perangkat berhasil diperbarui.');
  };

  if (view === 'register') return (
    <div className="min-h-screen bg-[#F7FBF8] px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => setView('home')} className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#087F49] hover:bg-[#E3F7EC]"><ArrowLeft size={17}/> Kembali</button>
        <RegistrationPage type="siswa" studentPortal />
      </div>
    </div>
  );

  if (studentSession && student) {
    const goHome = () => setSection('home');
    return (
      <main className="min-h-screen bg-[#F7FBF8] px-3 py-5 pb-8 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {section === 'home' && (
            <header className="page-banner relative overflow-hidden rounded-[28px] px-5 py-5 text-white shadow-lg sm:px-6">
              <div className="relative z-10">
                <h1 className="mb-4 text-left text-base font-extrabold tracking-wide text-white">SMP Islam Al-Wasi'</h1>
                <nav aria-label="Menu siswa" className="grid gap-2">
                  {studentMenu.map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => setSection(id)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/25 bg-white/15 px-3 py-2.5 text-left text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:scale-[0.99]">
                      <Icon size={18} strokeWidth={2} className="shrink-0"/>
                      <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
                      <ArrowRight size={17} className="shrink-0 opacity-90"/>
                    </button>
                  ))}
                </nav>
              </div>
            </header>
          )}

          {section !== 'home' && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#D9EEE2] bg-white px-3 py-3 shadow-sm">
              <button type="button" onClick={goHome} aria-label="Kembali ke menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-[#087F49]"><ArrowLeft size={18}/></button>
              <h2 className="font-extrabold text-slate-800">{section === 'profile' ? 'Profil Saya' : section === 'ils' ? 'Islamic Life Skill' : section === 'exams' ? 'Ujian Saya' : 'Pengaturan'}</h2>
            </div>
          )}

          {section === 'profile' && (
            <section className="rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><UserCircle2 size={23}/></span>
                <div><h3 className="font-extrabold text-slate-800">{student.name}</h3><p className="text-xs text-slate-500">Data profil siswa</p></div>
                <span className="ml-auto rounded-full bg-[#E3F7EC] px-3 py-1 text-xs font-bold text-[#0B8F4D]">{student.status || 'Aktif'}</span>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-[#F7FCF9] p-3"><dt className="text-xs text-slate-500">Nama lengkap</dt><dd className="mt-1 font-semibold text-slate-800">{student.name}</dd></div>
                <div className="rounded-xl bg-[#F7FCF9] p-3"><dt className="text-xs text-slate-500">Kelas</dt><dd className="mt-1 font-semibold text-slate-800">{student.className}</dd></div>
                <div className="rounded-xl bg-[#F7FCF9] p-3"><dt className="text-xs text-slate-500">NIS</dt><dd className="mt-1 font-semibold text-slate-800">{student.nis || '—'}</dd></div>
                <div className="rounded-xl bg-[#F7FCF9] p-3"><dt className="text-xs text-slate-500">NISN</dt><dd className="mt-1 font-semibold text-slate-800">{student.nisn || '—'}</dd></div>
                <div className="rounded-xl bg-[#F7FCF9] p-3"><dt className="text-xs text-slate-500">Jenis kelamin</dt><dd className="mt-1 font-semibold text-slate-800">{student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : student.gender || '—'}</dd></div>
                <div className="rounded-xl bg-[#F7FCF9] p-3"><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1 font-semibold text-slate-800">{student.status || 'Aktif'}</dd></div>
              </dl>
            </section>
          )}

          {section === 'ils' && (
            <section className="flex min-h-[45vh] flex-col items-center justify-center rounded-2xl border border-[#D9EEE2] bg-white p-6 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3F7EC] text-[#087F49]"><BookOpen size={30}/></div>
              <h3 className="text-xl font-extrabold text-slate-800">Islamic Life Skill</h3>
              <p className="mt-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">Segera hadir</p>
            </section>
          )}

          {section === 'exams' && (
            <section className="rounded-2xl border border-[#D9EEE2] bg-white p-3 shadow-sm sm:p-5">
              <ExamPage studentMode />
            </section>
          )}

          {section === 'settings' && (
            <section className="space-y-4 rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><LockKeyhole size={21}/></span><div><h3 className="font-extrabold text-slate-800">Keamanan akun</h3><p className="text-xs text-slate-500">Atur PIN lokal pada perangkat ini.</p></div></div>
              <div className="rounded-xl border border-[#D9EEE2] p-3">
                <label className="mb-2 block text-sm font-semibold text-slate-700">{pin ? 'Ganti PIN' : 'Buat PIN'}</label>
                <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Masukkan PIN baru (4–6 angka)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#16A34A]"/>
                <button type="button" onClick={savePin} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0B8F4D] px-4 py-2.5 text-sm font-bold text-white"><ShieldCheck size={16}/> Simpan PIN</button>
                {pinMessage && <p role="status" className="mt-3 text-xs font-medium text-[#087F49]">{pinMessage}</p>}
                <p className="mt-2 text-[11px] leading-5 text-slate-500">PIN ini disimpan hanya di perangkat dan belum digunakan sebagai metode login akun.</p>
              </div>
              <button type="button" onClick={() => void logoutStudent()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"><LogOut size={17}/> Keluar dari akun siswa</button>
            </section>
          )}
          {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{message}</p>}
        </div>
      </main>
    );
  }

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
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">NISN<input value={nisn} onChange={e => setNisn(e.target.value.slice(0,30))} maxLength={30} required placeholder="Masukkan NISN" className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#E3F7EC]"/></label>
            {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{message}</p>}
            <button type="submit" disabled={busy} className="rounded-xl bg-[#0B8F4D] px-4 py-3 font-bold text-white transition hover:bg-[#087640] disabled:opacity-60">{busy ? 'Memeriksa NISN…' : 'Masuk'}</button>
          </form>
        </div>}
        <footer className="border-t border-[#E7F1EA] px-5 py-4 text-center text-[11px] text-slate-400">Qurani, Ramah Anak dan Berkarakter · SIMPATIK</footer>
      </section>
    </main>
  );
};
