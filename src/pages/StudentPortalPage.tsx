import React from 'react';
import { RegistrationPage } from './MasterDataPage';

export const StudentPortalPage: React.FC = () => (
  <div className="min-h-screen bg-[#F7FBF8]">
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-3 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DFF6E9] text-[#087F49]"><span className="text-xl font-black">S</span></div>
        <div className="text-left"><p className="text-sm font-black tracking-tight text-slate-900">SIMPATIK for Student</p><p className="text-xs text-slate-500">SMP Islam Al-Wasi’</p></div>
      </div>
      <RegistrationPage type="siswa" studentPortal />
      <p className="mt-5 text-center text-[11px] text-slate-400">Cabang resmi SIMPATIK · Qurani, Ramah Anak dan Berkarakter</p>
    </div>
  </div>
);
