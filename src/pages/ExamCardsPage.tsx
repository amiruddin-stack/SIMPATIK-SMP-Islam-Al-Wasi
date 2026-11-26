import React, { useMemo, useState } from 'react';
import { Printer, Users, Search } from 'lucide-react';
import { useData } from '../context/DataContext';

export const ExamCardsPage: React.FC = () => {
  const { students, classes } = useData();
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');

  const classOptions = useMemo(() => [...new Set([...classes, ...students.map(s => s.className).filter(Boolean)])].sort(), [classes, students]);
  const eligibleStudents = useMemo(() => students
    .filter(student => student.status === 'Aktif' && student.name?.trim() && student.className?.trim())
    .sort((a, b) => a.name.localeCompare(b.name, 'id')), [students]);
  const visibleStudents = eligibleStudents.filter(student =>
    (!selectedClass || student.className === selectedClass) &&
    (!search || student.name.toLocaleLowerCase('id-ID').includes(search.toLocaleLowerCase('id-ID')) || student.nisn?.includes(search))
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#D5EADB] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Cetak Kartu Ujian</h2>
            <p className="mt-1 text-sm text-slate-500">Kartu peserta berisi nama siswa, kelas, dan NISN. Data diambil dari daftar siswa aktif SIMPATIK.</p>
          </div>
          <button type="button" onClick={() => window.print()} disabled={!visibleStudents.length} className="inline-flex items-center gap-2 rounded-xl bg-[#087F49] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#06663A] disabled:cursor-not-allowed disabled:opacity-50">
            <Printer size={17}/> Cetak {visibleStudents.length ? `(${visibleStudents.length})` : ''}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            Pilih Kelas
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#16B364]">
              <option value="">Semua Kelas</option>
              {classOptions.map(className => <option key={className} value={className}>{className}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-600">
            Cari Nama / NISN
            <span className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ketik nama atau NISN" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:border-[#16B364]"/>
            </span>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F3FAF6] px-3 py-2 text-xs font-semibold text-[#087F49]">
          <Users size={16}/> {visibleStudents.length} siswa ditampilkan · Hanya siswa berstatus Aktif
        </div>
      </section>

      <section className="exam-card-preview grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStudents.map(student => (
          <article key={student.id} className="exam-card relative overflow-hidden rounded-xl border border-[#CDE5D5] bg-white p-4 shadow-sm">
            <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full border-[12px] border-[#E3F7EC]"/>
            <div className="relative flex items-center gap-2 border-b border-[#D9EEE2] pb-2">
              <img src={`${import.meta.env.BASE_URL}logo-alwasi.png`} alt="Logo SMP Islam Al-Wasi’" className="h-10 w-10 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-800">SMP Islam Al-Wasi’</p>
                <p className="text-[9px] font-bold tracking-wider text-[#087F49]">KARTU PESERTA UJIAN</p>
              </div>
            </div>
            <div className="relative mt-3 space-y-2.5">
              <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Nama Siswa</p><p className="break-words text-sm font-extrabold text-slate-900">{student.name}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Kelas</p><p className="text-xs font-bold text-slate-800">{student.className}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">NISN</p><p className="text-xs font-bold tracking-wide text-slate-800">{student.nisn || '—'}</p></div>
              </div>
            </div>
            <p className="relative mt-3 border-t border-[#D9EEE2] pt-2 text-center text-[8px] font-semibold tracking-widest text-slate-400">SIMPATIK · SMP ISLAM AL-WASI’</p>
          </article>
        ))}
        {!visibleStudents.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">Tidak ada siswa aktif yang cocok dengan pilihan kelas atau pencarian.</div>}
      </section>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .exam-card-preview, .exam-card-preview * { visibility: visible !important; }
          .exam-card-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 190mm !important;
            display: grid !important;
            grid-template-columns: 90mm 90mm !important;
            gap: 8mm 10mm !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .exam-card {
            width: 90mm !important;
            height: 55mm !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 0.4mm solid #A7D7B7 !important;
            border-radius: 3mm !important;
            box-shadow: none !important;
            padding: 5mm !important;
            overflow: hidden !important;
          }
          .exam-card-preview { break-inside: auto !important; }
          .exam-card:nth-child(8n+1):not(:first-child) { break-before: page !important; page-break-before: always !important; }
        }
      `}</style>
    </div>
  );
};
