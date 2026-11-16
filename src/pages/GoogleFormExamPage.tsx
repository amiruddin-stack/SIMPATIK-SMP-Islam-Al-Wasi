import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Archive, ExternalLink, FilePlus2, Link2, Pencil, Save, X } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

type FormExam = {
  id: string;
  title: string;
  subject: string;
  className: string;
  formUrl: string;
  startAt: string;
  endAt: string;
  duration: number;
  status: 'Draft' | 'Aktif' | 'Arsip';
  createdAt?: string;
  createdBy?: string;
};

const emptyForm = {
  title: '',
  subject: '',
  className: '',
  formUrl: '',
  startAt: '',
  endAt: '',
  duration: 60,
  status: 'Draft' as const,
};

function getGoogleFormUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!['docs.google.com', 'forms.google.com'].includes(url.hostname)) return null;
    if (!url.pathname.includes('/forms/')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getEmbedUrl(value: string) {
  const url = getGoogleFormUrl(value);
  if (!url) return '';
  const parsed = new URL(url);
  parsed.searchParams.set('embedded', 'true');
  return parsed.toString();
}

export const GoogleFormExamPage: React.FC = () => {
  const { currentUser, firebaseUser } = useAuth();
  const { classes, subjects } = useData();
  const [exams, setExams] = useState<FormExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [previewId, setPreviewId] = useState('');

  const canManage = Boolean(firebaseUser && !firebaseUser.isAnonymous && currentUser &&
    ['super_admin', 'kepala_sekolah', 'operator', 'guru', 'wali_kelas'].includes(currentUser.role || ''));

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    const stop = onSnapshot(collection(db, 'googleFormExams'), snapshot => {
      const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as FormExam));
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setExams(rows);
      setLoading(false);
    }, error => {
      console.error('Gagal memuat Ujian Form:', error);
      setNotice('Data Ujian Form belum dapat dimuat. Periksa koneksi dan aturan akses Firestore.');
      setLoading(false);
    });
    return stop;
  }, [canManage]);

  const validFormUrl = useMemo(() => getGoogleFormUrl(draft.formUrl), [draft.formUrl]);

  const resetForm = () => {
    setDraft({ ...emptyForm, subject: subjects[0] || '', className: classes[0] || '' });
    setEditingId('');
  };

  useEffect(() => {
    if (!draft.subject && subjects.length) setDraft(current => ({ ...current, subject: subjects[0] }));
    if (!draft.className && classes.length) setDraft(current => ({ ...current, className: classes[0] }));
  }, [subjects, classes, draft.subject, draft.className]);

  const saveExam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !draft.title.trim() || !draft.subject || !draft.className || !validFormUrl) {
      setNotice('Lengkapi nama ujian, mata pelajaran, kelas, dan tautan Google Form yang valid.');
      return;
    }
    if (draft.startAt && draft.endAt && new Date(draft.endAt) <= new Date(draft.startAt)) {
      setNotice('Waktu selesai harus lebih akhir daripada waktu mulai.');
      return;
    }
    setSaving(true);
    setNotice('');
    const payload = {
      title: draft.title.trim(),
      subject: draft.subject,
      className: draft.className,
      formUrl: validFormUrl,
      startAt: draft.startAt,
      endAt: draft.endAt,
      duration: Math.max(1, Math.min(300, Number(draft.duration) || 60)),
      status: draft.status,
      updatedAt: new Date().toISOString(),
      updatedBy: firebaseUser?.uid || '',
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'googleFormExams', editingId), payload);
        setNotice('Perubahan Ujian Form berhasil disimpan.');
      } else {
        await addDoc(collection(db, 'googleFormExams'), {
          ...payload,
          createdAt: new Date().toISOString(),
          createdBy: firebaseUser?.uid || '',
          teacherName: currentUser?.displayName || currentUser?.email || 'Guru',
        });
        setNotice('Ujian Form berhasil dibuat.');
      }
      resetForm();
    } catch (error) {
      console.error('Gagal menyimpan Ujian Form:', error);
      setNotice('Ujian belum tersimpan. Periksa izin Firestore dan koneksi internet.');
    } finally {
      setSaving(false);
    }
  };

  const editExam = (exam: FormExam) => {
    setEditingId(exam.id);
    setDraft({
      title: exam.title,
      subject: exam.subject,
      className: exam.className,
      formUrl: exam.formUrl,
      startAt: exam.startAt || '',
      endAt: exam.endAt || '',
      duration: exam.duration || 60,
      status: exam.status,
    });
    setPreviewId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeStatus = async (exam: FormExam, status: FormExam['status']) => {
    try {
      await updateDoc(doc(db, 'googleFormExams', exam.id), { status, updatedAt: new Date().toISOString() });
      setNotice(status === 'Arsip' ? 'Ujian dipindahkan ke arsip.' : 'Status ujian diperbarui.');
    } catch (error) {
      console.error('Gagal mengubah status Ujian Form:', error);
      setNotice('Status ujian belum dapat diperbarui.');
    }
  };

  if (!canManage) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">Akses modul Ujian Form hanya tersedia untuk akun guru dan pengelola SIMPATIK.</div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D5EADB] bg-gradient-to-br from-[#F2FBF5] to-white p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF5E6] text-[#087F49]"><FilePlus2 size={23}/></span>
          <div><h2 className="text-base font-extrabold text-slate-800">Buat Ujian dari Google Form</h2><p className="mt-1 text-xs leading-5 text-slate-500">Daftarkan Google Form, tentukan kelas dan jadwal, lalu kelola status ujian dari SIMPATIK.</p></div>
        </div>
      </section>

      <form onSubmit={saveExam} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-slate-800">{editingId ? 'Ubah Data Ujian Form' : 'Data Ujian Baru'}</h3>{editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><X size={15}/> Batal</button>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold text-slate-600 sm:col-span-2">Nama ujian<input required value={draft.title} onChange={e => setDraft(v => ({ ...v, title: e.target.value }))} placeholder="Contoh: Penilaian Harian Bahasa Arab" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium outline-none focus:border-emerald-500"/></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Mata pelajaran<select required value={draft.subject} onChange={e => setDraft(v => ({ ...v, subject: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium">{subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}</select></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Kelas<select required value={draft.className} onChange={e => setDraft(v => ({ ...v, className: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium">{classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select></label>
          <label className="space-y-1 text-xs font-bold text-slate-600 sm:col-span-2">Link Google Form<div className="relative"><Link2 size={17} className="absolute left-3 top-3 text-slate-400"/><input required type="url" value={draft.formUrl} onChange={e => setDraft(v => ({ ...v, formUrl: e.target.value }))} placeholder="https://docs.google.com/forms/d/e/.../viewform" className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-sm font-medium outline-none focus:border-emerald-500"/></div>{draft.formUrl && <span className={validFormUrl ? 'text-emerald-700' : 'text-rose-600'}>{validFormUrl ? 'Tautan Google Form dikenali.' : 'Masukkan tautan Google Form yang benar.'}</span>}</label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Mulai ujian<input type="datetime-local" value={draft.startAt} onChange={e => setDraft(v => ({ ...v, startAt: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"/></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Selesai ujian<input type="datetime-local" value={draft.endAt} onChange={e => setDraft(v => ({ ...v, endAt: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"/></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Durasi (menit)<input type="number" min="1" max="300" value={draft.duration} onChange={e => setDraft(v => ({ ...v, duration: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"/></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Status<select value={draft.status} onChange={e => setDraft(v => ({ ...v, status: e.target.value as FormExam['status'] }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"><option value="Draft">Draft</option><option value="Aktif">Aktif</option></select></label>
        </div>
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F49] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#06683C] disabled:opacity-60"><Save size={17}/>{saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Buat Ujian Form'}</button>
      </form>

      {notice && <p role="status" className="rounded-xl border border-[#CDEBD8] bg-[#F1FAF4] px-4 py-3 text-xs font-semibold text-[#087640]">{notice}</p>}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-extrabold text-slate-800">Daftar Ujian Form</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{exams.length} ujian</span></div>
        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Memuat data ujian…</div> : exams.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center"><FilePlus2 className="mx-auto text-slate-300" size={30}/><p className="mt-2 text-sm font-bold text-slate-600">Belum ada Ujian Form</p><p className="mt-1 text-xs text-slate-400">Buat ujian pertama melalui formulir di atas.</p></div> : exams.map(exam => (
          <article key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-extrabold text-slate-800">{exam.title}</h4><p className="mt-1 text-xs text-slate-500">{exam.subject} · Kelas {exam.className} · {exam.duration} menit</p><p className="mt-2 text-[11px] text-slate-400">{exam.startAt ? new Date(exam.startAt).toLocaleString('id-ID') : 'Jadwal belum ditentukan'}{exam.endAt ? ' — ' + new Date(exam.endAt).toLocaleString('id-ID') : ''}</p></div><span className={'rounded-full px-3 py-1 text-[11px] font-extrabold ' + (exam.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : exam.status === 'Arsip' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700')}>{exam.status}</span></div>
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setPreviewId(previewId === exam.id ? '' : exam.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><ExternalLink size={14}/>{previewId === exam.id ? 'Tutup Pratinjau' : 'Pratinjau Form'}</button><button type="button" onClick={() => editExam(exam)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><Pencil size={14}/> Ubah</button>{exam.status !== 'Arsip' && <button type="button" onClick={() => void changeStatus(exam, 'Arsip')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500"><Archive size={14}/> Arsipkan</button>}</div>
            {previewId === exam.id && <div className="mt-4 overflow-hidden rounded-xl border border-slate-200"><iframe title={'Pratinjau ' + exam.title} src={getEmbedUrl(exam.formUrl)} className="h-[620px] w-full bg-slate-50" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="camera; microphone; geolocation"/></div>}
          </article>
        ))}
      </section>
      <p className="text-[11px] leading-5 text-slate-400">Catatan: Pratinjau hanya berhasil jika pengaturan berbagi Google Form mengizinkan siswa membuka formulir. Penyimpanan nilai otomatis dari Google Forms akan disambungkan pada tahap integrasi berikutnya.</p>
    </div>
  );
};
