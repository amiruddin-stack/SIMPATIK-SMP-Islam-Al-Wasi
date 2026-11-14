import React from 'react';
import { GraduationCap, UserRound, ClipboardList, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const MorePage: React.FC = () => {
  const registrationUrl = new URL(window.location.href);
  registrationUrl.search = '?daftar=siswa';
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#D5EADB] bg-gradient-to-br from-[#F3FBF6] to-white p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DFF6E9] text-[#087F49]"><GraduationCap size={29}/></div>
          <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#0B8F4D]">Layanan siswa</p><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">SIMPATIK for Student</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Ruang khusus siswa SMP Islam Al-Wasi’ yang terhubung dengan SIMPATIK sekolah.</p></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D5EADB] bg-white p-4"><UserRound className="text-[#0B8F4D]" size={22}/><h3 className="mt-2 font-extrabold text-slate-800">Profil</h3><p className="mt-1 text-xs leading-5 text-slate-500">Data diri dan informasi siswa setelah akun disetujui.</p></div>
          <div className="rounded-2xl border border-[#D5EADB] bg-white p-4"><ClipboardList className="text-[#0B8F4D]" size={22}/><h3 className="mt-2 font-extrabold text-slate-800">Ujian</h3><p className="mt-1 text-xs leading-5 text-slate-500">Akses ujian siswa melalui layanan SIMPATIK.</p></div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800"><ShieldCheck size={17} className="mt-0.5 shrink-0"/>Pendaftaran harus disetujui admin sekolah sebelum akun siswa dapat digunakan.</div>
        <a href={registrationUrl.toString()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B8F4D] px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#087640] sm:w-auto">Pendaftaran Siswa <ArrowUpRight size={17}/></a>
      </div>
      <p className="text-center text-xs text-slate-400">SIMPATIK · SMP Islam Al-Wasi’ · Qurani, Ramah Anak dan Berkarakter</p>
    </section>
  );
};
