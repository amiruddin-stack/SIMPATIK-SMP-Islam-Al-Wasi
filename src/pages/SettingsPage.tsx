import React from 'react';
import { BookOpen, Building2, GraduationCap, HeartHandshake, MapPin, Phone, School, Sparkles, Target } from 'lucide-react';
import { useData } from '../context/DataContext';
import { initialSchoolSetting } from '../data/initialData';

export const SettingsPage: React.FC = () => {
  const { settings, extracurriculars } = useData();
  const schoolName = settings.schoolName || 'SMP Islam Al-Wasi’';
  const schoolNpsn = initialSchoolSetting.npsn;
  const schoolPrincipal = initialSchoolSetting.principal;
  const address = [settings.address, settings.subdistrict, settings.district, settings.province, settings.postalCode]
    .filter(Boolean)
    .join(', ');
  const programs = [...new Set([
    'Tahfidz Al-Qur’an',
    'BTQ (Baca Tulis Al-Qur’an)',
    'Bahasa Arab (Al-Muhadatsatul Yaumiyah)',
    ...extracurriculars,
  ])];

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-6">
      <section className="overflow-hidden rounded-3xl border border-[#D5EADB] bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#087F49] via-[#0B8F4D] to-[#075B38] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full border-[24px] border-white/10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15">
              <School size={34} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">Profil Sekolah</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{schoolName}</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-50">Qurani, Ramah Anak dan Berkarakter</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><MapPin size={19}/></span>
            <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Alamat Sekolah</p><p className="mt-1 text-sm leading-6 text-slate-700">{address || 'Informasi alamat belum tersedia'}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><Building2 size={19}/></span>
            <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">NPSN</p><p className="mt-1 text-sm font-semibold text-slate-700">{schoolNpsn}</p></div>
          </div>
          {schoolPrincipal && (
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><GraduationCap size={19}/></span>
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Kepala Sekolah</p><p className="mt-1 text-sm font-semibold text-slate-700">{schoolPrincipal}</p></div>
            </div>
          )}
          {(settings.phone || settings.email) && (
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><Phone size={19}/></span>
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Kontak Sekolah</p>{settings.phone && <p className="mt-1 text-sm text-slate-700">{settings.phone}</p>}{settings.email && <p className="text-sm text-slate-700">{settings.email}</p>}</div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[#D5EADB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><Sparkles size={20}/></span>
            <h3 className="text-base font-extrabold text-slate-800">Visi Sekolah</h3>
          </div>
          <p className="text-sm leading-7 text-slate-700">Qurani, Ramah Anak dan Berkarakter.</p>
        </article>
        <article className="rounded-2xl border border-[#D5EADB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><HeartHandshake size={20}/></span>
            <h3 className="text-base font-extrabold text-slate-800">Misi Sekolah</h3>
          </div>
          <p className="text-sm leading-6 text-slate-500">Rumusan misi resmi sekolah belum dicantumkan.</p>
        </article>
        <article className="rounded-2xl border border-[#D5EADB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><Target size={20}/></span>
            <h3 className="text-base font-extrabold text-slate-800">Tujuan Sekolah</h3>
          </div>
          <p className="text-sm leading-6 text-slate-500">Tujuan resmi sekolah belum dicantumkan.</p>
        </article>
        <article className="rounded-2xl border border-[#D5EADB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F7EC] text-[#087F49]"><BookOpen size={20}/></span>
            <h3 className="text-base font-extrabold text-slate-800">Program Sekolah</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {programs.map((program) => <span key={program} className="rounded-full bg-[#F0F9F3] px-3 py-1.5 text-xs font-semibold text-[#087F49]">{program}</span>)}
          </div>
        </article>
      </section>
    </div>
  );
};
