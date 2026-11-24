import React from 'react';
import { Bell, Menu, RefreshCw } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HomeTopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenMore: () => void;
}

const pageTitles: Partial<Record<NavTab, string>> = {
  dashboard: 'Beranda',
  attendance: 'Presensi Siswa',
  journal: 'Jurnal Pembelajaran',
  assessment: 'Input Nilai Kelas',
  grades: 'Rekap Nilai',
  exams: 'Ujian',
  reports: 'Laporan',
  settings: 'Profil',
  classes: 'Data Kelas',
  subjects: 'Mata Pelajaran',
  master: 'Data Guru & Siswa',
  homeroom: 'Guru Wali',
  schedule: 'Jadwal',
  ils: 'ILS',
  more: 'Layanan Lainnya',
  'google-form-exams': 'Ujian Form',
};

export const HomeTopBar: React.FC<HomeTopBarProps> = ({ activeTab, onOpenMore }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E1EEE6] bg-white/95 shadow-[0_2px_10px_rgba(15,70,40,0.04)] backdrop-blur">
      <div className="mx-auto hidden min-h-[82px] w-full items-center justify-between gap-4 px-7 md:flex">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo-alwasi.png" alt="Logo SMP Islam Al-Wasi'" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
          <div className="min-w-0 leading-tight">
            <p className="text-[21px] font-black tracking-tight text-[#087F49]">SIMPATIK</p>
            <p className="text-[11px] font-semibold text-slate-700">Sistem Informasi Manajemen dan Pembelajaran AL-Wasi'</p>
            <p className="text-[10px] font-medium tracking-wide text-slate-500">Terpadu, Interaktif dan Kolaboratif</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => window.location.reload()} aria-label="Refresh halaman" title="Refresh" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]">
            <RefreshCw size={19} strokeWidth={2.2}/>
          </button>
          <span aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#087F49]">
            <Bell size={21} strokeWidth={2}/>
          </span>
        </div>
      </div>
      <div className="relative mx-auto flex min-h-[56px] w-full items-center justify-between px-4 py-2 md:hidden">
        <button type="button" onClick={onOpenMore} aria-label="Buka sidebar navigasi" aria-haspopup="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]">
          <Menu size={25} strokeWidth={2.2}/>
        </button>
        <p className="absolute left-1/2 -translate-x-1/2 text-base font-extrabold text-slate-800">SMP ISLAM AL-WASI'</p>
        <span aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#087F49]">
          <Bell size={22} strokeWidth={2}/>
        </span>
      </div>
    </header>
  );
};
