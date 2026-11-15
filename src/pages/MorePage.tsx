import React, { useState } from 'react';
import { GraduationCap, Share2, ArrowUpRight, ChevronRight } from 'lucide-react';

export const MorePage: React.FC = () => {
  const [notice, setNotice] = useState('');
  const studentUrl = new URL(window.location.href);
  studentUrl.search = '';
  studentUrl.hash = '';
  studentUrl.searchParams.set('student', '1');

  const shareWeb = async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.search = '';
    shareUrl.hash = '';
    const shareData = {
      title: 'SIMPATIK SMP Islam Al-Wasi’',
      text: 'Akses SIMPATIK SMP Islam Al-Wasi’.',
      url: shareUrl.toString(),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        setNotice('Tautan SIMPATIK berhasil disalin.');
      } else {
        setNotice('Salin tautan dari alamat web aplikasi.');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setNotice('Tautan belum dapat dibagikan. Silakan coba kembali.');
      }
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-3">
      <p className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Layanan SIMPATIK</p>
      <a href={studentUrl.toString()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-[#D5EADB] bg-white p-4 shadow-sm transition hover:border-[#8ED6AE] hover:bg-[#F7FCF9]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E3F7EC] text-[#087F49]"><GraduationCap size={25}/></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-800">SIMPATIK for Student</span><span className="mt-1 block text-xs text-slate-500">Cabang SIMPATIK khusus siswa</span></span>
        <ArrowUpRight size={19} className="shrink-0 text-[#087F49]"/>
      </a>
      <button type="button" onClick={() => void shareWeb()} className="flex w-full items-center gap-3 rounded-2xl border border-[#E2E8E5] bg-white p-4 text-left shadow-sm transition hover:border-[#8ED6AE] hover:bg-[#F7FCF9]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><Share2 size={23}/></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-800">Bagikan Web</span><span className="mt-1 block text-xs text-slate-500">Bagikan tautan SIMPATIK kepada orang lain</span></span>
        <ChevronRight size={19} className="shrink-0 text-slate-400"/>
      </button>
      {notice && <p role="status" className="rounded-xl bg-[#E3F7EC] px-4 py-3 text-xs font-semibold text-[#087640]">{notice}</p>}
    </section>
  );
};
