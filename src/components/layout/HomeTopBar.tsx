import React from 'react';
import { Grid2X2, Bell } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HomeTopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenMore: () => void;
}

export const HomeTopBar: React.FC<HomeTopBarProps> = ({ onOpenMore }) => {
  return (
    <div className="relative z-20 w-full bg-white">
      <div className="relative mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-3 md:px-8">
        <button type="button" onClick={onOpenMore} aria-label="Buka menu aplikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]">
          <Grid2X2 size={22} strokeWidth={2.1}/>
        </button>
        <p className="absolute left-1/2 -translate-x-1/2 text-base font-extrabold text-slate-800">Home</p>
        <span aria-label="Notifikasi" title="Notifikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#087F49]">
          <Bell size={22} strokeWidth={2}/>
        </span>
      </div>
    </div>
  );
};
