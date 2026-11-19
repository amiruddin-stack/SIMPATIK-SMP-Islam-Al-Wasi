import React, { useState } from 'react';
import {
  Home, Users, NotebookPen, UserRound, CalendarDays, Grid3X3, X,
  GraduationCap, BookOpen, ClipboardList, ClipboardCheck, FileText,
  HeartHandshake, ShieldCheck, MoreHorizontal
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { HomeTopBar } from './components/layout/HomeTopBar';
import { PageBanner } from './components/layout/PageBanner';
import { NavTab, DesktopSidebar } from './components/layout/Sidebar';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardPage } from './pages/DashboardPage';
import { AttendancePage } from './pages/AttendancePage';
import { JournalPage } from './pages/JournalPage';
import { BehaviorPage } from './pages/BehaviorPage';
import { CounselingPage } from './pages/CounselingPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { GradeSummaryPage } from './pages/GradeSummaryPage';
import { MasterDataPage, RegistrationPage } from './pages/MasterDataPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExamPage } from './pages/ExamPage';
import { ExamHubPage } from './pages/ExamHubPage';
import { GoogleFormExamPage } from './pages/GoogleFormExamPage';
import { LoginPage } from './pages/LoginPage';
import { MorePage } from './pages/MorePage';
import { StudentPortalPage } from './pages/StudentPortalPage';

function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E3F7EC] text-3xl font-black text-[#0B8F4D]">ILS</div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0B8F4D]">SIMPATIK AL-WASI’</p>
      <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      <span className="mt-6 rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">Coming Soon</span>
    </section>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTabState] = useState<NavTab>(() => (new URLSearchParams(window.location.search).get('page') as NavTab) || 'dashboard');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const mobileNavItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
    { tab: 'attendance', label: 'Presensi', icon: Users },
    { tab: 'journal', label: 'Jurnal', icon: NotebookPen },
    { tab: 'dashboard', label: 'Home', icon: Home },
    { tab: 'homeroom', label: 'G-Wali', icon: UserRound },
  ];

  const appMenuItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
    { tab: 'dashboard', label: 'Beranda', icon: Home },
    { tab: 'settings', label: 'Profil', icon: UserRound },
    { tab: 'classes', label: 'Kelas', icon: GraduationCap },
    { tab: 'subjects', label: 'Mapel', icon: BookOpen },
    { tab: 'attendance', label: 'Presensi Siswa', icon: Users },
    { tab: 'journal', label: 'Jurnal Pembelajaran', icon: NotebookPen },
    { tab: 'assessment', label: 'Input Nilai Kelas', icon: ClipboardList },
    { tab: 'grades', label: 'Rekap Nilai', icon: ClipboardCheck },
    { tab: 'exams', label: 'Ujian', icon: FileText },
    { tab: 'counseling', label: 'Bimbingan Konseling', icon: HeartHandshake },
    { tab: 'behavior', label: 'Perilaku Siswa', icon: ShieldCheck },
    { tab: 'reports', label: 'Laporan', icon: FileText },
    { tab: 'master', label: 'Data Guru & Siswa', icon: Users },
    { tab: 'homeroom', label: 'Guru Wali', icon: UserRound },
    { tab: 'schedule', label: 'Jadwal', icon: CalendarDays },
    { tab: 'ils', label: 'ILS', icon: BookOpen },
    { tab: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const setActiveTab = (tab: NavTab) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', tab);
    window.history.pushState({ simpatikTab: tab }, '', url);
    setActiveTabState(tab);
    setMoreMenuOpen(false);
  };

  React.useEffect(() => {
    const restore = () => {
      const tab = (window.history.state?.simpatikTab || new URLSearchParams(window.location.search).get('page') || 'dashboard') as NavTab;
      setActiveTabState(tab);
      setMoreMenuOpen(false);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fbf9]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          <p className="text-sm font-medium text-slate-500">SIMPATIK sedang dipersiapkan…</p>
        </div>
      </main>
    );
  }

  const studentPath = /\/students?\/?$/.test(window.location.pathname);
  const legacyStudentLink = new URLSearchParams(window.location.search).get('student') === '1';
  if (studentPath || legacyStudentLink) return <StudentPortalPage />;

  const sharedExamLink = new URLSearchParams(window.location.search).has('ujian');
  if (sharedExamLink) return <ExamPage studentMode />;

  const registrationType = new URLSearchParams(window.location.search).get('daftar');
  if (registrationType === 'guru' || registrationType === 'siswa') return <RegistrationPage type={registrationType} />;

  if (!currentUser) return <LoginPage />;

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'attendance': return <AttendancePage />;
      case 'journal': return <JournalPage />;
      case 'behavior': return <BehaviorPage />;
      case 'counseling': return <CounselingPage />;
      case 'assessment': return <AssessmentPage />;
      case 'grades': return <GradeSummaryPage />;
      case 'master': return <MasterDataPage />;
      case 'classes': return <MasterDataPage initialSubTab="kelas" />;
      case 'subjects': return <MasterDataPage initialSubTab="mapel" />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'exams': return <ExamHubPage />;
      case 'google-form-exams': return <GoogleFormExamPage />;
      case 'ils': return <ComingSoonPage title="ILS" description="Informasi dan layanan ILS sedang dalam tahap persiapan." />;
      case 'homeroom': return <ComingSoonPage title="Guru Wali" description="Ruang kerja Guru Wali sedang dalam tahap persiapan." />;
      case 'schedule': return <ComingSoonPage title="Jadwal" description="Informasi jadwal kegiatan dan pembelajaran sedang dalam tahap persiapan." />;
      case 'more': return <MorePage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-800" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex min-h-screen w-full">
        <DesktopSidebar activeTab={activeTab} onNavigate={setActiveTab} />
        <div className="min-w-0 flex-1">
          <HomeTopBar activeTab={activeTab} onNavigate={setActiveTab} />
          <main className="min-h-screen w-full p-0">
            <div className={activeTab === 'dashboard' ? 'w-full' : 'mx-auto w-full max-w-7xl px-4 pt-5 pb-24 md:px-6 md:py-6'}>
              {activeTab !== 'dashboard' && activeTab !== 'subjects' && <PageBanner activeTab={activeTab} onBack={() => { if (window.history.state?.simpatikTab) window.history.back(); else setActiveTab('dashboard'); }} />}
              {renderCurrentPage()}
            </div>
          </main>
        </div>
      </div>

      {moreMenuOpen && (
        <>
          <button type="button" aria-label="Tutup menu aplikasi" onClick={() => setMoreMenuOpen(false)} className="fixed inset-0 z-[110] bg-slate-900/25 md:hidden" />
          <section aria-label="Menu aplikasi" className="fixed inset-x-3 bottom-[78px] z-[120] max-h-[68vh] overflow-y-auto rounded-[24px] border border-[#D5EADB] bg-white p-4 shadow-[0_16px_48px_rgba(15,70,40,0.2)] md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Menu Aplikasi</h2>
                <p className="text-[11px] text-slate-500">Pilih menu SIMPATIK</p>
              </div>
              <button type="button" onClick={() => setMoreMenuOpen(false)} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {appMenuItems.map(({ tab, label, icon: Icon }) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} className={`flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition-colors ${activeTab === tab ? 'border-[#8BD5AA] bg-[#E3F7EC] text-[#076B3A]' : 'border-slate-100 bg-slate-50 text-slate-600 active:bg-[#E3F7EC]'}`}>
                  <Icon size={21} strokeWidth={1.9} />
                  <span className="text-[10px] font-bold leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-5 border-t border-[#D5EADB] bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-6px_20px_rgba(15,70,40,0.08)] backdrop-blur md:hidden">
        {mobileNavItems.map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${activeTab === tab ? 'text-[#087F49]' : 'text-slate-500'}`}>
            <span className={`flex h-8 w-9 items-center justify-center rounded-xl ${activeTab === tab ? 'bg-[#E3F7EC]' : ''}`}><Icon size={19} strokeWidth={activeTab === tab ? 2.4 : 1.9}/></span>
            <span>{label}</span>
          </button>
        ))}
        <button type="button" onClick={() => setMoreMenuOpen(open => !open)} aria-expanded={moreMenuOpen} aria-label="More, buka menu aplikasi" className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${moreMenuOpen ? 'text-[#087F49]' : 'text-slate-500'}`}>
          <span className={`flex h-8 w-9 items-center justify-center rounded-xl ${moreMenuOpen ? 'bg-[#E3F7EC]' : ''}`}><Grid3X3 size={19} strokeWidth={moreMenuOpen ? 2.4 : 1.9}/></span>
          <span>More</span>
        </button>
      </nav>
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
