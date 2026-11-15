import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp, applicationDefault, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { gradeExamAttemptWithAdmin } from './server/examGradingService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw) as FirebaseAppletConfig;
  return parsed;
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    '';
  if (!raw.trim()) return null;

  const trimmed = raw.trim();
  const candidates = [trimmed];
  if (!trimmed.startsWith('{')) {
    try {
      candidates.push(Buffer.from(trimmed, 'base64').toString('utf8'));
    } catch {
      // Ignore invalid base64
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as ServiceAccount & {
        private_key?: string;
        client_email?: string;
        project_id?: string;
      };
      if (parsed && parsed.client_email && parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        return parsed;
      }
    } catch {
      // Try next candidate
    }
  }

  return null;
}

function getAdminServices() {
  const config = loadFirebaseConfig();
  const serviceAccount = parseServiceAccountFromEnv();
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const hasExplicitCredsFile = Boolean(credentialsPath && fs.existsSync(credentialsPath));
  const useAdc = process.env.FIREBASE_USE_ADC === 'true';

  if (!serviceAccount && !hasExplicitCredsFile && !useAdc) {
    return null;
  }

  const existing = getApps()[0];
  const app =
    existing ||
    initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId: config.projectId,
    });

  return {
    adminAuth: getAuth(app),
    adminDb: getFirestore(app, config.firestoreDatabaseId),
  };
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';


  const allowedOrigins = new Set(['https://amiruddin-stack.github.io', 'http://localhost:3000', ...(process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean)]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin || '';
    if (allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    next();
  });
  app.use(express.json({ limit: '256kb' }));
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();

  app.post('/api/student-register', async (req, res) => {
    try {
      const services = getAdminServices();
      if (!services) { res.status(503).json({ success: false, message: 'Sinkronisasi Firestore belum dikonfigurasi.' }); return; }
      const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\\s+/g, ' ').toLocaleUpperCase('id-ID') : '';
      const className = typeof req.body?.className === 'string' ? req.body.className.trim() : '';
      const nisn = typeof req.body?.nisn === 'string' ? req.body.nisn.replace(/\\D/g, '') : '';
      if (name.length < 3 || name.length > 100 || !/^\\d{10}$/.test(nisn) || !/^(VII|VIII|IX)\\b/i.test(className)) { res.status(400).json({ success: false, message: 'Nama, kelas, atau NISN tidak valid.' }); return; }
      const students = services.adminDb.collection('students');
      const existing = await students.where('nisn', '==', nisn).limit(1).get();
      if (!existing.empty) {
        const current = existing.docs[0];
        const data = current.data();
        if (String(data.status || '').toLowerCase() !== 'menunggu') { res.status(409).json({ success: false, message: 'NISN sudah terdaftar. Hubungi admin sekolah jika data perlu diperbaiki.' }); return; }
        await current.ref.set({ name, className, updatedAt: new Date().toISOString(), registrationSource: 'student_portal' }, { merge: true });
        res.json({ success: true, message: 'Pendaftaran siswa diperbarui dan menunggu verifikasi admin.', student: { id: current.id, name, className, status: 'menunggu' } });
        return;
      }
      const id = 'std-' + createHash('sha256').update(nisn).digest('hex');
      const ref = students.doc(id);
      const byId = await ref.get();
      if (byId.exists) { res.status(409).json({ success: false, message: 'NISN sudah terdaftar.' }); return; }
      const student = { id, nis: '', nisn, name, gender: '', className, status: 'menunggu', registeredAt: new Date().toISOString(), registrationSource: 'student_portal' };
      await ref.set(student);
      res.json({ success: true, message: 'Pendaftaran tersimpan di SIMPATIK dan Firestore.', student: { id, name, className, status: 'menunggu' } });
    } catch (error) { console.error('Pendaftaran siswa gagal:', error); res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Pendaftaran belum dapat diproses.' }); }
  });

  app.post('/api/student-login', async (req, res) => {
    try {
      const services = getAdminServices();
      if (!services) { res.status(503).json({ success: false, message: 'Layanan login siswa belum dikonfigurasi.' }); return; }
      const nisn = typeof req.body?.nisn === 'string' ? req.body.nisn.trim() : '';
      if (!nisn || nisn.length > 30) { res.status(400).json({ success: false, message: 'Masukkan NISN yang valid (maksimal 30 karakter).' }); return; }
      const ip = req.ip || req.socket.remoteAddress || 'unknown'; const now = Date.now(); const bucket = loginAttempts.get(ip);
      if (bucket && bucket.resetAt > now && bucket.count >= 12) { res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Coba kembali beberapa menit lagi.' }); return; }
      if (!bucket || bucket.resetAt <= now) loginAttempts.set(ip, { count: 1, resetAt: now + 600000 }); else bucket.count += 1;
      const found = await services.adminDb.collection('students').where('nisn', '==', nisn).limit(1).get();
      if (found.empty) { res.status(401).json({ success: false, message: 'NISN belum terdaftar atau belum disetujui admin.' }); return; }
      const student = found.docs[0].data();
      if (String(student.status || '').toLowerCase() !== 'aktif') { res.status(401).json({ success: false, message: 'NISN belum terdaftar atau belum disetujui admin.' }); return; }
      const className = String(student.className || ''); const classLevel = className.match(/^(VIII|VII|IX)(?=$|[\\s(-])/i)?.[1]?.toUpperCase() || '';
      if (!classLevel) { res.status(400).json({ success: false, message: 'Kelas siswa belum valid.' }); return; }
      const studentId = String(student.id || found.docs[0].id);
      const token = await services.adminAuth.createCustomToken('student_' + studentId, { role: 'student', studentId, className, classLevel });
      res.json({ success: true, token, student: { id: studentId, name: String(student.name || ''), className, nis: String(student.nis || ''), gender: String(student.gender || '') } });
    } catch (error) { console.error('Login siswa gagal:', error); res.status(500).json({ success: false, message: 'Login belum dapat diproses. Periksa konfigurasi Firebase server.' }); }
  });

  app.post('/api/student-status', async (req, res) => {
    try {
      const services = getAdminServices();
      if (!services) { res.status(503).json({ success: false, message: 'Firebase Admin belum dikonfigurasi.' }); return; }
      const authorization = String(req.headers.authorization || ''); const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!idToken) { res.status(401).json({ success: false, message: 'Token admin tidak ditemukan.' }); return; }
      const decoded = await services.adminAuth.verifyIdToken(idToken);
      if (String(decoded.email || '').toLowerCase() !== 'amiruddin@smpialwasi-maros.sch.id') { res.status(403).json({ success: false, message: 'Hanya admin sekolah yang dapat mengubah status siswa.' }); return; }
      const id = typeof req.body?.id === 'string' ? req.body.id : ''; const status = typeof req.body?.status === 'string' ? req.body.status.toLowerCase() : '';
      if (!id || !['aktif','menunggu','ditolak'].includes(status)) { res.status(400).json({ success: false, message: 'Data status siswa tidak valid.' }); return; }
      const ref = services.adminDb.collection('students').doc(id);
      const current = await ref.get();
      if (!current.exists) { res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan di Firestore.' }); return; }
      await ref.set({ status: status === 'aktif' ? 'Aktif' : status, updatedAt: new Date().toISOString() }, { merge: true });
      res.json({ success: true, message: 'Status siswa diperbarui di SIMPATIK dan Firestore.' });
    } catch (error) { console.error('Perubahan status siswa gagal:', error); res.status(500).json({ success: false, message: 'Status siswa belum dapat diperbarui di Firestore.' }); }
  });

  app.get('/api/health', (_req, res) => {
    const services = getAdminServices();
    res.json({
      ok: true,
      service: 'SIMPATIK_BACKEND',
      adminGradingConfigured: Boolean(services),
      studentFirestoreConfigured: Boolean(services),
    });
  });

  app.post('/api/grade-exam', async (req, res) => {
    try {
      const services = getAdminServices();
      if (!services) {
        res.status(503).json({
          success: false,
          fallback: true,
          code: 'BACKEND_ADMIN_NOT_CONFIGURED',
          message:
            'Kredensial Firebase Admin SDK server belum dikonfigurasi. Dialihkan ke Web App penilaian.',
        });
        return;
      }

      const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken : '';
      const attemptId = typeof req.body?.attemptId === 'string' ? req.body.attemptId : '';

      const outcome = await gradeExamAttemptWithAdmin({
        idToken,
        attemptId,
        adminAuth: services.adminAuth,
        adminDb: services.adminDb,
      });
      res.status(outcome.status).json(outcome.body);
    } catch (error) {
      console.error('Gagal memproses penilaian otomatis backend:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat menilai ujian di server.',
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SIMPATIK server berjalan di http://0.0.0.0:${port}`);
  });
}

void startServer();
