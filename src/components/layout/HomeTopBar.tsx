import React, { useState } from 'react';
import { Bell, LogOut, Menu, RefreshCw, Search } from 'lucide-react';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface HomeTopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenMore: () => void;
}

const searchRoutes: [string[], NavTab][] = [
  [['presensi', 'absen', 'kehadiran'], 'attendance'],
  [['jurnal'], 'journal'],
  [['ujian', 'soal', 'tes'], 'exams'],
  [['nilai', 'rapor'], 'grades'],
  [['siswa', 'guru', 'data'], 'master'],
  [['bk', 'konseling'], 'counseling'],
  [['kelas'], 'classes'],
  [['mapel', 'mata pelajaran'], 'subjects'],
  [['pengaturan', 'profil'], 'settings'],
  [['ils', 'bacaan sholat', 'islamic life skill'], 'ils'],
];

export const HomeTopBar: React.FC<HomeTopBarProps> = ({ activeTab, onNavigate, onOpenMore }) => {
  const { currentUser, firebaseUser, logout } = useAuth();
  const [search, setSearch] = useState('');
  const profileName = currentUser?.displayName || firebaseUser?.displayName || currentUser?.email || 'Pengguna';

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim().toLocaleLowerCase('id-ID');
    if (!query) return;
    const match = searchRoutes.find(([words]) => words.some(word => query.includes(word)));
    if (match) onNavigate(match[1]);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E1EEE6] bg-white/95 shadow-[0_2px_10px_rgba(15,70,40,0.04)] backdrop-blur">
      <div className="mx-auto hidden min-h-[82px] w-full items-center justify-between gap-4 px-7 md:flex">
        <div className="flex min-w-0 items-center gap-3">
          {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="Foto profil" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-full border border-[#D5EADB] object-cover" /> : <div aria-label="Foto profil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-sm font-bold text-[#087F49]">{profileName.trim().charAt(0).toUpperCase()}</div>}
          <span className="max-w-[300px] truncate text-sm font-bold text-slate-800">{profileName}</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {activeTab === 'dashboard' && <form onSubmit={submitSearch} className="flex h-10 w-full max-w-[340px] items-center gap-2 rounded-xl border border-[#D5EADB] bg-[#F8FCF9] px-3"><Search size={17} className="shrink-0 text-[#0B8F4D]"/><input value={search} onChange={event => setSearch(event.target.value)} type="search" aria-label="Cari siswa atau layanan" placeholder="Cari siswa atau layanan..." className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"/></form>}
          <button type="button" onClick={() => window.alert('Belum ada notifikasi baru.')} aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><Bell size={19} strokeWidth={2}/></button>
          <button type="button" onClick={() => window.location.reload()} aria-label="Refresh halaman" title="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><RefreshCw size={18} strokeWidth={2}/></button>
          <button type="button" onClick={() => void logout()} aria-label="Keluar dari akun" title="Keluar" className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F1D8D8] bg-white px-3 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF5F5]"><LogOut size={18} strokeWidth={2}/><span>Keluar</span></button>
        </div>
      </div>
      <div className="mx-auto flex min-h-[56px] w-full items-center gap-2 px-3 py-2 md:hidden">
        <button type="button" onClick={onOpenMore} aria-label="Buka sidebar navigasi" aria-haspopup="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]"><Menu size={25} strokeWidth={2.2}/></button>
        {activeTab === 'dashboard' && <form onSubmit={submitSearch} className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#D5EADB] bg-[#F8FCF9] px-2"><Search size={16} className="shrink-0 text-[#0B8F4D]"/><input value={search} onChange={event => setSearch(event.target.value)} type="search" aria-label="Cari siswa atau layanan" placeholder="Cari..." className="w-full min-w-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"/></form>}
        <span aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#087F49]"><Bell size={22} strokeWidth={2}/></span>
      </div>
    </header>
  );
};
