import React, { useState } from 'react';
import {
  Home, Users, NotebookPen, FileText
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { HomeTopBar } from './components/layout/HomeTopBar';
import { PageBanner } from './components/layout/PageBanner';
import { NavTab, DesktopSidebar, MobileSidebar } from './components/layout/Sidebar';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardPage } from './pages/DashboardPage';
import { AttendancePage } from './pages/AttendancePage';
import { JournalPage } from './pages/JournalPage';
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
import { StudentProfilePage } from './pages/StudentProfilePage';

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
  const { currentUser, loading, updateTeacherIdentity } = useAuth();
  const [identityForm, setIdentityForm] = useState({ fullName: currentUser?.fullName || currentUser?.displayName || '', nickname: currentUser?.nickname || '', position: currentUser?.position || '' });
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityError, setIdentityError] = useState('');
  React.useEffect(() => {
    if (!currentUser) return;
    setIdentityForm({ fullName: currentUser.fullName || currentUser.displayName || '', nickname: currentUser.nickname || '', position: currentUser.position || '' });
  }, [currentUser?.uid, currentUser?.fullName, currentUser?.nickname, currentUser?.position, currentUser?.displayName]);
  const [activeTab, setActiveTabState] = useState<NavTab>(() => (new URLSearchParams(window.location.search).get('page') as NavTab) || 'dashboard');
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [attendanceHasUnsaved, setAttendanceHasUnsaved] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<NavTab | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const mobileNavItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
    { tab: 'dashboard', label: 'Home', icon: Home },
    { tab: 'attendance', label: 'Presensi', icon: Users },
    { tab: 'journal', label: 'Jurnal', icon: NotebookPen },
    { tab: 'exams', label: 'Ujian', icon: FileText },
  ];

  const commitNavigation = (tab: NavTab) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', tab);
    window.history.pushState({ simpatikTab: tab }, '', url);
    setActiveTabState(tab);
    setMobileSidebarOpen(false);
  };

  const setActiveTab = (tab: NavTab) => {
    if (tab === activeTab) {
      setMobileSidebarOpen(false);
      return;
    }
    if (attendanceHasUnsaved && activeTab === 'attendance') {
      setPendingNavigation(tab);
      setShowUnsavedDialog(true);
      return;
    }
    commitNavigation(tab);
  };

  const discardAndNavigate = () => {
    if (!pendingNavigation) return;
    setAttendanceHasUnsaved(false);
    setShowUnsavedDialog(false);
    commitNavigation(pendingNavigation);
    setPendingNavigation(null);
  };

  React.useEffect(() => {
    const restore = () => {
      const tab = (window.history.state?.simpatikTab || new URLSearchParams(window.location.search).get('page') || 'dashboard') as NavTab;
      if (attendanceHasUnsaved && activeTab === 'attendance' && tab !== 'attendance') {
        const url = new URL(window.location.href);
        url.searchParams.set('page', 'attendance');
        window.history.pushState({ simpatikTab: 'attendance' }, '', url);
        setPendingNavigation(tab);
        setShowUnsavedDialog(true);
        return;
      }
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [attendanceHasUnsaved, activeTab]);

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

  const needsTeacherIdentity = !currentUser.fullName?.trim() || !currentUser.nickname?.trim() || !currentUser.position?.trim();
  const saveTeacherIdentity = async () => {
    setIdentityError('');
    setIdentitySaving(true);
    try {
      await updateTeacherIdentity(identityForm);
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Identitas gagal disimpan. Silakan coba lagi.');
    } finally {
      setIdentitySaving(false);
    }
  };

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage onNavigate={setActiveTab} />;
      case 'attendance': return <AttendancePage onDirtyChange={setAttendanceHasUnsaved} />;
      case 'journal': return <JournalPage />;
      case 'assessment': return <AssessmentPage />;
      case 'grades': return <GradeSummaryPage />;
      case 'master': return <MasterDataPage onOpenStudentProfile={setSelectedStudentProfileId} />;
      case 'classes': return <MasterDataPage initialSubTab="kelas" onOpenStudentProfile={setSelectedStudentProfileId} />;
      case 'subjects': return <MasterDataPage initialSubTab="mapel" />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'exams': return <ExamHubPage />;
      case 'google-form-exams': return <GoogleFormExamPage />;
      case 'ils': return <ComingSoonPage title="ILS" description="Informasi dan layanan ILS sedang dalam tahap persiapan." />;
      case 'homeroom': return <ComingSoonPage title="Guru Wali" description="Ruang kerja Guru Wali sedang dalam tahap persiapan." />;
      case 'schedule': return <ComingSoonPage title="Jadwal" description="Informasi jadwal kegiatan dan pembelajaran sedang dalam tahap persiapan." />;
      case 'more': return <MorePage />;
      default: return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-800" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex min-h-screen w-full">
        <DesktopSidebar activeTab={activeTab} onNavigate={setActiveTab} />
        <div className="min-w-0 flex-1">
          <HomeTopBar activeTab={activeTab} onNavigate={setActiveTab} onOpenMore={() => setMobileSidebarOpen(open => !open)} onOpenStudentProfile={setSelectedStudentProfileId} />
          <main className="min-h-screen w-full p-0">
            <div className={activeTab === 'dashboard' ? 'w-full' : 'mx-auto w-full max-w-7xl px-4 pt-5 pb-24 md:px-6 md:py-6'}>
              {activeTab !== 'dashboard' && activeTab !== 'subjects' && <PageBanner activeTab={activeTab} onBack={() => { if (window.history.state?.simpatikTab) window.history.back(); else setActiveTab('dashboard'); }} />}
              {selectedStudentProfileId ? <StudentProfilePage studentId={selectedStudentProfileId} onBack={() => setSelectedStudentProfileId(null)} /> : renderCurrentPage()}
            </div>
          </main>
        </div>
      </div>

      <MobileSidebar activeTab={activeTab} onNavigate={setActiveTab} isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-4 border-t border-[#D5EADB] bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-6px_20px_rgba(15,70,40,0.08)] backdrop-blur md:hidden">
        {mobileNavItems.map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors ${activeTab === tab ? 'text-[#087F49]' : 'text-slate-500'}`}>
            <span className={`flex h-8 w-9 items-center justify-center rounded-xl ${activeTab === tab ? 'bg-[#E3F7EC]' : ''}`}><Icon size={19} strokeWidth={activeTab === tab ? 2.4 : 1.9}/></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-600">!</div>
            <h2 id="unsaved-title" className="text-base font-bold text-slate-900">Presensi belum disimpan</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Ada perubahan pada absensi atau catatan siswa. Simpan terlebih dahulu agar catatan tidak hilang.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setShowUnsavedDialog(false); setPendingNavigation(null); }} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600">Kembali mengisi</button>
              <button type="button" onClick={discardAndNavigate} className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white">Keluar tanpa simpan</button>
            </div>
          </div>
        </div>
      )}
      {needsTeacherIdentity && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="teacher-identity-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">👤</div>
            <h2 id="teacher-identity-title" className="text-xl font-bold text-slate-900">Lengkapi Identitas</h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-500">Lengkapi identitas Anda terlebih dahulu untuk menggunakan SIMPATIK.</p>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Nama Lengkap</span><input autoComplete="name" value={identityForm.fullName} onChange={event => setIdentityForm(form => ({ ...form, fullName: event.target.value }))} placeholder="Masukkan nama lengkap" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Nama Panggilan</span><input value={identityForm.nickname} onChange={event => setIdentityForm(form => ({ ...form, nickname: event.target.value }))} placeholder="Nama panggilan" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Jabatan</span><select value={identityForm.position} onChange={event => setIdentityForm(form => ({ ...form, position: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option value="">Pilih jabatan</option>{['Kepala Sekolah','Wakasek Kesiswaan','Sarpras','Waka Kurikulum','Guru','TU'].map(position => <option key={position} value={position}>{position}</option>)}</select></label>
            </div>
            {identityError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{identityError}</p>}
            <button type="button" disabled={identitySaving || !identityForm.fullName.trim() || !identityForm.nickname.trim() || !identityForm.position} onClick={saveTeacherIdentity} className="mt-5 w-full rounded-xl bg-[#087F49] px-4 py-3 font-bold text-white shadow-sm transition hover:bg-[#06683B] disabled:cursor-not-allowed disabled:opacity-50">{identitySaving ? 'Menyimpan…' : 'Simpan Identitas'}</button>
          </div>
        </div>
      )}
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
