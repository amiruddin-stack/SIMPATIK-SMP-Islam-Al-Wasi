import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CalendarClock, FileText, ShieldAlert, Timer } from 'lucide-react';
import { db } from '../firebase/config';
import { getClassLevel } from '../lib/classes';

type StudentFormExam = {
  id: string;
  title: string;
  examType?: string;
  subject: string;
  className: string;
  classLevel: string;
  formUrl: string;
  enableSchedule?: boolean;
  startAt?: string;
  endAt?: string;
  enableCountdown?: boolean;
  duration?: number;
  enablePenalty?: boolean;
  status: string;
};

type ExamAttempt = { startedAt: number; lockUntil: number; violations: number; lastExitAt: number };

const NISN_PREFILL_MARKER = 'SIMPATIK_NISN_PREFILL';
const PENALTY_MS = 3 * 60 * 1000;

function embedUrl(value: string, nisn: string, studentId: string, studentName: string, className: string) {
  try {
    const url = new URL(value);
    const isShortGoogleFormLink = url.hostname === 'forms.gle' && url.pathname.length > 1;
    const isRespondentGoogleFormLink =
      ['docs.google.com', 'forms.google.com'].includes(url.hostname) &&
      /^\/forms\/(?:d\/e\/[^/]+|d\/[^/]+)\/viewform\/?$/.test(url.pathname);
    if (!isShortGoogleFormLink && !isRespondentGoogleFormLink) return '';
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
    if (nisnEntry && nisn.trim()) url.searchParams.set(nisnEntry, nisn.trim());
    if (codeEntry && studentId.trim()) url.searchParams.set(codeEntry, studentId.trim());
    if (nameEntry && studentName.trim()) url.searchParams.set(nameEntry, studentName.trim());
    if (classEntry && className.trim()) url.searchParams.set(classEntry, className.trim());
    url.searchParams.set('embedded', 'true');
    return url.toString();
  } catch {
    return '';
  }
}

function attemptStorageKey(examId: string, studentId: string, nisn: string) {
  return 'simpatik_gform_attempt_' + examId + '_' + (studentId || nisn);
}

function readAttempt(key: string): ExamAttempt | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as ExamAttempt : null;
  } catch {
    return null;
  }
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

export const StudentGoogleFormExams: React.FC<{ className: string; nisn: string; studentId: string; studentName: string }> = ({ className, nisn, studentId, studentName }) => {
  const classLevel = getClassLevel(className);
  const [exams, setExams] = useState<StudentFormExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [now, setNow] = useState(Date.now());
  const selected = exams.find(item => item.id === selectedId);
  const storageKey = selected ? attemptStorageKey(selected.id, studentId, nisn) : '';
  const selectedFormUrl = selected ? embedUrl(selected.formUrl, nisn, studentId, studentName, className) : '';
  const started = Boolean(attempt);
  const countdownEndsAt = attempt && selected?.enableCountdown !== false ? attempt.startedAt + (Math.max(1, selected?.duration || 60) * 60 * 1000) : 0;
  const remainingExam = countdownEndsAt ? Math.max(0, countdownEndsAt - now) : Infinity;
  const remainingPenalty = attempt ? Math.max(0, attempt.lockUntil - now) : 0;
  const examExpired = countdownEndsAt > 0 && remainingExam <= 0;
  const isLocked = Boolean(selected?.enablePenalty && remainingPenalty > 0);
  const timeLabel = useMemo(() => formatTime(remainingExam), [remainingExam]);

  useEffect(() => {
    if (!classLevel) { setLoading(false); return; }
    const q = query(collection(db, 'googleFormExams'), where('classLevel', '==', classLevel), where('status', '==', 'Aktif'));
    const stop = onSnapshot(q, snapshot => {
      const nowValue = Date.now();
      const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudentFormExam))
        .filter(item => {
          const scheduleOn = item.enableSchedule ?? Boolean(item.startAt || item.endAt);
          return !scheduleOn || ((!item.startAt || new Date(item.startAt).getTime() <= nowValue) && (!item.endAt || new Date(item.endAt).getTime() >= nowValue));
        });
      setExams(rows);
      setSelectedId(current => rows.some(item => item.id === current) ? current : '');
      setLoading(false);
    }, error => {
      console.error('Gagal memuat daftar Ujian Form siswa:', error);
      setLoading(false);
    });
    return stop;
  }, [classLevel]);

  useEffect(() => {
    setAttempt(selected && storageKey ? readAttempt(storageKey) : null);
  }, [selectedId, storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selected || !attempt || !selected.enablePenalty || examExpired) return;
    let lastHandled = attempt.lastExitAt || 0;
    const registerExit = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) return;
      const stamp = Date.now();
      if (stamp - lastHandled < 1500) return;
      lastHandled = stamp;
      setAttempt(current => {
        if (!current) return current;
        const next: ExamAttempt = {
          ...current,
          violations: current.violations + 1,
          lockUntil: Math.max(stamp, current.lockUntil) + PENALTY_MS,
          lastExitAt: stamp
        };
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (error) { console.error('Gagal menyimpan status ujian lokal:', error); }
        return next;
      });
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') registerExit(); };
    const onBlur = () => registerExit();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [selected?.id, attempt?.startedAt, selected?.enablePenalty, examExpired, storageKey]);

  const startExam = () => {
    if (!selected || !storageKey || attempt) return;
    const next: ExamAttempt = { startedAt: Date.now(), lockUntil: 0, violations: 0, lastExitAt: 0 };
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch (error) { console.error('Gagal menyimpan awal ujian:', error); }
    setAttempt(next);
    setNow(Date.now());
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#D5EADB] bg-[#F2FBF5] p-4"><h2 className="font-extrabold text-slate-800">Ujian G-Form</h2><p className="mt-1 text-xs leading-5 text-slate-500">Pilih ujian untuk kelas {className}. Tekan Mulai Ujian saat sudah siap.</p></div>
      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500">Memuat ujian…</div> : exams.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center"><FileText size={28} className="mx-auto text-slate-300"/><p className="mt-2 text-sm font-bold text-slate-600">Belum ada ujian aktif</p><p className="mt-1 text-xs text-slate-400">Ujian dari guru akan muncul di sini sesuai kelas.</p></div> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">{exams.map(exam => <button key={exam.id} type="button" onClick={() => setSelectedId(exam.id)} className={'rounded-xl border p-4 text-left transition ' + (selectedId === exam.id ? 'border-[#0B8F4D] bg-[#F2FBF5] ring-2 ring-[#D5EADB]' : 'border-slate-200 bg-white hover:border-emerald-300')}><span className="text-sm font-extrabold text-slate-800">{exam.title}</span><span className="mt-1 block text-xs text-slate-500">{exam.subject} · {exam.duration || 60} menit</span>{exam.endAt && <span className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><CalendarClock size={13}/> Batas: {new Date(exam.endAt).toLocaleString('id-ID')}</span>}</button>)}</div>
          {selected && !selectedFormUrl && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">Tautan Google Form belum valid. Guru perlu memeriksa tautan ujian di SIMPATIK.</div>}
          {selected && selectedFormUrl && !started && <section className="rounded-2xl border border-[#D5EADB] bg-white p-4 shadow-sm"><h3 className="text-sm font-extrabold text-slate-800">{selected.title}</h3><p className="mt-1 text-xs text-slate-500">{selected.subject} · {selected.examType || 'Ujian Form'}</p><p className="mt-3 text-xs leading-5 text-slate-600">Setelah tombol mulai ditekan, waktu ujian berjalan sesuai pengaturan guru. Pastikan koneksi internet stabil dan jangan berpindah aplikasi atau tab.</p><button type="button" onClick={startExam} className="mt-4 w-full rounded-xl bg-[#087F49] px-4 py-3 text-sm font-extrabold text-white">Mulai Ujian</button></section>}
          {selected && selectedFormUrl && started && <section className="overflow-hidden rounded-2xl border border-[#D5EADB] bg-white shadow-sm">
            <div className="space-y-2 border-b border-slate-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-extrabold text-slate-800">{selected.title}</h3><p className="text-xs text-slate-500">{selected.subject} · {studentName}</p></div>{selected.enableCountdown !== false && <div className={'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-extrabold tabular-nums ' + (remainingExam < 5 * 60 * 1000 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}><Timer size={15}/>{timeLabel}</div>}</div>
              {isLocked && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"><ShieldAlert size={17} className="mt-0.5 shrink-0"/><span><strong>Ruang ujian dikunci sementara.</strong> Sisa sanksi {formatTime(remainingPenalty)}. Pelanggaran keluar ruang: {attempt?.violations || 0} kali. Formulir akan terbuka kembali setelah waktu sanksi selesai.</span></div>}
              {examExpired && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">Waktu ujian telah habis. Formulir ditutup oleh SIMPATIK.</div>}
              {!isLocked && !examExpired && selected.enablePenalty && <p className="text-[11px] font-semibold text-amber-700">Jangan pindah aplikasi, membuka tab lain, atau meminimalkan SIMPATIK. Setiap keluar menambah sanksi 3 menit.</p>}
            </div>
            {!isLocked && !examExpired && <iframe title={selected.title} src={selectedFormUrl} className="h-[min(75vh,760px)] min-h-[560px] w-full bg-slate-50" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/>}
          </section>}
        </>
      )}
      <p className="text-[11px] leading-5 text-slate-400">Waktu mulai dan jumlah pelanggaran disimpan di perangkat siswa agar tetap terbaca saat SIMPATIK dibuka kembali. Deteksi menggunakan status tab/aplikasi dan fokus jendela; Google Form berada di layanan Google, sehingga SIMPATIK tidak dapat mengawasi aktivitas di dalam formulir secara penuh.</p>
    </div>
  );
};
