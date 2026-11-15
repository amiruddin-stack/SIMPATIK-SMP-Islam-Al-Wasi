import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, CalendarDays, ClipboardCheck,
  GraduationCap, KeyRound, LogOut, Menu, ShieldCheck, UserRound,
  UserSquare2, X
} from 'lucide-react';
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { normalizeStudentNisn } from '../lib/studentLookup';
import { simpatikApi } from '../lib/backendApi';
import { RegistrationPage } from './MasterDataPage';
import { ExamPage } from './ExamPage';

type StudentView = 'home' | 'register' | 'login';
type StudentProfile = { id: string; name: string; className: string; nis: string; nisn: string; gender: string };
type StudentMenu = 'dashboard' | 'profil' | 'biodata' | 'tahsin' | 'bacaan-sholat' | 'ujian-semester' | 'ujian-sekolah' | 'keamanan';

const menuGroups = [
  { title: 'Utama', items: [{ id: 'dashboard', label: 'Dashboard', icon: GraduationCap }] },
  { title: 'Akun', items: [{ id: 'profil', label: 'Profil', icon: UserRound }, { id: 'biodata', label: 'Biodata Siswa', icon: UserSquare2 }] },
  { title: 'Islamic Life Skill', items: [{ id: 'tahsin', label: 'Tahsin', icon: BookOpen, soon: true }, { id: 'bacaan-sholat', label: 'Bacaan Sholat', icon: BookOpen, soon: true }] },
  { title: 'Asesmen', items: [{ id: 'ujian-semester', label: 'Ujian Semester', icon: CalendarDays }, { id: 'ujian-sekolah', label: 'Ujian Sekolah', icon: ClipboardCheck }] },
  { title: 'Pengaturan', items: [{ id: 'keamanan', label: 'Keamanan', icon: ShieldCheck }] },
] as const;

const menuTitles: Record<StudentMenu, string> = {
  dashboard: 'Dashboard',
  profil: 'Profil', biodata: 'Biodata Siswa', tahsin: 'Tahsin',
  'bacaan-sholat': 'Bacaan Sholat', 'ujian-semester': 'Ujian Semester',
  'ujian-sekolah': 'Ujian Sekolah', keamanan: 'Keamanan'
};

export const StudentPortalPage: React.FC = () => {
  const [view, setView] = useState<StudentView>('home');
  const [nisn, setNisn] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [studentSession, setStudentSession] = useState(false);
  const [activeMenu, setActiveMenu] = useState<StudentMenu>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!alive) return;
      if (!user || user.isAnonymous) { setStudentSession(false); setStudent(null); return; }
      try {
        const [saved, tokenResult] = await Promise.all([
          Promise.resolve(localStorage.getItem('simpatik_student_identity')),
          user.getIdTokenResult()
        ]);
        if (!alive) return;
        if (!saved || tokenResult.claims.role !== 'student' || typeof tokenResult.claims.studentId !== 'string') {
          setStudentSession(false);
          setStudent(null);
          return;
        }
        const profile = JSON.parse(saved) as StudentProfile;
        if (!profile.id || profile.id !== tokenResult.claims.studentId || !profile.name || !profile.className) {
          throw new Error('Identitas sesi siswa tidak cocok.');
        }
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
    const normalizedNisn = normalizeStudentNisn(nisn);
    if (!normalizedNisn || normalizedNisn.length > 30) {
      setMessage('Masukkan NISN yang benar (maksimal 30 karakter).');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(simpatikApi('/api/student-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn: normalizedNisn })
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token || !result.student?.id || !result.student?.name || !result.student?.className) {
        throw new Error(result.message || 'Login siswa belum dapat diproses.');
      }
      if (auth.currentUser) await signOut(auth);
      await setPersistence(auth, browserLocalPersistence);
      await signInWithCustomToken(auth, result.token);
      const profile: StudentProfile = {
        id: String(result.student.id),
        name: String(result.student.name),
        className: String(result.student.className),
        nis: String(result.student.nis || ''),
        nisn: normalizedNisn,
        gender: String(result.student.gender || '')
      };
      localStorage.setItem('simpatik_student_identity', JSON.stringify(profile));
      setStudent(profile);
      setStudentSession(true);
      setActiveMenu('dashboard');
    } catch (error) {
      console.error('Login siswa gagal:', error);
      setMessage(error instanceof Error ? error.message : 'Tidak dapat masuk. Periksa koneksi internet lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('simpatik_student_identity');
    setStudent(null);
    setStudentSession(false);
    void signOut(auth);
  };

  if (view === 'register') return (
    <div className="min-h-screen bg-[#F7FBF8] px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => setView('home')} aria-label="Kembali" className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#0B8F4D] to-[#087640] text-white shadow"><ArrowLeft size={20}/></button>
        <RegistrationPage type="siswa" studentPortal />
      </div>
    </div>
  );

  if (studentSession && student) {
    const selectMenu = (id: StudentMenu) => { setActiveMenu(id); setSidebarOpen(false); };
    const activeLabel = menuTitles[activeMenu];
    const renderContent = () => {
      if (activeMenu === 'dashboard') return (
        <div className="grid gap-4">
          <section className="rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4"><h2 className="text-lg font-black text-slate-800">Perkembangan Siswa</h2><p className="mt-1 text-xs text-slate-500">Pantau perkembangan pembelajaran dan kedisiplinanmu.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[{ label: 'Bacaan Sholat', value: 80, icon: BookOpen }, { label: 'Doa Harian', value: 70, icon: BookOpen }, { label: 'Kehadiran', value: 90, icon: CalendarDays }].map(item => { const Icon = item.icon; return (
                <div key={item.label} className="rounded-xl border border-[#E5F1E9] bg-[#FAFDFA] p-4">
                  <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E3F7EC] text-[#087F49]"><Icon size={18}/></span>{item.label}</div><span className="text-lg font-black tabular-nums text-[#087F49]">{item.value}%</span></div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E7F1EA]"><div className="h-full rounded-full bg-gradient-to-r from-[#0B8F4D] to-[#34B56F]" style={{ width: item.value + '%' }}/></div>
                </div>
              ); })}
            </div>
          </section>
          <section className="rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2"><GraduationCap className="text-[#087F49]" size={21}/><h2 className="font-black text-slate-800">Perkembangan Akademik</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ringkasan nilai dan hasil belajar akan ditampilkan di bagian ini setelah data akademik siswa tersedia.</p>
          </section>
        </div>
      );
      if (activeMenu === 'profil') return (
        <div className="grid gap-4">
          <section className="rounded-2xl border border-[#D9EEE2] bg-white p-5 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E3F7EC] text-[#087F49]"><UserRound size={38}/></div>
              <h2 className="mt-3 text-xl font-black text-slate-800">{student.name}</h2>
              <p className="mt-1 text-sm font-semibold text-[#087F49]">Kelas {student.className}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E3F7EC] px-3 py-1.5 text-xs font-bold text-[#087F49]"><span className="h-1.5 w-1.5 rounded-full bg-[#0B8F4D]"/> Akun Aktif</span>
            </div>
          </section>
          <section className="rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm">
            <h3 className="font-extrabold text-slate-800">Ringkasan Akun</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F5FBF7] p-3"><p className="text-xs text-slate-500">Status</p><p className="mt-1 font-bold text-[#087F49]">Aktif</p></div>
              <div className="rounded-xl bg-[#F5FBF7] p-3"><p className="text-xs text-slate-500">Kelas</p><p className="mt-1 font-bold text-slate-800">{student.className}</p></div>
            </div>
          </section>
        </div>
      );
      if (activeMenu === 'biodata') return (
        <section className="rounded-2xl border border-[#D9EEE2] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 font-extrabold text-slate-800">Identitas Siswa</h2>
          <dl className="divide-y divide-[#E7F1EA]">
            {[['Nama Lengkap', student.name], ['Kelas', student.className], ['NIS', student.nis || '—'], ['NISN', student.nisn || '—'], ['Jenis Kelamin', student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '—'], ['Status Akun', 'Aktif']].map(([label, value]) => <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="text-sm font-bold text-slate-800">{value}</dd></div>)}
          </dl>
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Jika ada biodata yang perlu diperbaiki, silakan hubungi admin sekolah.</p>
        </section>
      );
      if (activeMenu === 'tahsin' || activeMenu === 'bacaan-sholat') return (
        <section className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[#D9EEE2] bg-white p-6 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3F7EC] text-[#087F49]"><BookOpen size={30}/></div>
          <h2 className="mt-4 text-lg font-black text-slate-800">{activeLabel}</h2>
          <span className="mt-3 rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">Coming Soon</span>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Materi {activeLabel.toLowerCase()} sedang disiapkan.</p>
        </section>
      );
      if (activeMenu === 'ujian-semester' || activeMenu === 'ujian-sekolah') return (
        <section className="rounded-2xl border border-[#D9EEE2] bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4"><h2 className="font-extrabold text-slate-800">{activeLabel}</h2><p className="mt-1 text-xs text-slate-500">Pilih ujian yang tersedia untuk kelas {student.className}.</p></div>
          <ExamPage studentMode />
        </section>
      );
      return (
        <section className="rounded-2xl border border-[#D9EEE2] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><ShieldCheck size={25}/></div><div><h2 className="font-extrabold text-slate-800">Keamanan Akun</h2><p className="text-xs text-slate-500">Kelola sesi masuk pada perangkat ini.</p></div></div>
          <div className="mt-5 rounded-xl bg-[#F5FBF7] p-4"><p className="text-sm font-bold text-slate-800">Masuk menggunakan NISN</p><p className="mt-1 text-xs leading-5 text-slate-500">Sesi akun tersimpan pada perangkat ini agar siswa tidak perlu masuk berulang kali. Jangan gunakan perangkat bersama tanpa keluar dari akun.</p></div>
          <button type="button" onClick={logout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><LogOut size={17}/> Keluar dari akun siswa</button>
        </section>
      );
    };

    return (
      <main className="min-h-screen bg-[#F7FBF8]">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6">
          <div className="mb-3 flex items-center gap-3 px-1">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Buka menu" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9EEE2] bg-white text-[#087F49] shadow-sm"><Menu size={21}/></button>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800 sm:text-base">{student.name}</p><p className="text-[11px] font-medium text-slate-500">Kelas {student.className}</p></div>
            <button type="button" aria-label="Notifikasi" title="Notifikasi" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D9EEE2] bg-white text-[#087F49] shadow-sm"><Bell size={19}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"/></button>
          </div>
          {activeMenu === 'dashboard' && (
          <header className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0B8F4D] via-[#087F49] to-[#06663A] px-5 py-6 text-white shadow-lg sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border-[24px] border-white/10"/>
            <div className="pointer-events-none absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-white/5"/>
            <div className="relative z-10">
              <h1 className="text-lg font-black leading-tight tracking-wide sm:text-2xl">SIMPATIK FOR STUDENTS</h1>
              <p className="mt-1 text-sm font-bold text-white/90 sm:text-base">SMP Islam Al-Wasi'</p>
              <p className="mt-4 text-xs font-semibold text-white/80">Qurani, Ramah Anak dan Berkarakter</p>
            </div>
          </header>
          )}

          {activeMenu !== 'dashboard' && (
            <header className="mt-4 flex min-h-[82px] items-center gap-3 rounded-2xl bg-gradient-to-r from-[#0B8F4D] to-[#087640] px-4 py-4 text-white shadow-md sm:px-5">
              <button type="button" onClick={() => setActiveMenu('dashboard')} aria-label="Kembali ke dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white transition hover:bg-white hover:text-[#087640]"><ArrowLeft size={20}/></button>
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-white/80">SIMPATIK FOR STUDENTS</p><h1 className="truncate text-lg font-black sm:text-xl">{activeLabel}</h1></div>
            </header>
          )}
          <div className="mt-4 grid items-start gap-4 md:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="hidden rounded-2xl border border-[#D9EEE2] bg-white p-3 shadow-sm md:block">
              <p className="px-3 pb-3 pt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Menu Siswa</p>
              {menuGroups.map(group => <div key={group.title} className="mb-3 last:mb-0"><p className="px-3 py-2 text-xs font-extrabold text-[#087F49]">{group.title}</p><div className="space-y-1">{group.items.map(item => { const Icon = item.icon; const selected = activeMenu === item.id; return <button key={item.id} type="button" onClick={() => selectMenu(item.id as StudentMenu)} className={'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition '+(selected ? 'bg-[#E3F7EC] text-[#087F49]' : 'text-slate-600 hover:bg-[#F5FBF7]')}><Icon size={18}/><span className="min-w-0 flex-1">{item.label}</span>{'soon' in item && item.soon && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">Soon</span>}</button>; })}</div></div>)}
            </aside>

            <section className="min-w-0">
              {renderContent()}
            </section>
          </div>
        </div>

        {sidebarOpen && <div className="fixed inset-0 z-[200] md:hidden"><button type="button" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-slate-950/40"/><aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)] overflow-y-auto bg-white p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><p className="font-black text-[#087F49]">Menu Siswa</p><button type="button" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E3F7EC] text-[#087F49]"><X size={20}/></button></div>{menuGroups.map(group => <div key={group.title} className="mb-4"><p className="px-3 py-2 text-xs font-extrabold text-[#087F49]">{group.title}</p><div className="space-y-1">{group.items.map(item => { const Icon = item.icon; const selected = activeMenu === item.id; return <button key={item.id} type="button" onClick={() => selectMenu(item.id as StudentMenu)} className={'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold '+(selected ? 'bg-[#E3F7EC] text-[#087F49]' : 'text-slate-600')}><Icon size={18}/><span className="flex-1">{item.label}</span>{'soon' in item && item.soon && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">Soon</span>}</button>; })}</div></div>)}</aside></div>}
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7FBF8] px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#D9EEE2] bg-white shadow-[0_18px_55px_rgba(8,127,73,0.09)]">
        <header className="bg-gradient-to-br from-[#0B8F4D] to-[#087640] px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-emerald-950/15"><img src="/logo-alwasi.png" alt="Logo SMP Islam Al-Wasi’" className="h-full w-full object-contain"/></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">SMP Islam Al-Wasi’</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">SIMPATIK for Student</h1>
          <p className="mt-3 text-sm leading-6 text-white/90">Selamat datang siswa-siswi terbaik SMP Islam Al-Wasi’</p>
        </header>
        <div className="grid gap-3 p-5 sm:p-6">
          <button type="button" onClick={() => { setMessage(''); setView('register'); }} className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9EEE2] p-4 text-left transition hover:border-[#0B8F4D] hover:bg-[#F5FCF7]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><UserRound size={23}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">Mendaftar</span><span className="mt-1 block text-xs leading-5 text-slate-500">Isi NISN, nama lengkap, dan pilih kelas. Tunggu persetujuan admin.</span></span><ArrowRight className="text-[#087F49]" size={19}/>
          </button>
          <button type="button" onClick={() => { setMessage(''); setView('login'); }} className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9EEE2] p-4 text-left transition hover:border-[#0B8F4D] hover:bg-[#F5FCF7]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><KeyRound size={23}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">Masuk</span><span className="mt-1 block text-xs leading-5 text-slate-500">Untuk siswa yang sudah disetujui admin. Masuk menggunakan NISN.</span></span><ArrowRight className="text-[#087F49]" size={19}/>
          </button>
        </div>
        {view === 'login' && <div className="border-t border-[#E7F1EA] px-5 py-5 sm:px-6"><div className="mb-3"><h2 className="font-bold text-slate-800">Masuk SIMPATIK for Student</h2><p className="mt-1 text-xs leading-5 text-slate-500">Masukkan NISN. Perangkat akan diingat setelah login berhasil.</p></div><form onSubmit={loginStudent} className="grid gap-3"><label className="grid gap-1.5 text-sm font-semibold text-slate-700">NISN<input value={nisn} onChange={e => setNisn(e.target.value.slice(0,30))} maxLength={30} required placeholder="Masukkan NISN" className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#E3F7EC]"/></label>{message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{message}</p>}<button type="submit" disabled={busy} className="rounded-xl bg-[#0B8F4D] px-4 py-3 font-bold text-white transition hover:bg-[#087640] disabled:opacity-60">{busy ? 'Memeriksa NISN…' : 'Masuk'}</button></form></div>}
        <footer className="border-t border-[#E7F1EA] px-5 py-4 text-center text-[11px] text-slate-400">Qurani, Ramah Anak dan Berkarakter · SIMPATIK</footer>
      </section>
    </main>
  );
};
