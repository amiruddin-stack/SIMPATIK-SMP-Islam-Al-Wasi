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

  const navigateSearch = (value: string) => {
    const query = value.trim().toLocaleLowerCase('id-ID');
    if (!query) return;
    const match = searchRoutes.find(([words]) => words.some(word => query.includes(word)));
    if (match) onNavigate(match[1]);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigateSearch(search);
  };

  const openMobileSearch = () => {
    const query = window.prompt('Cari siswa atau layanan');
    if (query !== null) navigateSearch(query);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E1EEE6] bg-white/95 shadow-[0_2px_10px_rgba(15,70,40,0.04)] backdrop-blur">
      <div className="mx-auto hidden min-h-[82px] w-full items-center justify-between gap-4 px-7 lg:flex">
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
      <div className="mx-auto flex min-h-[56px] w-full items-center gap-2 px-3 py-2 sm:px-5 lg:hidden">
        <button type="button" onClick={onOpenMore} aria-label="Buka sidebar navigasi" aria-haspopup="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]"><Menu size={25} strokeWidth={2.2}/></button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="Foto profil" referrerPolicy="no-referrer" className="h-9 w-9 shrink-0 rounded-full border border-[#D5EADB] object-cover" /> : <div aria-label="Foto profil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-sm font-bold text-[#087F49]">{profileName.trim().charAt(0).toUpperCase()}</div>}
          <span className="min-w-0 truncate text-xs font-bold text-slate-800 sm:text-sm">{profileName}</span>
        </div>
        {activeTab === 'dashboard' && <button type="button" onClick={openMobileSearch} aria-label="Cari siswa atau layanan" title="Cari" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F8FCF9] text-[#087F49] transition hover:bg-[#E3F7EC]"><Search size={19} strokeWidth={2}/></button>}
        <button type="button" onClick={() => window.alert('Belum ada notifikasi baru.')} aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-white text-[#087F49] transition hover:bg-[#F0FAF4]"><Bell size={20} strokeWidth={2}/></button>
      </div>
    </header>
  );
};
