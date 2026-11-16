import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CalendarClock, ExternalLink, FileText } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { simpatikApi } from '../lib/backendApi';

type StudentFormExam = {
  id: string;
  title: string;
  subject: string;
  className: string;
  classLevel: string;
  formUrl: string;
  startAt?: string;
  endAt?: string;
  duration?: number;
  status: string;
};

const NISN_PREFILL_MARKER = 'SIMPATIK_NISN_PREFILL';

function embedUrl(value: string, nisn: string, participantCode: string, studentName: string, className: string) {
  try {
    const url = new URL(value);
    if (!['docs.google.com', 'forms.google.com'].includes(url.hostname) || !url.pathname.includes('/forms/')) return '';
    const nisnEntry = Array.from(url.searchParams.keys()).find(key =>
      /^entry\.\d+$/.test(key) && url.searchParams.get(key) === NISN_PREFILL_MARKER
    );
    const codeEntry = Array.from(url.searchParams.keys()).find(key =>
      /^entry\.\d+$/.test(key) && url.searchParams.get(key) === 'SIMPATIK_CODE_PREFILL'
    );
    const nameEntry = Array.from(url.searchParams.keys()).find(key =>
      /^entry\.\d+$/.test(key) && url.searchParams.get(key) === 'SIMPATIK_NAME_PREFILL'
    );
    const classEntry = Array.from(url.searchParams.keys()).find(key =>
      /^entry\.\d+$/.test(key) && url.searchParams.get(key) === 'SIMPATIK_CLASS_PREFILL'
    );
    if (!nisnEntry || !codeEntry || !nameEntry || !classEntry || !nisn.trim() || !participantCode || !studentName.trim() || !className.trim()) return '';
    url.searchParams.set(nisnEntry, nisn.trim());
    url.searchParams.set(codeEntry, participantCode);
    url.searchParams.set(nameEntry, studentName.trim());
    url.searchParams.set(classEntry, className.trim());
    url.searchParams.set('embedded', 'true');
    return url.toString();
  } catch {
    return '';
  }
}

export const StudentGoogleFormExams: React.FC<{ className: string; nisn: string; studentId: string }> = ({ className, nisn, studentId }) => {
  const classLevel = className.trim().toUpperCase().match(/^(VIII|VII|IX)/)?.[1] || '';
  const [exams, setExams] = useState<StudentFormExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [participantCode, setParticipantCode] = useState('');
  const [participantCodeExamId, setParticipantCodeExamId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participantClass, setParticipantClass] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!classLevel) { setLoading(false); return; }
    const q = query(collection(db, 'googleFormExams'), where('classLevel', '==', classLevel), where('status', '==', 'Aktif'));
    const stop = onSnapshot(q, snapshot => {
      const now = Date.now();
      const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudentFormExam))
        .filter(item => (!item.startAt || new Date(item.startAt).getTime() <= now) && (!item.endAt || new Date(item.endAt).getTime() >= now));
      setExams(rows);
      setSelectedId(current => rows.some(item => item.id === current) ? current : '');
      setLoading(false);
    }, error => {
      console.error('Gagal memuat daftar Ujian Form siswa:', error);
      setLoading(false);
    });
    return stop;
  }, [classLevel]);

  const selected = exams.find(item => item.id === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setParticipantCode('');
      setParticipantCodeExamId('');
      setParticipantName('');
      setParticipantClass('');
      setTokenError('');
      setTokenLoading(false);
      return;
    }
    let cancelled = false;
    setParticipantCode('');
    setParticipantCodeExamId('');
    setParticipantName('');
    setParticipantClass('');
    setTokenError('');
    setTokenLoading(true);

    const issueParticipantCode = async () => {
      const user = auth.currentUser;
      if (!user || !studentId || !nisn.trim()) {
        throw new Error('Sesi siswa atau NISN tidak tersedia. Silakan muat ulang halaman SIMPATIK.');
      }
      const idToken = await user.getIdToken();
      const response = await fetch(simpatikApi('/api/google-form-participant-token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, examId: selectedId, studentId, nisn: nisn.trim() })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || typeof result.participantCode !== 'string' || typeof result.studentName !== 'string' || typeof result.className !== 'string') {
        throw new Error(result?.message || 'Kode peserta ujian belum dapat dibuat.');
      }
      if (!cancelled) {
        setParticipantCode(result.participantCode);
        setParticipantCodeExamId(selectedId);
        setParticipantName(result.studentName);
        setParticipantClass(result.className);
      }
    };

    void issueParticipantCode().catch(error => {
      if (!cancelled) setTokenError(error instanceof Error ? error.message : 'Verifikasi peserta gagal.');
    }).finally(() => {
      if (!cancelled) setTokenLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedId, studentId, nisn]);

  const selectedFormUrl = selected && participantCodeExamId === selected.id
    ? embedUrl(selected.formUrl, nisn, participantCode, participantName, participantClass)
    : '';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#D5EADB] bg-[#F2FBF5] p-4"><h2 className="font-extrabold text-slate-800">Ujian Form</h2><p className="mt-1 text-xs leading-5 text-slate-500">Pilih ujian yang ditugaskan untuk kelas {className}. Kerjakan melalui formulir yang dibuka di bawah ini.</p></div>
      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500">Memuat ujian…</div> : exams.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center"><FileText size={28} className="mx-auto text-slate-300"/><p className="mt-2 text-sm font-bold text-slate-600">Belum ada ujian aktif</p><p className="mt-1 text-xs text-slate-400">Ujian dari guru akan muncul di sini sesuai kelas.</p></div> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">{exams.map(exam => <button key={exam.id} type="button" onClick={() => setSelectedId(exam.id)} className={'rounded-xl border p-4 text-left transition ' + (selectedId === exam.id ? 'border-[#0B8F4D] bg-[#F2FBF5] ring-2 ring-[#D5EADB]' : 'border-slate-200 bg-white hover:border-emerald-300')}><span className="text-sm font-extrabold text-slate-800">{exam.title}</span><span className="mt-1 block text-xs text-slate-500">{exam.subject} · {exam.duration || 60} menit</span>{exam.endAt && <span className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><CalendarClock size={13}/> Batas: {new Date(exam.endAt).toLocaleString('id-ID')}</span>}</button>)}</div>
          {selected && tokenLoading && <div className="rounded-xl border border-[#D5EADB] bg-white p-4 text-center text-xs font-semibold text-slate-500">Memverifikasi akun dan menyiapkan kode peserta…</div>}
          {selected && tokenError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-700"><p className="font-extrabold">Peserta belum dapat diverifikasi</p><p className="mt-1">{tokenError}</p></div>}
          {selected && !tokenLoading && !tokenError && participantCodeExamId === selected.id && !selectedFormUrl && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800"><p className="font-extrabold">Formulir belum disiapkan untuk identitas otomatis.</p><p className="mt-1">Guru perlu menambahkan empat pertanyaan Jawaban singkat wajib berjudul persis NAMA, NISN, KODE PESERTA, dan KELAS, membuat tautan praisi melalui Apps Script, lalu memperbarui tautan ujian di SIMPATIK.</p></div>}
          {selected && selectedFormUrl && <section className="overflow-hidden rounded-2xl border border-[#D5EADB] bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3"><div><h3 className="text-sm font-extrabold text-slate-800">{selected.title}</h3><p className="text-xs text-slate-500">{selected.subject} · Identitas peserta terisi otomatis</p></div><a href={selectedFormUrl.replace('embedded=true', 'embedded=false')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#087F49]"><ExternalLink size={14}/> Buka di tab baru</a></div><iframe title={selected.title} src={selectedFormUrl} className="h-[min(75vh,760px)] min-h-[560px] w-full bg-slate-50" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></section>}
        </>
      )}
      <p className="text-[11px] leading-5 text-slate-400">Nama, NISN, kode peserta, dan kelas diisi otomatis dari data akun siswa yang diverifikasi server SIMPATIK. Kode peserta hanya berlaku untuk ujian ini dan diverifikasi kembali saat hasil dikirim. Google Form memerlukan koneksi internet.</p>
    </div>
  );
};
