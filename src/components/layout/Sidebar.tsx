import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home, UserRound, GraduationCap, BookOpen, ClipboardList,
  Users, NotebookPen, ClipboardCheck,
  FileText, LogOut, CalendarDays, MoreHorizontal, X, Settings, ChevronDown, ChevronRight
} from 'lucide-react';

export type NavTab =
  | 'dashboard' | 'attendance' | 'journal'
  | 'assessment' | 'exams' | 'grades' | 'master' | 'reports'
  | 'settings' | 'account' | 'classes' | 'subjects' | 'ils' | 'homeroom' | 'schedule' | 'more' | 'google-form-exams';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface DesktopSidebarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
}

const primaryItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
  { tab: 'dashboard', label: 'Beranda', icon: Home },
  { tab: 'classes', label: 'Kelas', icon: GraduationCap },
  { tab: 'subjects', label: 'Mapel', icon: BookOpen },
];

const academicItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
  { tab: 'attendance', label: 'Presensi Siswa', icon: Users },
  { tab: 'journal', label: 'Jurnal Pembelajaran', icon: NotebookPen },
  { tab: 'assessment', label: 'Input Nilai Kelas', icon: ClipboardList },
  { tab: 'grades', label: 'Rekap Nilai', icon: ClipboardCheck },
  { tab: 'exams', label: 'Ujian', icon: FileText },
  { tab: 'reports', label: 'Laporan', icon: FileText },
  { tab: 'master', label: 'Data Guru & Siswa', icon: Users },
  { tab: 'homeroom', label: 'Guru Wali', icon: UserRound },
  { tab: 'schedule', label: 'Jadwal', icon: CalendarDays },
];

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, onNavigate }) => {
  const [settingsOpen, setSettingsOpen] = React.useState(activeTab === 'account' || activeTab === 'settings');
  const itemClass = (tab: NavTab) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold leading-5 transition-colors ${
      activeTab === tab
        ? 'bg-[#E8F7EF] text-[#047857] shadow-sm'
        : 'text-slate-600 hover:bg-[#F2FAF5] hover:text-[#076B3A]'
    }`;

  return (
    <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col border-r border-slate-200 bg-white px-3 pb-3 pt-2 md:flex">
      <div className="mb-2 border-b border-slate-200 px-2 pb-2">
        <p className="text-xs font-extrabold tracking-tight text-slate-900">SMP Islam Al-Wasi'</p>
      </div>

      <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {primaryItems.map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => onNavigate(tab)} className={itemClass(tab)}>
            <Icon size={16} strokeWidth={1.9} />{label}
          </button>
        ))}
        <button type="button" onClick={() => setSettingsOpen(open => !open)} className={itemClass(activeTab === 'account' || activeTab === 'settings' ? activeTab : 'dashboard')} aria-expanded={settingsOpen}>
          <Settings size={16} strokeWidth={1.9}/>Pengaturan{settingsOpen ? <ChevronDown className="ml-auto" size={15}/> : <ChevronRight className="ml-auto" size={15}/>}
        </button>
        {settingsOpen && <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
          <button type="button" onClick={() => onNavigate('account')} className={itemClass('account')}><UserRound size={15}/>Akun</button>
          <button type="button" onClick={() => onNavigate('settings')} className={itemClass('settings')}><GraduationCap size={15}/>Profil Sekolah</button>
        </div>}
        <p className="px-2.5 pb-0.5 pt-2.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Akademik</p>
        {academicItems.map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => onNavigate(tab)} className={itemClass(tab)}>
            <Icon size={16} strokeWidth={1.9} />{label}
          </button>
        ))}
        <button type="button" onClick={() => onNavigate('ils')} className={itemClass('ils')}>
          <BookOpen size={16} strokeWidth={1.9} />ILS
        </button>
        <button type="button" onClick={() => onNavigate('more')} className={itemClass('more')}>
          <MoreHorizontal size={16} strokeWidth={1.9} />Layanan Lainnya
        </button>
      </nav>
    </aside>
  );
};


interface MobileSidebarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ activeTab, onNavigate, isOpen, onClose }) => {
  const { currentUser, firebaseUser, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = React.useState(activeTab === 'account' || activeTab === 'settings');
  if (!isOpen) return null;

  const itemClass = (tab: NavTab) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
      activeTab === tab
        ? 'bg-gradient-to-br from-[#27C879] via-[#18B66A] to-[#0B9654] text-white shadow-sm'
        : 'text-slate-600 hover:bg-[#F2FAF5] hover:text-[#076B3A]'
    }`;

  return (
    <>
      <button type="button" aria-label="Tutup sidebar" onClick={onClose} className="fixed inset-0 z-[120] bg-slate-900/35 md:hidden" />
      <aside aria-label="Sidebar navigasi mobile" className="fixed inset-y-0 left-0 z-[130] flex h-dvh w-[min(86vw,320px)] flex-col border-r border-[#D5EADB] bg-white px-4 py-5 shadow-2xl md:hidden">
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 px-2 pb-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Guru</p>
            <p className="mt-1 truncate text-base font-extrabold tracking-tight text-slate-900">{currentUser?.displayName || currentUser?.email || 'Nama Guru'}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{currentUser?.role === 'super_admin' ? 'Admin Utama' : 'Guru'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup sidebar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><X size={19}/></button>
        </div>
        <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {primaryItems.map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => onNavigate(tab)} className={itemClass(tab)}>
              <Icon size={19} strokeWidth={1.9}/>{label}
            </button>
          ))}
          <button type="button" onClick={() => setSettingsOpen(open => !open)} className={itemClass(activeTab === 'account' || activeTab === 'settings' ? activeTab : 'dashboard')} aria-expanded={settingsOpen}>
            <Settings size={19} strokeWidth={1.9}/>Pengaturan{settingsOpen ? <ChevronDown className="ml-auto" size={16}/> : <ChevronRight className="ml-auto" size={16}/>}
          </button>
          {settingsOpen && <div className="ml-3 space-y-1 border-l border-slate-200 pl-2">
            <button type="button" onClick={() => onNavigate('account')} className={itemClass('account')}><UserRound size={18}/>Akun</button>
            <button type="button" onClick={() => onNavigate('settings')} className={itemClass('settings')}><GraduationCap size={18}/>Profil Sekolah</button>
          </div>}
          <p className="px-3 pb-1 pt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Akademik</p>
          {academicItems.map(({ tab, label, icon: Icon }) => (
            <button key={tab} type="button" onClick={() => onNavigate(tab)} className={itemClass(tab)}>
              <Icon size={19} strokeWidth={1.9}/>{label}
            </button>
          ))}
          <button type="button" onClick={() => onNavigate('ils')} className={itemClass('ils')}><BookOpen size={19}/>ILS</button>
          <button type="button" onClick={() => onNavigate('more')} className={itemClass('more')}><MoreHorizontal size={19}/>Layanan Lainnya</button>
        </nav>
        <div className="mt-4 border-t border-slate-100 pt-4">
          {firebaseUser && !firebaseUser.isAnonymous && currentUser && (
            <button type="button" onClick={() => { onClose(); void logout(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-red-600">
              <LogOut size={17}/>Keluar
            </button>
          )}
          <p className="mt-2 px-2 text-[10px] leading-5 text-slate-400">Qurani, Ramah Anak dan Berkarakter</p>
        </div>
      </aside>
    </>
  );
};

export const Sidebar: React.FC<SidebarProps> = () => null;
