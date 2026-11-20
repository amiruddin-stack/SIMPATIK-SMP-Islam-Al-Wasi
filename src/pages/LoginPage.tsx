import React from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { loginWithGoogle, loading } = useAuth();

  return (
    <main className="simpatik-login-shine relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0FBF4] px-5 py-10">
      <style>{`
        @keyframes simpatik-login-light-sweep {
          0% { transform: translateX(-180%) skewX(-18deg); }
          5% { transform: translateX(420%) skewX(-18deg); }
          100% { transform: translateX(420%) skewX(-18deg); }
        }
        .simpatik-login-sweep {
          animation: simpatik-login-light-sweep 30s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .simpatik-login-sweep { animation: none; }
        }
      `}</style>
      <div aria-hidden="true" className="simpatik-login-sweep pointer-events-none absolute -left-1/3 top-[-20%] z-0 h-[140%] w-1/3 bg-gradient-to-r from-transparent via-white/75 to-transparent blur-xl" />
      <section className="relative z-10 w-full max-w-md px-2 py-6 text-center sm:px-6">
        <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}logo-alwasi.png`} alt="Logo SMP Islam Al-Wasi’" className="h-full w-full object-contain" />
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-emerald-700">SMP Islam Al-Wasi’</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">SIMPATIK</h1>
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-emerald-500" />
        <p className="mt-4 text-sm font-extrabold tracking-wide text-[#087F49]">Selamat Datang Guru Hebat</p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">Silakan masuk menggunakan akun Google resmi sekolah untuk melanjutkan ke aplikasi.</p>
        <button
          type="button"
          onClick={() => void loginWithGoogle()}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#087F49] to-[#0B9654] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5 rounded-full bg-white p-0.5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.65 5.94c4.47-4.13 7.12-10.2 7.12-17.59Z"/>
            <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.86l-7.65-5.94c-2.12 1.43-4.84 2.28-8.25 2.28-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z"/>
          </svg>
          {loading ? 'SIMPATIK sedang dipersiapkan…' : 'Masuk dengan Google Sekolah'}
        </button>
        <div className="mt-6">
          <p className="text-xs font-extrabold text-emerald-950">Akun yang diizinkan</p>
          <p className="mt-1 text-xs font-medium text-emerald-800">@smpialwasi-maros.sch.id</p>
        </div>
        <p className="mt-6 text-[10px] font-medium tracking-wide text-slate-500">Qurani, Ramah Anak dan Berkarakter</p>
      </section>
    </main>
  );
}
