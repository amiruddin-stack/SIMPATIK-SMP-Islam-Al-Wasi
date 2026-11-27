import React, { useState } from 'react';
import { ArrowLeft, FileText, MonitorSmartphone, Printer } from 'lucide-react';
import { ExamPage } from './ExamPage';
import { GoogleFormExamPage } from './GoogleFormExamPage';
import { ExamCardsPage } from './ExamCardsPage';

type ExamSection = 'home' | 'simpatik' | 'gform' | 'cards';

export const ExamHubPage: React.FC<{ section: ExamSection; onSectionChange: (section: ExamSection) => void }> = ({ section, onSectionChange }) => {

  if (section === 'simpatik') {
    return <section className="space-y-4">
      <button type="button" onClick={() => onSectionChange('home')} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#087F49] hover:bg-[#E3F7EC]"><ArrowLeft size={18}/> Kembali ke Ujian</button>
      <ExamPage onBack={() => onSectionChange('home')} hideBanner />
    </section>;
  }
  if (section === 'gform') {
    return <GoogleFormExamPage />;
  }
  if (section === 'cards') {
    return <section className="space-y-4">
      <button type="button" onClick={() => onSectionChange('home')} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#087F49] hover:bg-[#E3F7EC]"><ArrowLeft size={18}/> Kembali ke Ujian</button>
      <ExamCardsPage />
    </section>;
  }

  return <section className="mx-auto max-w-5xl space-y-5">
    <p className="text-sm text-slate-500">Pilih layanan ujian yang akan dibuka.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button type="button" onClick={() => onSectionChange('simpatik')} className="group rounded-2xl border border-[#BFE8CF] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#16B364] hover:shadow-md sm:p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3F7EC] text-[#087F49]"><MonitorSmartphone size={25}/></span>
        <span className="mt-4 block text-lg font-extrabold text-slate-800">Ujian SIMPATIK</span>
        <span className="mt-2 block text-sm leading-6 text-slate-500">Kelola ujian dari sistem SIMPATIK, termasuk seluruh fitur ujian yang sudah tersedia saat ini.</span>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#087F49]">Buka Ujian SIMPATIK <FileText size={16}/></span>
      </button>
      <button type="button" onClick={() => onSectionChange('gform')} className="group rounded-2xl border border-[#C9DDF8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md sm:p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><FileText size={25}/></span>
        <span className="mt-4 block text-lg font-extrabold text-slate-800">Ujian G-Form</span>
        <span className="mt-2 block text-sm leading-6 text-slate-500">Buat, atur jadwal, pratinjau, dan kelola ujian yang menggunakan Google Forms.</span>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">Buka Ujian G-Form <FileText size={16}/></span>
      </button>
      <button type="button" onClick={() => onSectionChange('cards')} className="group rounded-2xl border border-[#D5EADB] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#16B364] hover:shadow-md sm:p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3F7EC] text-[#087F49]"><Printer size={25}/></span>
        <span className="mt-4 block text-lg font-extrabold text-slate-800">Cetak Kartu Ujian</span>
        <span className="mt-2 block text-sm leading-6 text-slate-500">Pilih kelas, cari siswa, dan cetak kartu peserta berisi nama, kelas, serta NISN.</span>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#087F49]">Buka Cetak Kartu <Printer size={16}/></span>
      </button>
    </div>
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">Menu Ujian Form yang lama di navigasi utama tetap dipertahankan sementara selama masa uji coba. Menu tersebut tidak dihapus atau dinonaktifkan.</p>
  </section>;
};
