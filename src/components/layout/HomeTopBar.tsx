import React, { useMemo, useState } from 'react';
import { Bell, LogOut, Menu, RefreshCw, Search, X, Users } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HomeTopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenMore: () => void;
}

const searchRoutes: { words: string[]; tab: NavTab; label: string; description: string }[] = [
  { words: ['presensi', 'absen', 'kehadiran'], tab: 'attendance', label: 'Presensi Siswa', description: 'Kelola dan lihat kehadiran siswa' },
  { words: ['jurnal'], tab: 'journal', label: 'Jurnal Siswa', description: 'Catatan kegiatan dan perilaku siswa' },
  { words: ['ujian', 'soal', 'tes'], tab: 'exams', label: 'Ruang Ujian', description: 'Kelola ujian dan soal' },
  { words: ['nilai', 'rapor'], tab: 'grades', label: 'Nilai dan Rapor', description: 'Lihat rekap nilai siswa' },
  { words: ['siswa', 'guru', 'data', 'master'], tab: 'master', label: 'Data Siswa dan Guru', description: 'Buka data induk sekolah' },
  { words: ['bk', 'konseling'], tab: 'counseling', label: 'Bimbingan Konseling', description: 'Layanan BK siswa' },
  { words: ['kelas'], tab: 'classes', label: 'Data Kelas', description: 'Daftar kelas sekolah' },
  { words: ['mapel', 'mata pelajaran'], tab: 'subjects', label: 'Mata Pelajaran', description: 'Daftar mata pelajaran' },
  { words: ['pengaturan', 'profil'], tab: 'settings', label: 'Pengaturan dan Profil Sekolah', description: 'Informasi dan pengaturan sekolah' },
  { words: ['ils', 'bacaan sholat', 'islamic life skill'], tab: 'ils', label: 'Islamic Life Skill', description: 'Pemantauan bacaan sholat siswa' },
];

export const HomeTopBar: React.FC<HomeTopBarProps> = ({ activeTab, onNavigate, onOpenMore }) => {
  const { currentUser, firebaseUser, logout } = useAuth();
  const { students } = useData();
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const profileName = currentUser?.displayName || firebaseUser?.displayName || currentUser?.email || 'Pengguna';
  const query = search.trim().toLocaleLowerCase('id-ID');

  const results = useMemo(() => {
    if (!query) return { studentMatches: [], serviceMatches: [] };
    const studentMatches = students
      .filter(student => student.name.toLocaleLowerCase('id-ID').includes(query) ||
        student.className.toLocaleLowerCase('id-ID').includes(query) ||
        student.nis?.toLocaleLowerCase('id-ID').includes(query) ||
        student.nisn?.toLocaleLowerCase('id-ID').includes(query))
      .slice(0, 6);
    const serviceMatches = searchRoutes.filter(route =>
      route.words.some(word => word.includes(query) || query.includes(word)) ||
      route.label.toLocaleLowerCase('id-ID').includes(query)
    ).slice(0, 5);
    return { studentMatches, serviceMatches };
  }, [query, students]);

  const openResult = (tab: NavTab) => {
    onNavigate(tab);
    setSearch('');
    setMobileSearchOpen(false);
  };

  const searchPanel = (mobile = false) => (
    <div className={mobile ? 'absolute left-3 right-3 top-full z-50 mt-2 rounded-2xl border border-[#D5EADB] bg-white p-3 shadow-xl' : 'absolute right-0 top-full z-50 mt-2 w-[min(420px,90vw)] rounded-2xl border border-[#D5EADB] bg-white p-3 shadow-xl'}>
      <div className="flex items-center gap-2 rounded-xl border border-[#D5EADB] bg-[#F8FCF9] px-3 py-2.5">
        <Search size={17} className="shrink-0 text-[#087F49]"/>
        <input autoFocus={mobile} value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => {
          if (event.key === 'Escape') { setSearch(''); setMobileSearchOpen(false); }
          if (event.key === 'Enter' && results.studentMatches.length) openResult('master');
          else if (event.key === 'Enter' && results.serviceMatches.length) openResult(results.serviceMatches[0].tab);
        }} type="search" aria-label="Cari siswa atau layanan" placeholder="Ketik nama siswa atau layanan..." className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/>
        {search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian" className="text-slate-400 hover:text-slate-700"><X size={16}/></button>}
      </div>
      {!query ? <p className="px-2 py-3 text-xs text-slate-500">Cari berdasarkan nama siswa, kelas, NIS/NISN, atau nama layanan.</p> : (
        <div className="mt-2 max-h-[min(55vh,360px)] space-y-1 overflow-y-auto">
          {results.studentMatches.map(student => (
            <button key={student.id} type="button" onClick={() => openResult('master')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F0FAF4]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-[#087F49]"><Users size={17}/></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{student.name}</span><span className="block text-xs text-slate-500">{student.className} · {student.status}{student.nis ? ` · NIS ${student.nis}` : ''}</span></span>
              <span className="text-[10px] font-bold text-[#087F49]">Siswa</span>
            </button>
          ))}
          {results.serviceMatches.map(route => (
            <button key={route.tab} type="button" onClick={() => openResult(route.tab)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F0FAF4]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Search size={16}/></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{route.label}</span><span className="block text-xs text-slate-500">{route.description}</span></span>
              <span className="text-[10px] font-bold text-slate-400">Layanan</span>
            </button>
          ))}
          {!results.studentMatches.length && !results.serviceMatches.length && <p className="px-3 py-5 text-center text-xs text-slate-500">Tidak ditemukan siswa atau layanan yang cocok.</p>}
        </div>
      )}
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
          {activeTab === 'dashboard' && <div className="relative w-full max-w-[340px]">
            <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#D5EADB] bg-[#F8FCF9] px-3"><Search size={17} className="shrink-0 text-[#0B8F4D]"/><input value={search} onChange={event => setSearch(event.target.value)} type="search" aria-label="Cari siswa atau layanan" placeholder="Cari siswa atau layanan..." className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/></div>
            {searchPanel()}
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
        {activeTab === 'dashboard' && <button type="button" onClick={() => { setMobileSearchOpen(open => !open); setSearch(''); }} aria-label="Cari siswa atau layanan" title="Cari" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F8FCF9] text-[#087F49] transition hover:bg-[#E3F7EC]"><Search size={19} strokeWidth={2}/></button>}
        <button type="button" onClick={() => window.alert('Belum ada notifikasi baru.')} aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><Bell size={20} strokeWidth={2}/></button>
      </div>
      {activeTab === 'dashboard' && mobileSearchOpen && <div className="relative lg:hidden">{searchPanel(true)}</div>}
    </header>
  );
};
