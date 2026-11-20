import React, { useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from './Sidebar';
import { Header } from './Header';

interface HomeTopBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenMore: () => void;
}

export const HomeTopBar: React.FC<HomeTopBarProps> = ({ activeTab, onNavigate, onOpenMore }) => {
  const { currentUser } = useAuth();



  return (
    <div className="relative z-20 w-full bg-white">
      <div className="mx-auto flex w-full max-w-[1240px] items-center gap-3 px-4 py-3 md:px-8">
        <button type="button" onClick={onOpenMore} aria-label="Buka menu aplikasi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D5EADB] bg-[#F4FBF6] text-[#087F49] transition hover:bg-[#E3F7EC]">
          <Grid3X3 size={21} strokeWidth={2.2}/>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-500">SMP Islam Al-Wasi’</p>
          <p className="truncate text-sm font-extrabold text-slate-800">{currentUser?.displayName || currentUser?.email || 'Pengguna'}</p>
        </div>
      </div>
    </div>
  );
};
