import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, UserRound, ClipboardCheck, BookOpen, HeartHandshake, GraduationCap } from 'lucide-react';
import { useData } from '../context/DataContext';
import { AttendanceStatus } from '../types';

type ProfileTab = 'biodata' | 'attendance' | 'journal' | 'ils' | 'grades';
const tabs: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
  { id: 'biodata', label: 'Biodata', icon: UserRound },
  { id: 'attendance', label: 'Rekap Kehadiran', icon: CalendarDays },
  { id: 'journal', label: 'Rekap Jurnal', icon: BookOpen },
  { id: 'ils', label: 'Islamic Life Skill', icon: HeartHandshake },
  { id: 'grades', label: 'Rekap Nilai', icon: GraduationCap },
];
const academicYearFromDate = (date: string) => {
  const [year, month] = date.split('-').map(Number);
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};
const statusTone: Record<AttendanceStatus, string> = {
  Hadir: 'bg-emerald-50 text-emerald-700',
  Sakit: 'bg-amber-50 text-amber-700',
  Izin: 'bg-blue-50 text-blue-700',
  Alpa: 'bg-rose-50 text-rose-700',
};

export const StudentProfilePage: React.FC<{ studentId: string; onBack: () => void }> = ({ studentId, onBack }) => {
  const { students, attendances, studentJournals, assessments, settings } = useData();
  const student = students.find(item => item.id === studentId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('biodata');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(settings.activeSemester || 'Ganjil');
  const availableYears = useMemo(() => Array.from(new Set([
    ...attendances.map(item => item.academicYear),
    ...assessments.map(item => item.academicYear),
    ...studentJournals.map(item => academicYearFromDate(item.date)),
    settings.activeAcademicYear,
  ].filter(Boolean))).sort().reverse(), [attendances, assessments, studentJournals, settings.activeAcademicYear]);
  const [academicYear, setAcademicYear] = useState(settings.activeAcademicYear);
  const attendanceRows = attendances.filter(item => item.academicYear === academicYear && item.semester === semester && item.records?.[studentId]).sort((a,b) => b.date.localeCompare(a.date));
  const journalRows = studentJournals.filter(item => academicYearFromDate(item.date) === academicYear && (Number(item.date.slice(5,7)) >= 7 ? 'Ganjil' : 'Genap') === semester && item.studentId === studentId).sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const gradeRows = assessments.filter(item => item.academicYear === academicYear && item.semester === semester && item.scores?.[studentId]).sort((a,b) => a.subject.localeCompare(b.subject) || a.date.localeCompare(b.date));
  const attendanceTotals = attendanceRows.reduce((totals, item) => {
    const status = item.records[studentId];
    if (status) totals[status] = (totals[status] || 0) + 1;
    return totals;
  }, { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 } as Record<AttendanceStatus, number>);
  const groupedGrades = gradeRows.reduce<Record<string, typeof gradeRows>>((groups, item) => {
    (groups[item.subject] ||= []).push(item);
    return groups;
  }, {});

  if (!student) return <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><p className="font-bold text-slate-800">Profil siswa tidak ditemukan.</p><button type="button" onClick={onBack} className="mt-4 rounded-xl bg-[#E3F7EC] px-4 py-2 text-sm font-bold text-[#087F49]">Kembali</button></section>;

  return <div className="space-y-4">
    <header className="flex items-center gap-3 rounded-2xl border border-[#D5EADB] bg-white p-4">
      <button type="button" onClick={onBack} aria-label="Kembali" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E3F7EC] text-[#087F49]"><ArrowLeft size={19}/></button>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E3F7EC] text-lg font-black text-[#087F49]">{student.name.trim().charAt(0)}</div>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-[#087F49]">Profil Siswa</p><h1 className="truncate text-lg font-extrabold text-slate-900">{student.name}</h1><p className="text-xs text-slate-500">{student.className} · {student.status}</p></div>
    </header>

    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-h-[64px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${activeTab === tab.id ? 'border-[#16B364] bg-[#E3F7EC] text-[#087F49]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Icon size={17} className="shrink-0"/><span>{tab.label}</span></button>; })}
    </nav>

    {activeTab !== 'biodata' && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <label className="flex-1 text-xs font-semibold text-slate-600">Tahun Ajaran<select value={academicYear} onChange={event => setAcademicYear(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">{availableYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>
      <label className="flex-1 text-xs font-semibold text-slate-600">Semester<select value={semester} onChange={event => setSemester(event.target.value as 'Ganjil' | 'Genap')} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select></label>
    </div>}

    {activeTab === 'biodata' && <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><h2 className="mb-4 font-extrabold text-slate-900">Biodata Siswa</h2><div className="grid gap-3 sm:grid-cols-2">{[
      ['Nama Lengkap', student.name], ['NIS', student.nis || 'Belum diisi'], ['NISN', student.nisn || 'Belum diisi'], ['Kelas', student.className], ['Jenis Kelamin', student.gender === 'L' ? 'Laki-laki' : 'Perempuan'], ['Status', student.status], ['Nama Orang Tua/Wali', student.parentName || 'Belum diisi'], ['Nomor HP Orang Tua/Wali', student.parentPhone || 'Belum diisi'],
    ].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-800">{value}</p></div>)}</div></section>}

    {activeTab === 'attendance' && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div><h2 className="font-extrabold text-slate-900">Rekap Kehadiran</h2><p className="text-xs text-slate-500">{academicYear} · Semester {semester}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(['Hadir','Sakit','Izin','Alpa'] as AttendanceStatus[]).map(status => <div key={status} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">{status}</p><p className="mt-1 text-2xl font-black text-slate-800">{attendanceTotals[status]}</p></div>)}</div><div className="overflow-x-auto"><table className="w-full min-w-[460px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Tanggal</th><th className="p-3">Mata Pelajaran</th><th className="p-3">Kehadiran</th><th className="p-3">Catatan</th></tr></thead><tbody className="divide-y">{attendanceRows.map(item => <tr key={item.id}><td className="p-3">{item.date}</td><td className="p-3">{item.subject || '—'}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusTone[item.records[studentId]]}`}>{item.records[studentId]}</span></td><td className="p-3 text-slate-600">{item.notes?.[studentId] || '—'}</td></tr>)}</tbody></table>{!attendanceRows.length && <p className="p-6 text-center text-sm text-slate-500">Belum ada rekap kehadiran pada semester ini.</p>}</div></section>}

    {activeTab === 'journal' && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div><h2 className="font-extrabold text-slate-900">Rekap Jurnal Siswa</h2><p className="text-xs text-slate-500">{academicYear} · Semester {semester}</p></div>{journalRows.length ? journalRows.map(item => <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-bold text-slate-800">{item.subject}</p><time className="text-xs text-slate-500">{item.date}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.note}</p><p className="mt-2 text-xs text-slate-500">Dicatat oleh {item.teacherName}</p></article>) : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Belum ada catatan jurnal siswa pada semester ini.</p>}</section>}

    {activeTab === 'ils' && <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex items-center gap-2"><HeartHandshake className="text-[#087F49]" size={20}/><h2 className="font-extrabold text-slate-900">Progres Islamic Life Skill</h2></div><p className="text-xs text-slate-500">{academicYear} · Semester {semester}</p><div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-800">Data progres Islamic Life Skill per siswa belum tersedia pada sumber data SIMPATIK saat ini. Bagian ini akan menampilkan progres setelah data penilaian ILS tersimpan per siswa dan per semester. Tidak ada data simulasi yang ditampilkan sebagai hasil nyata.</div></section>}

    {activeTab === 'grades' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div><h2 className="font-extrabold text-slate-900">Rekap Nilai per Mata Pelajaran</h2><p className="text-xs text-slate-500">{academicYear} · Semester {semester}</p></div>{Object.keys(groupedGrades).length ? Object.entries(groupedGrades).map(([subject,items]) => { const average = items.reduce((sum,item) => sum + item.scores[studentId].score,0) / items.length; return <div key={subject} className="overflow-hidden rounded-xl border border-slate-200"><div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3"><h3 className="text-sm font-extrabold text-slate-800">{subject}</h3><span className="text-xs font-bold text-[#087F49]">Rata-rata {average.toFixed(1)}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="p-3">Penilaian</th><th className="p-3">Tanggal</th><th className="p-3">Nilai</th><th className="p-3">Keterangan</th></tr></thead><tbody className="divide-y">{items.map(item => <tr key={item.id}><td className="p-3">{item.assessmentType}</td><td className="p-3">{item.date}</td><td className="p-3 font-bold">{item.scores[studentId].score}</td><td className="p-3 text-slate-600">{item.scores[studentId].note || '—'}</td></tr>)}</tbody></table></div></div>; }) : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Belum ada nilai yang tersimpan pada semester ini.</p>}</section>}
  </div>;
};
