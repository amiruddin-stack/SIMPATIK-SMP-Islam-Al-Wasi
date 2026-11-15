import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap, KeyRound, UserPlus } from 'lucide-react';
import { RegistrationPage } from './MasterDataPage';

type StudentView = 'home' | 'register' | 'login';

export const StudentPortalPage: React.FC = () => {
  const [view, setView] = useState<StudentView>('home');
  const [nisn, setNisn] = useState('');
  const [message, setMessage] = useState('');

  if (view === 'register') return (
    <div className="min-h-screen bg-[#F7FBF8] px-3 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => setView('home')} className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#087F49] hover:bg-[#E3F7EC]"><ArrowLeft size={17}/> Kembali</button>
        <RegistrationPage type="siswa" studentPortal />
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7FBF8] px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#D9EEE2] bg-white shadow-[0_18px_55px_rgba(8,127,73,0.09)]">
        <header className="bg-gradient-to-br from-[#0B8F4D] to-[#087640] px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><GraduationCap size={34}/></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">SMP Islam Al-Wasi’</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">SIMPATIK for Student</h1>
          <p className="mt-3 text-sm leading-6 text-white/90">Selamat datang siswa-siswi terbaik SMP Islam Al-Wasi’</p>
        </header>
        <div className="grid gap-3 p-5 sm:p-6">
          <button type="button" onClick={() => { setMessage(''); setView('register'); }} className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9EEE2] p-4 text-left transition hover:border-[#0B8F4D] hover:bg-[#F5FCF7]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><UserPlus size={23}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">Mendaftar</span><span className="mt-1 block text-xs leading-5 text-slate-500">Isi NIS, nama lengkap, dan pilih kelas. Tunggu persetujuan admin.</span></span>
            <ArrowRight className="text-[#087F49]" size={19}/>
          </button>
          <button type="button" onClick={() => { setMessage(''); setView('login'); }} className="group flex w-full items-center gap-4 rounded-2xl border border-[#D9EEE2] p-4 text-left transition hover:border-[#0B8F4D] hover:bg-[#F5FCF7]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><KeyRound size={23}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-slate-800">Masuk</span><span className="mt-1 block text-xs leading-5 text-slate-500">Untuk siswa yang sudah disetujui admin. Masuk menggunakan NISN.</span></span>
            <ArrowRight className="text-[#087F49]" size={19}/>
          </button>
        </div>
        {view === 'login' && <div className="border-t border-[#E7F1EA] px-5 py-5 sm:px-6">
          <div className="mb-3"><h2 className="font-bold text-slate-800">Masuk SIMPATIK for Student</h2><p className="mt-1 text-xs leading-5 text-slate-500">Masukkan NISN. Perangkat akan diingat setelah login berhasil.</p></div>
          <form onSubmit={e => { e.preventDefault(); setMessage('Login siswa sedang menunggu aktivasi layanan verifikasi aman. Pendaftaran dan menu masuk sudah tersedia; akses akan dibuka setelah backend siswa diaktifkan.'); }} className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">NISN<input value={nisn} onChange={e => setNisn(e.target.value.replace(/\D/g,'').slice(0,10))} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="Masukkan 10 digit NISN" className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#E3F7EC]"/></label>
            {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{message}</p>}
            <button type="submit" className="rounded-xl bg-[#0B8F4D] px-4 py-3 font-bold text-white transition hover:bg-[#087640]">Masuk</button>
          </form>
        </div>}
        <footer className="border-t border-[#E7F1EA] px-5 py-4 text-center text-[11px] text-slate-400">Qurani, Ramah Anak dan Berkarakter · SIMPATIK</footer>
      </section>
    </main>
  );
};
