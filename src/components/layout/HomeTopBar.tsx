import React, { useMemo, useState } from 'react';
import { Bell, LogOut, Menu, RefreshCw, Search, X, Users, GraduationCap, BookOpen, Layers, ClipboardList } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HomeTopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenMore: () => void;
  onOpenStudentProfile: (studentId: string) => void;
}

type SearchResult = {
  id: string;
  title: string;
  detail: string;
  category: string;
  tab: NavTab;
  icon: React.ElementType;
  studentId?: string;
};

const serviceResults: SearchResult[] = [
  { id: 'attendance', title: 'Presensi Siswa', detail: 'Kehadiran dan absensi siswa', category: 'Layanan', tab: 'attendance', icon: Users },
  { id: 'journal', title: 'Jurnal Pembelajaran', detail: 'Kegiatan dan catatan pembelajaran', category: 'Layanan', tab: 'journal', icon: ClipboardList },
  { id: 'assessment', title: 'Input Nilai Kelas', detail: 'Penilaian hasil belajar siswa', category: 'Layanan', tab: 'assessment', icon: BookOpen },
  { id: 'grades', title: 'Rekap Nilai dan Rapor', detail: 'Nilai dan hasil belajar', category: 'Layanan', tab: 'grades', icon: ClipboardList },
  { id: 'exams', title: 'Ruang Ujian', detail: 'Ujian, tes, dan bank soal', category: 'Layanan', tab: 'exams', icon: BookOpen },
  { id: 'master', title: 'Data Guru dan Siswa', detail: 'Data induk warga sekolah', category: 'Layanan', tab: 'master', icon: Users },
  { id: 'classes', title: 'Data Kelas', detail: 'Daftar kelas VII, VIII, dan IX', category: 'Layanan', tab: 'classes', icon: GraduationCap },
  { id: 'subjects', title: 'Mata Pelajaran', detail: 'Daftar dan pengelolaan mapel', category: 'Layanan', tab: 'subjects', icon: BookOpen },
  { id: 'settings', title: 'Pengaturan dan Profil Sekolah', detail: 'Identitas dan pengaturan sekolah', category: 'Layanan', tab: 'settings', icon: Layers },
  { id: 'ils', title: 'Islamic Life Skill', detail: 'Pemantauan bacaan sholat siswa', category: 'Layanan', tab: 'ils', icon: BookOpen },
  { id: 'counseling', title: 'Bimbingan Konseling', detail: 'Layanan konseling dan pendampingan siswa', category: 'Layanan', tab: 'more', icon: Users },
  { id: 'homeroom', title: 'Guru Wali', detail: 'Layanan guru wali kelas', category: 'Layanan', tab: 'homeroom', icon: Users },
  { id: 'schedule', title: 'Jadwal', detail: 'Jadwal kegiatan dan pembelajaran', category: 'Layanan', tab: 'schedule', icon: ClipboardList },
  { id: 'reports', title: 'Laporan', detail: 'Laporan kegiatan sekolah', category: 'Layanan', tab: 'reports', icon: ClipboardList },
  { id: 'more', title: 'Layanan Lainnya', detail: 'Layanan tambahan SIMPATIK', category: 'Layanan', tab: 'more', icon: Layers },
];

const normalize = (value: unknown) => String(value ?? '').toLocaleLowerCase('id-ID').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const matches = (query: string, values: unknown[]) => {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(values.filter(Boolean).join(' '));
  return terms.every(term => haystack.split(/\s+/).some(word => word.startsWith(term)));
};

export const HomeTopBar: React.FC<HomeTopBarProps> = ({ activeTab, onNavigate, onOpenMore, onOpenStudentProfile }) => {
  const { currentUser, firebaseUser, logout } = useAuth();
  const { students, teachers, classes, subjects, extracurriculars, journals, assessments, behaviors, counselings } = useData();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const profileName = currentUser?.displayName || firebaseUser?.displayName || currentUser?.email || 'Pengguna';
  const query = normalize(search);

  const results = useMemo<SearchResult[]>(() => {
    if (!query) return [];
    const found: SearchResult[] = [];
    const add = (item: SearchResult) => {
      if (matches(query, [item.title, item.detail, item.category])) found.push(item);
    };

    serviceResults.forEach(add);
    students.forEach(student => {
      if (matches(query, [student.name, student.className, student.nis, student.nisn])) {
        found.push({ id: 'student-' + student.id, title: student.name, detail: [student.className, student.status, student.nis ? 'NIS ' + student.nis : ''].filter(Boolean).join(' · '), category: 'Siswa', tab: 'master', icon: Users, studentId: student.id });
      }
    });
    teachers.forEach(teacher => {
      if (matches(query, [teacher.name, teacher.subject, teacher.role, teacher.nip, teacher.email, teacher.assignedClass])) {
        found.push({ id: 'teacher-' + teacher.id, title: teacher.name, detail: [teacher.subject, teacher.assignedClass].filter(Boolean).join(' · ') || 'Data guru', category: 'Guru', tab: 'master', icon: GraduationCap });
      }
    });
    subjects.forEach((subject, index) => {
      if (matches(query, [subject])) found.push({ id: 'subject-' + index, title: subject, detail: 'Mata pelajaran', category: 'Mapel', tab: 'subjects', icon: BookOpen });
    });
    classes.forEach((className, index) => {
      if (matches(query, [className])) found.push({ id: 'class-' + index, title: className, detail: 'Data kelas', category: 'Kelas', tab: 'classes', icon: GraduationCap });
    });
    extracurriculars.forEach((name, index) => {
      if (matches(query, [name])) found.push({ id: 'extra-' + index, title: name, detail: 'Kegiatan ekstrakurikuler', category: 'Ekstrakurikuler', tab: 'more', icon: Layers });
    });
    journals.forEach(item => {
      if (matches(query, [item.topic, item.activity, item.subject, item.className])) found.push({ id: 'journal-' + item.id, title: item.topic || item.activity, detail: [item.subject, item.className, 'Jurnal pembelajaran'].filter(Boolean).join(' · '), category: 'Jurnal', tab: 'journal', icon: ClipboardList });
    });
    assessments.forEach(item => {
      if (matches(query, [item.subject, item.className, item.assessmentType, item.teacherName])) found.push({ id: 'assessment-' + item.id, title: item.subject, detail: [item.className, item.assessmentType, 'Penilaian'].filter(Boolean).join(' · '), category: 'Penilaian', tab: 'assessment', icon: BookOpen });
    });
    behaviors.forEach(item => {
      if (matches(query, [item.studentName, item.className, item.category, item.description])) found.push({ id: 'behavior-' + item.id, title: item.studentName, detail: [item.className, item.category, item.description].filter(Boolean).join(' · '), category: 'Catatan perilaku', tab: 'journal', icon: Users });
    });
    counselings.forEach(item => {
      if (matches(query, [item.studentName, item.className, item.serviceType, item.issueSummary])) found.push({ id: 'counseling-' + item.id, title: item.studentName, detail: [item.className, item.serviceType, item.issueSummary].filter(Boolean).join(' · '), category: 'Catatan BK', tab: 'more', icon: Users });
    });
    return found.slice(0, 12);
  }, [query, students, teachers, classes, subjects, extracurriculars, journals, assessments, behaviors, counselings]);

  const openResult = (result: SearchResult) => {
    if (result.studentId) onOpenStudentProfile(result.studentId);
    else onNavigate(result.tab);
    setSearch('');
    setSearchOpen(false);
    setMobileSearchOpen(false);
  };

  const renderResults = () => (
    <div className="mt-2 max-h-[min(60vh,420px)] space-y-1 overflow-y-auto">
      {results.map(result => {
        const Icon = result.icon;
        return <button key={result.id} type="button" onClick={() => openResult(result)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F0FAF4]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-[#087F49]"><Icon size={17}/></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{result.title}</span><span className="block truncate text-xs text-slate-500">{result.detail}</span></span>
          <span className="shrink-0 text-[10px] font-bold text-[#087F49]">{result.category}</span>
        </button>;
      })}
      {!results.length && <p className="px-3 py-5 text-center text-xs text-slate-500">Tidak ditemukan hasil yang cocok.</p>}
    </div>
  );

  const searchPanel = (mobile = false) => (
    <div className={mobile ? 'absolute left-3 right-3 top-full z-50 mt-2 rounded-2xl border border-[#D5EADB] bg-white p-3 shadow-xl' : 'absolute right-0 top-full z-50 mt-2 w-[min(440px,90vw)] rounded-2xl border border-[#D5EADB] bg-white p-3 shadow-xl'}>
      {mobile && <div className="flex items-center gap-2 rounded-xl border border-[#D5EADB] bg-[#F8FCF9] px-3 py-2.5">
        <Search size={17} className="shrink-0 text-[#087F49]"/>
        <input autoFocus value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => {
          if (event.key === 'Escape') { setSearch(''); setSearchOpen(false); setMobileSearchOpen(false); }
          if (event.key === 'Enter' && results.length) openResult(results[0]);
        }} type="search" aria-label="Cari seluruh SIMPATIK" placeholder="Cari siswa, guru, mapel, kelas, layanan..." className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/>
        {search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian" className="text-slate-400 hover:text-slate-700"><X size={16}/></button>}
      </div>}
      {!query ? <p className="px-2 py-3 text-xs text-slate-500">Ketik satu huruf atau lebih untuk melihat saran dari seluruh data dan layanan SIMPATIK.</p> : renderResults()}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E1EEE6] bg-white/95 shadow-[0_2px_10px_rgba(15,70,40,0.04)] backdrop-blur">
      <div className="mx-auto hidden min-h-[82px] w-full items-center justify-between gap-4 px-7 lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="Foto profil" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-full border border-[#D5EADB] object-cover" /> : <div aria-label="Foto profil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-sm font-bold text-[#087F49]">{profileName.trim().charAt(0).toUpperCase()}</div>}
          <span className="max-w-[300px] truncate text-sm font-bold text-slate-800">{profileName}</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {activeTab === 'dashboard' && <div className="relative w-full max-w-[390px]">
            <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#D5EADB] bg-[#F8FCF9] px-3"><Search size={17} className="shrink-0 text-[#0B8F4D]"/><input value={search} onFocus={() => setSearchOpen(true)} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setSearch(''); setSearchOpen(false); } if (event.key === 'Enter' && results.length) openResult(results[0].tab); }} type="search" aria-label="Cari seluruh SIMPATIK" placeholder="Cari apa saja di SIMPATIK..." className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/>{search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian" className="text-slate-400"><X size={16}/></button>}</div>
            {searchOpen && searchPanel()}
          </div>}
          <button type="button" onClick={() => window.alert('Belum ada notifikasi baru.')} aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><Bell size={19} strokeWidth={2}/></button>
          <button type="button" onClick={() => window.location.reload()} aria-label="Refresh halaman" title="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><RefreshCw size={18} strokeWidth={2}/></button>
          <button type="button" onClick={() => void logout()} aria-label="Keluar dari akun" title="Keluar" className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F1D8D8] bg-white px-3 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF5F5]"><LogOut size={18} strokeWidth={2}/><span>Keluar</span></button>
        </div>
      </div>
      <div className="mx-auto flex min-h-[56px] w-full items-center gap-2 px-3 py-2 sm:px-5 lg:hidden">
        <button type="button" onClick={onOpenMore} aria-label="Buka sidebar navigasi" aria-haspopup="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]"><Menu size={25} strokeWidth={2.2}/></button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="Foto profil" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full border border-[#D5EADB] object-cover" /> : <div aria-label="Foto profil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-sm font-bold text-[#087F49]">{profileName.trim().charAt(0).toUpperCase()}</div>}
          <span className="min-w-0 truncate text-xs font-bold text-slate-800 sm:text-sm">{profileName}</span>
        </div>
        {activeTab === 'dashboard' && <button type="button" onClick={() => { setMobileSearchOpen(open => !open); setSearch(''); }} aria-label="Cari seluruh SIMPATIK" title="Cari" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F8FCF9] text-[#087F49] transition hover:bg-[#E3F7EC]"><Search size={19} strokeWidth={2}/></button>}
        <button type="button" onClick={() => window.alert('Belum ada notifikasi baru.')} aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><Bell size={20} strokeWidth={2}/></button>
      </div>
      {activeTab === 'dashboard' && mobileSearchOpen && <div className="relative lg:hidden">{searchPanel(true)}</div>}
    </header>
  );
};
