import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';

export const StudentJournalPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { studentJournals, students, subjects, classes } = useData();
  const [filterStudent, setFilterStudent] = useState('Semua');
  const [filterSubject, setFilterSubject] = useState('Semua');
  const [filterClass, setFilterClass] = useState('Semua');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const entries = useMemo(() => studentJournals
    .filter((entry) => filterStudent === 'Semua' || entry.studentId === filterStudent)
    .filter((entry) => filterSubject === 'Semua' || entry.subject === filterSubject)
    .filter((entry) => filterClass === 'Semua' || entry.className === filterClass)
    .filter((entry) => !dateFrom || entry.date >= dateFrom)
    .filter((entry) => !dateTo || entry.date <= dateTo)
    .filter((entry) => !search || entry.note.toLocaleLowerCase('id-ID').includes(search.toLocaleLowerCase('id-ID')) || entry.studentName.toLocaleLowerCase('id-ID').includes(search.toLocaleLowerCase('id-ID')))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [studentJournals, filterStudent, filterSubject, filterClass, dateFrom, dateTo, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        <button type="button" onClick={onBack} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Jurnal Pembelajaran Guru</button>
        <span className="rounded-xl bg-[#E3F7EC] px-4 py-2 text-xs font-bold text-[#076B3A]">Jurnal Siswa</span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Catatan Jurnal Siswa</h2>
          <p className="mt-1 text-xs text-slate-500">Catatan yang ditulis pada kolom Keterangan di halaman Presensi Siswa</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">Nama Siswa
            <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
              <option value="Semua">Semua Siswa</option>
              {students.filter((s) => s.status === 'Aktif').sort((a,b) => a.name.localeCompare(b.name)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Mata Pelajaran
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
              <option value="Semua">Semua Mapel</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Kelas
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">
              <option value="Semua">Semua Kelas</option>
              {classes.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Dari Tanggal
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
          </label>
          <label className="text-xs font-semibold text-slate-600">Sampai Tanggal
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
          </label>
          <label className="text-xs font-semibold text-slate-600">Cari Catatan
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari isi catatan..." className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Riwayat Catatan</h3>
        <span className="rounded-full bg-[#E3F7EC] px-3 py-1 text-xs font-bold text-[#076B3A]">{entries.length} Catatan</span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-600">Belum ada catatan jurnal siswa</p>
          <p className="mt-1 text-xs text-slate-400">Isi kolom Keterangan pada Presensi Siswa, lalu tekan Simpan Presensi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{entry.studentName}</h4>
                  <p className="mt-0.5 text-xs text-slate-500">Kelas {entry.className} · {entry.subject}</p>
                </div>
                <time className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{new Date(entry.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F5FAF7] p-3 text-sm leading-6 text-slate-700">{entry.note}</p>
              <p className="mt-2 text-[11px] text-slate-400">Dicatat oleh {entry.teacherName}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
