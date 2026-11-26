import React, { useEffect, useState } from 'react';
import { UserRound, Mail, Save, BriefcaseBusiness } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const positions = ['Kepala Sekolah', 'Wakasek Kesiswaan', 'Sarpras', 'Waka Kurikulum', 'Guru', 'TU'];

export const AccountPage: React.FC = () => {
  const { currentUser, updateTeacherIdentity } = useAuth();
  const [form, setForm] = useState({ fullName: '', nickname: '', position: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setForm({ fullName: currentUser?.fullName || currentUser?.displayName || '', nickname: currentUser?.nickname || '', position: currentUser?.position || '' });
  }, [currentUser?.uid, currentUser?.fullName, currentUser?.nickname, currentUser?.position, currentUser?.displayName]);
  const save = async () => {
    setSaving(true); setNotice(''); setError('');
    try {
      await updateTeacherIdentity(form);
      setNotice('Identitas akun berhasil diperbarui.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identitas gagal disimpan. Coba kembali.');
    } finally { setSaving(false); }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <section className="overflow-hidden rounded-3xl border border-[#D5EADB] bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#087F49] to-[#075B38] px-5 py-6 text-white sm:px-7">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><UserRound size={25}/></div><div><p className="text-xs font-semibold text-emerald-100">Pengaturan</p><h2 className="text-xl font-black">Akun Saya</h2></div></div>
          <p className="mt-3 text-sm text-emerald-50">Kelola identitas yang ditampilkan di SIMPATIK.</p>
        </div>
        <div className="space-y-4 p-5 sm:p-7">
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Nama Lengkap</span><input value={form.fullName} onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} autoComplete="name" placeholder="Nama lengkap" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Nama Panggilan</span><input value={form.nickname} onChange={e=>setForm(p=>({...p,nickname:e.target.value}))} placeholder="Nama panggilan" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></label>
          <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Jabatan</span><span className="relative block"><BriefcaseBusiness className="absolute left-3 top-3.5 text-slate-400" size={17}/><select value={form.position} onChange={e=>setForm(p=>({...p,position:e.target.value}))} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option value="">Pilih jabatan</option>{positions.map(p=><option key={p} value={p}>{p}</option>)}</select></span></label>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-500"><Mail size={15}/>Email akun sekolah</p><p className="break-all text-sm font-semibold text-slate-700">{currentUser?.email || '-'}</p><p className="mt-1 text-[11px] text-slate-400">Email login tidak dapat diubah dari halaman ini.</p></div>
          {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{notice}</p>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button type="button" disabled={saving || !form.fullName.trim() || !form.nickname.trim() || !form.position} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F49] px-4 py-3 text-sm font-bold text-white hover:bg-[#06683B] disabled:cursor-not-allowed disabled:opacity-50"><Save size={17}/>{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
        </div>
      </section>
    </div>
  );
};
