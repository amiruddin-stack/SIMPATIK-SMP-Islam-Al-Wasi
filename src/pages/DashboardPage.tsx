import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { NavTab } from '../components/layout/Sidebar';
import { getClassLevel } from '../lib/classes';
import { useAuth } from '../context/AuthContext';

type PrayerLevel = 'Lancar' | 'Cukup Lancar' | 'Perlu Bimbingan';

const attendanceColors: Record<string, string> = {
  Hadir: '#0B8F4D',
  Izin: '#E9A23B',
  Sakit: '#3985D6',
  Alpa: '#E05252',
};

const prayerColors: Record<PrayerLevel, string> = {
  Lancar: '#0B8F4D',
  'Cukup Lancar': '#E9A23B',
  'Perlu Bimbingan': '#3985D6',
};

function demoPrayerLevel(studentId: string): PrayerLevel {
  const seed = [...studentId].reduce((total, char) => total + char.charCodeAt(0), 0) % 10;
  return seed < 5 ? 'Lancar' : seed < 8 ? 'Cukup Lancar' : 'Perlu Bimbingan';
}

function localDateString() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

export const DashboardPage: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const { students, attendances, behaviors, studentJournals, settings } = useData();
  const { currentUser } = useAuth();
  const [showAbsent, setShowAbsent] = useState(false);
  const today = localDateString();
  const activeStudents = students.filter(student => student.status === 'Aktif');

  const todayRecords = attendances.filter(record =>
    record.date === today &&
    record.academicYear === settings.activeAcademicYear &&
    record.semester === settings.activeSemester
  );

  const attendanceTotals = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
  const absentMap = new Map<string, { student: typeof activeStudents[number]; status: string }>();
  todayRecords.forEach(record => {
    Object.entries(record.records || {}).forEach(([studentId, status]) => {
      if (status in attendanceTotals) attendanceTotals[status as keyof typeof attendanceTotals]++;
      if (status !== 'Hadir') {
        const student = activeStudents.find(item => item.id === studentId);
        if (student) absentMap.set(studentId, { student, status });
      }
    });
  });
  const attendanceTotal = Object.values(attendanceTotals).reduce((sum, count) => sum + count, 0);
  const attendanceGradient = attendanceTotal
    ? (() => {
        let start = 0;
        return Object.entries(attendanceTotals).map(([status, count]) => {
          const from = start;
          start += count / attendanceTotal * 100;
          return `${attendanceColors[status]} ${from}% ${start}%`;
        }).join(', ');
      })()
    : '#E8EEF0 0% 100%';

  const prayerStats = useMemo(() => {
    const levels: PrayerLevel[] = ['Lancar', 'Cukup Lancar', 'Perlu Bimbingan'];
    return ['VII', 'VIII', 'IX'].map(level => {
      const roster = activeStudents.filter(student => getClassLevel(student.className) === level);
      const counts = levels.reduce((acc, item) => {
        acc[item] = roster.filter(student => demoPrayerLevel(student.id) === item).length;
        return acc;
      }, {} as Record<PrayerLevel, number>);
      const total = roster.length || 1;
      return {
        label: `Kelas ${level}`,
        total: roster.length,
        counts,
        percentages: levels.reduce((acc, item) => {
          acc[item] = Math.round(counts[item] / total * 100);
          return acc;
        }, {} as Record<PrayerLevel, number>),
      };
    });
  }, [students]);

  const problemBehaviors = behaviors
    .filter(item => item.category !== 'Perilaku Positif' && (item.points ?? -1) < 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  const recentStudentNotes = [...studentJournals]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const absentStudents = Array.from(absentMap.values()).sort((a, b) => a.student.name.localeCompare(b.student.name));

  const attendanceWarnings = activeStudents.map(student => {
    const sessions = attendances.filter(record =>
      record.academicYear === settings.activeAcademicYear &&
      record.semester === settings.activeSemester &&
      Object.prototype.hasOwnProperty.call(record.records || {}, student.id)
    );
    if (sessions.length < 5) return null;
    const present = sessions.filter(record => record.records[student.id] === 'Hadir').length;
    const rate = Math.round(present / sessions.length * 100);
    return rate <= 75 ? { student, rate, sessions: sessions.length } : null;
  }).filter((item): item is { student: typeof activeStudents[number]; rate: number; sessions: number } => item !== null)
    .sort((a, b) => a.rate - b.rate);

  const frequentCases = useMemo(() => {
    const counts = new Map<string, { studentName: string; className: string; count: number; latest: string }>();
    problemBehaviors.forEach(item => {
      const previous = counts.get(item.studentId);
      counts.set(item.studentId, {
        studentName: item.studentName,
        className: item.className,
        count: (previous?.count || 0) + 1,
        latest: !previous || item.date > previous.latest ? item.date : previous.latest,
      });
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest));
  }, [behaviors]);

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-800 antialiased">
      <section className="relative w-full bg-white pb-2 pt-1">
        <div className="mx-auto flex min-h-[112px] max-w-[1240px] items-center justify-between gap-3 px-4 py-4 sm:min-h-[132px] sm:gap-5 sm:px-6 md:min-h-[150px] md:px-8 lg:py-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black tracking-tight text-[#087F49] sm:text-4xl md:text-5xl lg:text-6xl">SIMPATIK</h1>
            <p className="mt-1 text-[10px] font-semibold leading-snug text-slate-700 sm:mt-2 sm:text-xs md:text-sm lg:text-[15px]">Sistem Informasi Manajemen &amp; Pembelajaran SMPI Al-Wasi</p>
            <p className="mt-1 text-[9px] font-medium text-slate-500 sm:text-[11px] md:text-xs lg:text-sm">Terpadu, Interaktif dan Kolaboratif</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 sm:gap-2">
            <div className="max-w-[150px] truncate rounded-full border border-[#D5EADB] bg-[#F4FBF6] px-2.5 py-1 text-[10px] font-bold text-[#087F49] sm:max-w-[220px] sm:px-3 sm:text-xs md:max-w-[260px]">{currentUser?.fullName || currentUser?.displayName || 'Guru'}</div>
            <img src={`${import.meta.env.BASE_URL}images/file_00000000eb048211946c4f7244fe33ac.png`} alt="Ilustrasi pembelajaran digital SIMPATIK" className="h-16 w-24 object-contain sm:h-24 sm:w-36 md:h-32 md:w-44 lg:h-40 lg:w-56" width="224" height="160" loading="eager" />
          </div>
        </div>
      </section>

<main className="relative z-10 mx-auto max-w-[1240px] space-y-5 px-4 pt-3 pb-24 md:px-8 md:pb-8">
        
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          <section className="overflow-hidden rounded-[24px] border border-[#D5EADB] bg-white shadow-sm">
            <div className="bg-[#E3F7EC] px-5 py-4">
              <h2 className="text-base font-extrabold text-[#076B3A]">Presensi Siswa Hari Ini</h2>
              <p className="mt-1 text-xs text-slate-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-5">
                <div className="relative h-32 w-32 shrink-0 rounded-full sm:h-36 sm:w-36" style={{ background: `conic-gradient(${attendanceGradient})` }}>
                  <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-3xl font-black text-slate-800">{attendanceTotal ? Math.round(attendanceTotals.Hadir / attendanceTotal * 100) : 0}%</span>
                    <span className="text-[10px] font-semibold text-slate-500">Hadir</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {Object.entries(attendanceTotals).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 font-semibold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: attendanceColors[status] }} />{status}</span>
                      <span className="font-extrabold text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{attendanceTotal ? `${attendanceTotal} catatan presensi tercatat hari ini.` : 'Belum ada presensi yang disimpan untuk hari ini.'}</p>
              <button type="button" onClick={() => setShowAbsent(value => !value)} className="mt-4 w-full rounded-xl border border-[#CDE8D7] bg-[#F5FBF7] px-3 py-2.5 text-xs font-bold text-[#087F49] hover:bg-[#E3F7EC]">{showAbsent ? 'Tutup daftar siswa' : 'Lihat siswa tidak hadir'} ({absentStudents.length})</button>
              {showAbsent && <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">{absentStudents.length ? absentStudents.map(item => <div key={item.student.id} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate font-semibold text-slate-700">{item.student.name}<span className="ml-1 font-normal text-slate-400">{item.student.className}</span></span><span className="shrink-0 font-bold" style={{ color: attendanceColors[item.status] }}>{item.status}</span></div>) : <p className="text-center text-xs text-slate-500">Belum ada siswa tidak hadir tercatat.</p>}</div>}
              <button type="button" onClick={() => onNavigate('attendance')} className="mt-3 text-xs font-bold text-[#087F49] hover:underline">Buka presensi lengkap →</button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-[#D5EADB] bg-white shadow-sm">
            <div className="flex items-start justify-between gap-2 bg-[#F1F7FF] px-5 py-4">
              <div><h2 className="text-base font-extrabold text-slate-800">Islamic Life Skill Siswa</h2><p className="mt-1 text-xs text-slate-500">Kemampuan membaca bacaan sholat</p></div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">DATA DEMO</span>
            </div>
            <div className="space-y-4 p-5">
              {prayerStats.map(stat => <div key={stat.label}>
                <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-slate-700">{stat.label}</span><span className="text-[10px] text-slate-400">{stat.total} siswa</span></div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">{(['Lancar','Cukup Lancar','Perlu Bimbingan'] as PrayerLevel[]).map(level => <div key={level} style={{ width: `${stat.percentages[level]}%`, backgroundColor: prayerColors[level] }} title={`${level}: ${stat.percentages[level]}%`} />)}</div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{(['Lancar','Cukup Lancar','Perlu Bimbingan'] as PrayerLevel[]).map(level => <span key={level} className="text-[10px] font-medium text-slate-500">{level}: <b className="text-slate-700">{stat.percentages[level]}%</b></span>)}</div>
              </div>)}
              <div className="border-t border-slate-100 pt-3"><p className="text-[10px] leading-5 text-slate-400">Data simulasi berdasarkan daftar siswa aktif saat ini. Bukan hasil penilaian guru dan belum disimpan ke database.</p></div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-[#F0DFD8] bg-white shadow-sm">
            <div className="bg-[#FFF2ED] px-5 py-4">
              <h2 className="text-base font-extrabold text-[#9A3412]">Jurnal Siswa</h2>
              <p className="mt-1 text-xs text-slate-500">Catatan pelanggaran dan hal yang perlu diperhatikan</p>
            </div>
            <div className="space-y-3 p-5">
              {problemBehaviors.length || recentStudentNotes.length ? <>
                {problemBehaviors.slice(0, 4).map(item => <article key={item.id} className="rounded-xl border border-rose-100 bg-rose-50/60 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-slate-800">{item.studentName}</p><p className="mt-0.5 text-[10px] text-slate-500">{item.className} · {item.category}</p></div><span className="shrink-0 text-[10px] font-bold text-rose-700">{item.date}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{item.description}</p><p className="mt-1 text-[10px] font-semibold text-rose-700">{item.status}</p></article>)}
                {recentStudentNotes.slice(0, Math.max(0, 4 - Math.min(problemBehaviors.length, 4))).map(item => <article key={item.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><p className="text-xs font-extrabold text-slate-800">{item.studentName} <span className="font-medium text-slate-400">· {item.className}</span></p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.note}</p><p className="mt-1 text-[10px] text-slate-400">{item.date} · Catatan guru</p></article>)}
              </> : <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">Belum ada catatan masalah atau pelanggaran siswa.</p>}
              <button type="button" onClick={() => onNavigate('journal')} className="pt-1 text-xs font-bold text-[#087F49] hover:underline">Lihat jurnal siswa →</button>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-amber-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 bg-amber-50 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">!</span><div><h2 className="text-base font-extrabold text-amber-900">Peringatan &amp; Perhatian</h2><p className="text-xs text-amber-800/75">Pantauan kehadiran dan catatan kasus siswa</p></div></div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div><div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold text-slate-800">Kehadiran mendekati 70%</h3><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{attendanceWarnings.length} siswa</span></div>
              {attendanceWarnings.length ? <div className="space-y-2">{attendanceWarnings.slice(0, 6).map(item => <div key={item.student.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{item.student.name}</p><p className="text-[10px] text-slate-500">{item.student.className} · {item.sessions} pertemuan tercatat</p></div><span className="shrink-0 text-sm font-black text-rose-600">{item.rate}%</span></div>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Belum ada siswa dengan kehadiran 75% atau kurang. Peringatan dihitung setelah minimal 5 pertemuan tercatat.</p>}
            </div>
            <div><div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold text-slate-800">Siswa dengan kasus terbanyak</h3><span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">{frequentCases.length} siswa</span></div>
              {frequentCases.length ? <div className="space-y-2">{frequentCases.slice(0, 6).map(item => <div key={item.studentName+item.className} className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{item.studentName}</p><p className="text-[10px] text-slate-500">{item.className} · Terakhir {item.latest}</p></div><span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-700">{item.count} kasus</span></div>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Belum ada catatan pelanggaran siswa.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
