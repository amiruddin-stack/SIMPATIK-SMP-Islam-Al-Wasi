import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { Archive, ExternalLink, FilePlus2, Link2, Pencil, Save, Trash2, X, Users, RotateCcw, Ban, MoreVertical } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getClassDisplayName, getClassLevel, SCHOOL_CLASSES } from '../lib/classes';

type FormExam = {
  id: string;
  examType?: string;
  enableSchedule?: boolean;
  enableCountdown?: boolean;
  enablePenalty?: boolean;
  title: string;
  subject: string;
  className: string;
  classLevel: string;
  formId: string;
  formUrl: string;
  startAt: string;
  endAt: string;
  duration: number;
  status: 'Draft' | 'Aktif' | 'Arsip';
  createdAt?: string;
  createdBy?: string;
};

const NO_SUBJECT = '__NO_SUBJECT__';

type GoogleFormResult = { id: string; examId: string; studentName: string; nisn: string; score: number; total: number; percent: number; submittedAt: string };
type ParticipantStudent = { id: string; name?: string; className?: string; status?: string; nisn?: string };
type ExamParticipantControl = { id: string; examId: string; studentId: string; studentName: string; classLevel: string; blocked: boolean; resetVersion: number; updatedAt?: string };

type FormExamDraft = { title: string; examType: string; subject: string; className: string; formUrl: string; enableSchedule: boolean; startAt: string; endAt: string; enableCountdown: boolean; duration: number; enablePenalty: boolean; status: FormExam['status'] };

const emptyForm: FormExamDraft = {
  title: '',
  examType: 'Asesmen Sumatif Akhir Semester',
  subject: '',
  className: '',
  formUrl: '',
  enableSchedule: false,
  startAt: '',
  endAt: '',
  enableCountdown: false,
  duration: 60,
  enablePenalty: false,
  status: 'Draft',
};

function getGoogleFormUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname !== 'docs.google.com' || !url.pathname.includes('/forms/')) return null;
    const match = url.pathname.match(/\/forms\/(?:d\/e\/|d\/)([a-zA-Z0-9_-]+)/);
    if (!match?.[1]) return null;
    const responderUrl = new URL('https://docs.google.com/forms/d/e/' + match[1] + '/viewform');
    url.searchParams.forEach((value, key) => {
      if (/^entry\.\d+$/.test(key)) responderUrl.searchParams.set(key, value);
    });
    return responderUrl.toString();
  } catch {
    return null;
  }
}

function getFormId(value: string) {
  const url = getGoogleFormUrl(value);
  if (!url) return '';
  return new URL(url).pathname.match(/\/forms\/(?:d\/e\/|d\/)([a-zA-Z0-9_-]+)/)?.[1] || '';
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
  const { subjects } = useData();
  const [exams, setExams] = useState<FormExam[]>([]);
  const [results, setResults] = useState<GoogleFormResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<FormExamDraft>(emptyForm);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [previewId, setPreviewId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [examMenuId, setExamMenuId] = useState('');
  const [participantPanelId, setParticipantPanelId] = useState('');
  const [participantStudents, setParticipantStudents] = useState<ParticipantStudent[]>([]);
  const [participantControls, setParticipantControls] = useState<ExamParticipantControl[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [pendingParticipantControlId, setPendingParticipantControlId] = useState('');

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

  useEffect(() => {
    if (!canManage) return;
    const stop = onSnapshot(collection(db, 'googleFormResults'), snapshot => {
      setResults(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as GoogleFormResult)).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')));
    }, error => console.error('Gagal memuat hasil Ujian Form:', error));
    return stop;
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return;
    const stop = onSnapshot(collection(db, 'students'), snapshot => {
      const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ParticipantStudent))
        .filter(item => String(item.status || '').toLowerCase() === 'aktif')
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'));
      setParticipantStudents(rows);
    }, error => console.error('Gagal memuat daftar peserta:', error));
    return stop;
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return;
    const stop = onSnapshot(collection(db, 'googleFormExamParticipants'), snapshot => {
      setParticipantControls(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ExamParticipantControl)));
    }, error => console.error('Gagal memuat kontrol peserta ujian:', error));
    return stop;
  }, [canManage]);

  const selectedParticipantExam = exams.find(exam => exam.id === participantPanelId);

  const participantControl = (examId: string, studentId: string) =>
    participantControls.find(item => item.examId === examId && item.studentId === studentId);

  const toggleParticipantRestriction = async (exam: FormExam, student: ParticipantStudent) => {
    const control = participantControl(exam.id, student.id);
    const blocked = !(control?.blocked);
    const controlId = exam.id + '_' + student.id;
    if (pendingParticipantControlId) return;
    setPendingParticipantControlId(controlId);
    setNotice('');
    try {
      await setDoc(doc(db, 'googleFormExamParticipants', controlId), {
        examId: exam.id, studentId: student.id, studentName: student.name || '',
        classLevel: getClassLevel(student.className) || exam.classLevel,
        blocked, resetVersion: control?.resetVersion || 0, updatedAt: new Date().toISOString(),
        updatedBy: firebaseUser?.uid || ''
      }, { merge: true });
      setNotice(blocked ? 'Berhasil: peserta dibatasi dari ujian ini.' : 'Berhasil: akses peserta dibuka kembali.');
    } catch (error) {
      console.error('Gagal mengubah pembatasan peserta:', error);
      const errorCode = (error as { code?: string })?.code || '';
      setNotice(errorCode === 'permission-denied'
        ? 'Gagal: izin Firestore menolak perubahan. Rules googleFormExamParticipants perlu diperiksa/dipublikasikan.'
        : 'Gagal menyimpan pembatasan peserta. Periksa koneksi internet, lalu coba lagi.');
    } finally {
      setPendingParticipantControlId('');
    }
  };

  const restartParticipant = async (exam: FormExam, student: ParticipantStudent) => {
    const control = participantControl(exam.id, student.id);
    const controlId = exam.id + '_' + student.id;
    if (!window.confirm('Reset status pengerjaan ' + (student.name || 'siswa') + ' untuk ujian ini? Siswa dapat memulai ulang, tetapi respons Google Form yang sudah dikirim tidak dihapus.')) return;
    try {
      await setDoc(doc(db, 'googleFormExamParticipants', controlId), {
        examId: exam.id, studentId: student.id, studentName: student.name || '',
        classLevel: getClassLevel(student.className) || exam.classLevel,
        blocked: Boolean(control?.blocked), resetVersion: (control?.resetVersion || 0) + 1,
        updatedAt: new Date().toISOString(), updatedBy: firebaseUser?.uid || ''
      }, { merge: true });
      setNotice('Status pengerjaan siswa direset. Siswa dapat memulai ujian kembali.');
    } catch (error) {
      console.error('Gagal mereset peserta:', error);
      setNotice('Status pengerjaan belum dapat direset. Periksa izin Firestore.');
    }
  };

  const validFormUrl = useMemo(() => getGoogleFormUrl(draft.formUrl), [draft.formUrl]);
  const [activeClassTab, setActiveClassTab] = useState<'VII' | 'VIII' | 'IX'>('VII');
  const classFilteredExams = exams.filter(exam => (getClassLevel(exam.className) || getClassLevel(exam.classLevel)) === activeClassTab);
  const examDateGroups = useMemo(() => {
    const groups = new Map<string, FormExam[]>();
    classFilteredExams.forEach(exam => {
      const dateKey = exam.startAt ? (() => {
        const date = new Date(exam.startAt);
        return Number.isNaN(date.getTime()) ? 'unscheduled' : [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
      })() : 'unscheduled';
      const group = groups.get(dateKey) || [];
      group.push(exam);
      groups.set(dateKey, group);
    });
    return [...groups.entries()].sort(([a], [b]) => a === 'unscheduled' ? 1 : b === 'unscheduled' ? -1 : a.localeCompare(b)).map(([dateKey, items]) => ({
      dateKey,
      label: dateKey === 'unscheduled' ? 'Jadwal belum ditentukan' : new Date(dateKey + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      exams: items.sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''))
    }));
  }, [classFilteredExams]);

  const resetForm = () => {
    setDraft({ ...emptyForm, subject: subjects[0] || '', className: SCHOOL_CLASSES[0] });
    setEditingId('');
  };

  useEffect(() => {
    if (!draft.subject && subjects.length) setDraft(current => ({ ...current, subject: subjects[0] }));
    if (!draft.className) setDraft(current => ({ ...current, className: SCHOOL_CLASSES[0] }));
  }, [subjects, draft.subject, draft.className]);

  const saveExam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !draft.examType || (draft.examType === 'Lainnya' && !draft.title.trim()) || !draft.subject || !draft.className || !validFormUrl) {
      setNotice('Lengkapi nama ujian, pilihan mata pelajaran atau Tanpa Mata Pelajaran, kelas, dan tautan Google Form yang valid.');
      return;
    }
    if (draft.enableSchedule && draft.startAt && draft.endAt && new Date(draft.endAt) <= new Date(draft.startAt)) {
      setNotice('Waktu selesai harus lebih akhir daripada waktu mulai.');
      return;
    }
    setSaving(true);
    setNotice('');
    const payload = {
      title: draft.examType === 'Lainnya' ? draft.title.trim() : draft.examType,
      examType: draft.examType,
      subject: draft.subject === NO_SUBJECT ? '' : draft.subject,
      className: getClassDisplayName(draft.className),
      classLevel: getClassLevel(draft.className),
      formId: getFormId(validFormUrl),
      formUrl: validFormUrl,
      enableSchedule: draft.enableSchedule,
      startAt: draft.enableSchedule ? draft.startAt : '',
      endAt: draft.enableSchedule ? draft.endAt : '',
      enableCountdown: draft.enableCountdown,
      duration: Math.max(1, Math.min(300, Number(draft.duration) || 60)),
      enablePenalty: draft.enablePenalty,
      penaltyMinutes: 3,
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
      examType: ['Asesmen Sumatif Akhir Semester', 'Asesmen Sumatif Akhir Tahun', 'Asesmen Sumatif Akhir Jenjang', 'Asesmen Diagnostik', 'Asesmen Formatif'].includes(exam.examType || '') ? exam.examType! : 'Lainnya',
      subject: exam.subject || NO_SUBJECT,
      className: getClassDisplayName(exam.className) || exam.className,
      formUrl: exam.formUrl,
      enableSchedule: exam.enableSchedule ?? Boolean(exam.startAt || exam.endAt),
      startAt: exam.startAt || '',
      endAt: exam.endAt || '',
      enableCountdown: exam.enableCountdown ?? true,
      duration: exam.duration || 60,
      enablePenalty: exam.enablePenalty || false,
      status: exam.status,
    });
    setPreviewId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteExam = async (exam: FormExam) => {
    const confirmed = window.confirm('Hapus ujian "' + exam.title + '" dari daftar Ujian Form? Data hasil siswa yang sudah masuk tetap disimpan.');
    if (!confirmed || !canManage) return;
    setDeletingId(exam.id);
    setNotice('');
    try {
      await deleteDoc(doc(db, 'googleFormExams', exam.id));
      if (editingId === exam.id) resetForm();
      if (previewId === exam.id) setPreviewId('');
      setNotice('Ujian "' + exam.title + '" berhasil dihapus. Hasil siswa tetap tersimpan.');
    } catch (error) {
      console.error('Gagal menghapus Ujian Form:', error);
      setNotice('Ujian belum dapat dihapus. Periksa izin Firestore dan koneksi internet.');
    } finally {
      setDeletingId('');
    }
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

  if (participantPanelId && selectedParticipantExam) {
    const examStudents = participantStudents.filter(student =>
      getClassLevel(student.className) === getClassLevel(selectedParticipantExam.className) &&
      (student.name || '').toLowerCase().includes(participantSearch.toLowerCase())
    );
    const blockedCount = participantStudents.filter(student =>
      getClassLevel(student.className) === getClassLevel(selectedParticipantExam.className) &&
      participantControl(selectedParticipantExam.id, student.id)?.blocked
    ).length;
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setParticipantPanelId('')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><span aria-hidden="true">←</span> Kembali ke Daftar Ujian</button>
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Users size={22}/></span><div className="min-w-0"><h2 className="text-lg font-extrabold text-slate-800">Kelola Peserta</h2><p className="mt-1 text-sm font-bold text-emerald-800">{selectedParticipantExam.subject || 'Tanpa Mata Pelajaran'}</p><p className="text-xs text-slate-500">{selectedParticipantExam.title} · Kelas {getClassLevel(selectedParticipantExam.className)}</p></div></div>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Total peserta</p><p className="mt-1 text-2xl font-extrabold text-slate-800">{participantStudents.filter(student => getClassLevel(student.className) === getClassLevel(selectedParticipantExam.className)).length}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3"><p className="text-xs text-rose-600">Peserta dibatasi</p><p className="mt-1 text-2xl font-extrabold text-rose-700">{blockedCount}</p></div>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="relative block"><span className="sr-only">Cari siswa</span><input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder="Cari nama siswa..." className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"/></label>
          <div className="mt-3 space-y-2">
            {examStudents.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{participantSearch ? 'Siswa tidak ditemukan.' : 'Belum ada siswa aktif di kelas ini.'}</p> : examStudents.map(student => {
              const control = participantControl(selectedParticipantExam.id, student.id);
              return <div key={student.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{student.name || 'Nama siswa'}</p><p className="text-xs text-slate-400">{student.className || 'Kelas'}{student.nisn ? ' · NISN '+student.nisn : ''}</p><span className={'mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold '+(control?.blocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>{control?.blocked ? 'Dibatasi' : 'Diizinkan mengikuti ujian'}</span></div>
                <div className="flex shrink-0 gap-2"><button type="button" onClick={() => void toggleParticipantRestriction(selectedParticipantExam, student)} disabled={pendingParticipantControlId === selectedParticipantExam.id + '_' + student.id || Boolean(pendingParticipantControlId)} className={'inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-extrabold sm:flex-none disabled:cursor-wait disabled:opacity-60 '+(control?.blocked ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')}><Ban size={13}/>{pendingParticipantControlId === selectedParticipantExam.id + '_' + student.id ? 'Menyimpan…' : control?.blocked ? 'Buka Akses' : 'Batasi'}</button><button type="button" onClick={() => void restartParticipant(selectedParticipantExam, student)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 sm:flex-none"><RotateCcw size={13}/>Restart</button></div>
              </div>;
            })}
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-700">Restart hanya mereset status pengerjaan SIMPATIK. Respons Google Form yang sudah terkirim tidak dihapus; pengiriman ulang bergantung pada setelan formulir.</p>
        </section>
        {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      </div>
    );
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
          <label className="space-y-1 text-xs font-bold text-slate-600">Nama ujian<select required value={draft.examType} onChange={e => setDraft(v => ({ ...v, examType: e.target.value, title: e.target.value === 'Lainnya' ? v.title : '' }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"><option>Asesmen Sumatif Akhir Semester</option><option>Asesmen Sumatif Akhir Tahun</option><option>Asesmen Sumatif Akhir Jenjang</option><option>Asesmen Diagnostik</option><option>Asesmen Formatif</option><option>Lainnya</option></select></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Mata pelajaran<select required value={draft.subject} onChange={e => setDraft(v => ({ ...v, subject: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium">{subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}<option value={NO_SUBJECT}>Tanpa Mata Pelajaran</option></select></label>
          <label className="space-y-1 text-xs font-bold text-slate-600">Kelas<select required value={draft.className} onChange={e => setDraft(v => ({ ...v, className: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium">{SCHOOL_CLASSES.map(cls => <option key={cls} value={cls}>Kelas {getClassLevel(cls)}</option>)}</select></label>
          {draft.examType === 'Lainnya' && <label htmlFor="custom-form-exam-name" className="space-y-1 text-xs font-bold text-slate-600 sm:col-span-2"><span className="block">Tulis nama ujian</span><input id="custom-form-exam-name" name="customExamName" type="text" autoFocus autoComplete="off" required value={draft.title} onChange={e => setDraft(v => ({ ...v, title: e.target.value }))} placeholder="Contoh: Ujian Praktik Bahasa Arab" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500"/></label>}
          <label className="space-y-1 text-xs font-bold text-slate-600 sm:col-span-2">Link Google Form<div className="relative"><Link2 size={17} className="absolute left-3 top-3 text-slate-400"/><input required type="url" value={draft.formUrl} onChange={e => setDraft(v => ({ ...v, formUrl: e.target.value }))} placeholder="https://docs.google.com/forms/d/e/.../viewform" className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-sm font-medium outline-none focus:border-emerald-500"/></div>{draft.formUrl && <span className={validFormUrl ? 'text-emerald-700' : 'text-rose-600'}>{validFormUrl ? 'Tautan Google Form dikenali.' : 'Masukkan tautan Google Form yang benar.'}<span className="mt-1 block font-medium text-slate-500">Tambahkan pertanyaan wajib NISN dan KODE PESERTA, lalu gunakan tautan praisi hasil fungsi generateSimpNisnPrefillUrl di Apps Script.</span></span>}</label>
          <div className="sm:col-span-2">
            <button type="button" onClick={() => setAdvancedSettingsOpen(v => !v)} aria-expanded={advancedSettingsOpen} aria-controls="google-form-advanced-settings" className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:bg-slate-100">
              <span className="text-sm font-extrabold text-slate-800">Pengaturan Lanjutan</span>
              <ChevronDown size={18} className={`text-slate-500 transition-transform ${advancedSettingsOpen ? 'rotate-180' : ''}`}/>
            </button>
            {advancedSettingsOpen && <div id="google-form-advanced-settings" className="mt-3 space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="block text-xs font-extrabold text-slate-700">Aktifkan jadwal ujian</span><span className="mt-1 block text-[11px] font-medium text-slate-500">Batasi waktu ujian berdasarkan tanggal dan jam.</span></span><input type="checkbox" checked={draft.enableSchedule} onChange={e => setDraft(v => ({ ...v, enableSchedule: e.target.checked }))} className="h-5 w-5 accent-emerald-600"/></label>
                {draft.enableSchedule && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-bold text-slate-600">Waktu mulai<input type="datetime-local" value={draft.startAt} onChange={e => setDraft(v => ({ ...v, startAt: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"/></label><label className="space-y-1 text-xs font-bold text-slate-600">Waktu selesai<input type="datetime-local" value={draft.endAt} onChange={e => setDraft(v => ({ ...v, endAt: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"/></label></div>}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="block text-xs font-extrabold text-slate-700">Aktifkan hitung mundur</span><span className="mt-1 block text-[11px] font-medium text-slate-500">Waktu mulai dihitung saat siswa menekan tombol Mulai Ujian.</span></span><input type="checkbox" checked={draft.enableCountdown} onChange={e => setDraft(v => ({ ...v, enableCountdown: e.target.checked }))} className="h-5 w-5 accent-emerald-600"/></label>
                {draft.enableCountdown && <label className="mt-3 block space-y-1 text-xs font-bold text-slate-600">Durasi (menit)<input type="number" min="1" max="300" value={draft.duration} onChange={e => setDraft(v => ({ ...v, duration: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium"/></label>}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-3"><span><span className="block text-xs font-extrabold text-slate-700">Aktifkan sanksi keluar ruang ujian</span><span className="mt-1 block text-[11px] font-medium text-slate-500">Pindah aplikasi, membuka tab lain, atau meminimalkan SIMPATIK dikenai jeda 3 menit setiap kejadian.</span></span><input type="checkbox" checked={draft.enablePenalty} onChange={e => setDraft(v => ({ ...v, enablePenalty: e.target.checked }))} className="h-5 w-5 accent-emerald-600"/></label>
                {draft.enablePenalty && <p className="mt-2 text-[11px] font-semibold text-amber-700">Setiap kali siswa keluar saat ujian berlangsung, akses formulir dikunci 3 menit. Keluar berulang menambah waktu sanksi secara akumulatif.</p>}
              </div>
            </div>}
          </div>
          <label className="space-y-1 text-xs font-bold text-slate-600">Status<select value={draft.status} onChange={e => setDraft(v => ({ ...v, status: e.target.value as FormExam['status'] }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"><option value="Draft">Draft</option><option value="Aktif">Aktif</option></select></label>
        </div>
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087F49] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#06683C] disabled:opacity-60"><Save size={17}/>{saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Buat Ujian Form'}</button>
      </form>

      {notice && <p role="status" className="rounded-xl border border-[#CDEBD8] bg-[#F1FAF4] px-4 py-3 text-xs font-semibold text-[#087640]">{notice}</p>}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-extrabold text-slate-800">Daftar Ujian Form</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{classFilteredExams.length} ujian</span></div>
        <div role="tablist" aria-label="Filter kelas ujian" className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(['VII', 'VIII', 'IX'] as const).map(level => <button key={level} type="button" role="tab" aria-selected={activeClassTab === level} onClick={() => setActiveClassTab(level)} className={'flex-1 rounded-lg px-3 py-2.5 text-sm font-extrabold transition-colors ' + (activeClassTab === level ? 'bg-white text-[#087F49] shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Kelas {level}</button>)}
        </div>
        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Memuat data ujian…</div> : exams.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center"><FilePlus2 className="mx-auto text-slate-300" size={30}/><p className="mt-2 text-sm font-bold text-slate-600">Belum ada Ujian Form</p><p className="mt-1 text-xs text-slate-400">Buat ujian pertama melalui formulir di atas.</p></div> : classFilteredExams.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center"><p className="text-sm font-bold text-slate-600">Belum ada ujian untuk Kelas {activeClassTab}</p><p className="mt-1 text-xs text-slate-400">Ujian yang dibuat untuk kelas ini akan tampil di sini.</p></div> : examDateGroups.map(group => <div key={group.dateKey} className="space-y-2"><h4 className="border-b border-[#BFE8CF] pb-1.5 pt-2 text-sm font-extrabold capitalize text-[#087F49]">{group.label}</h4>{group.exams.map(exam => (
          <article key={exam.id} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="min-w-0 flex-1 truncate text-sm font-extrabold leading-tight text-slate-800">{exam.subject || 'Tanpa Mata Pelajaran'}</h4>
              <div className="flex shrink-0 items-center gap-1">
                <span className={'rounded-full px-2 py-0.5 text-[10px] font-bold ' + (exam.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : exam.status === 'Arsip' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700')}>{exam.status}</span>
                <div className="relative"><button type="button" aria-label="Menu ujian" aria-haspopup="menu" aria-expanded={examMenuId === exam.id} onClick={() => setExamMenuId(examMenuId === exam.id ? '' : exam.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"><MoreVertical size={17}/></button>{examMenuId === exam.id && <div role="menu" className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"><button role="menuitem" type="button" onClick={() => { setPreviewId(previewId === exam.id ? '' : exam.id); setExamMenuId(''); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink size={14}/>{previewId === exam.id ? 'Tutup Pratinjau' : 'Pratinjau Form'}</button><button role="menuitem" type="button" onClick={() => { setParticipantPanelId(exam.id); setParticipantSearch(''); setExamMenuId(''); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Users size={14}/>Kelola Peserta</button><button role="menuitem" type="button" onClick={() => { editExam(exam); setExamMenuId(''); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={14}/>Ubah</button>{exam.status !== 'Arsip' && <button role="menuitem" type="button" onClick={() => { void changeStatus(exam, 'Arsip'); setExamMenuId(''); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Archive size={14}/>Arsipkan</button>}<button role="menuitem" type="button" disabled={deletingId === exam.id} onClick={() => { void deleteExam(exam); setExamMenuId(''); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14}/>{deletingId === exam.id ? 'Menghapus…' : 'Hapus'}</button></div>}</div>
              </div>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-slate-500">{exam.title}</p>
            <p className="text-[10px] leading-tight text-slate-400">{exam.duration} menit{exam.startAt ? ' · ' + new Date(exam.startAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}{exam.endAt ? '–' + new Date(exam.endAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
            {previewId === exam.id && <div className="mt-2 overflow-hidden rounded-xl border border-slate-200"><iframe title={'Pratinjau ' + exam.title} src={getEmbedUrl(exam.formUrl)} className="h-[620px] w-full bg-slate-50" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="camera; microphone; geolocation"/></div>}
          </article>
        ))}</div>)}
      </section>
      
    </div>
  );
};
