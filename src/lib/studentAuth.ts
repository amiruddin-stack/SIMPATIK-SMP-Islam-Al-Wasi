import { normalizeStudentNisn } from './studentLookup';

export type StudentAuthMode = 'custom_token' | 'firebase_directory';

export interface StudentProfile {
  id: string;
  name: string;
  className: string;
  nis: string;
  nisn: string;
  gender: string;
  authMode?: StudentAuthMode;
  ownerUid?: string;
}

export function validateStoredStudentSession(params: {
  rawJson: string | null;
  uid: string;
  isAnonymous: boolean;
  claims?: Record<string, unknown>;
}): StudentProfile | null {
  if (!params.rawJson || !params.uid) return null;

  let parsed: Partial<StudentProfile>;
  try {
    parsed = JSON.parse(params.rawJson) as Partial<StudentProfile>;
  } catch {
    return null;
  }

  if (!parsed || !parsed.id || !parsed.name || !parsed.className) {
    return null;
  }

  const profile: StudentProfile = {
    id: String(parsed.id),
    name: String(parsed.name),
    className: String(parsed.className),
    nis: String(parsed.nis || ''),
    nisn: normalizeStudentNisn(String(parsed.nisn || '')),
    gender: String(parsed.gender || ''),
    authMode: parsed.authMode,
    ownerUid: typeof parsed.ownerUid === 'string' ? parsed.ownerUid : undefined,
  };

  if (params.isAnonymous) {
    if (profile.authMode !== 'firebase_directory') return null;
    if (!profile.ownerUid || profile.ownerUid !== params.uid) return null;
    return profile;
  }

  const claimRole = params.claims?.role;
  const claimStudentId = params.claims?.studentId;
  if (claimRole !== 'student' || typeof claimStudentId !== 'string') {
    return null;
  }
  if (profile.id !== claimStudentId) {
    return null;
  }

  return {
    ...profile,
    authMode: 'custom_token',
    ownerUid: params.uid,
  };
}

export function buildVerifiedStudentProfileFromDirectory(params: {
  normalizedNisn: string;
  ownerUid: string;
  lookupData: Record<string, unknown> | undefined;
  directoryData: Record<string, unknown> | undefined;
  directoryId: string;
}): StudentProfile {
  const lookup = params.lookupData;
  const directory = params.directoryData;

  if (!lookup || typeof lookup.studentId !== 'string' || !lookup.studentId) {
    throw new Error('NISN belum terdaftar atau belum disetujui admin.');
  }

  if (normalizeStudentNisn(String(lookup.nisn || '')) !== params.normalizedNisn) {
    throw new Error('NISN belum terdaftar atau belum disetujui admin.');
  }

  if (!directory || String(directory.status || '').toLowerCase() !== 'aktif') {
    throw new Error('NISN belum terdaftar atau belum disetujui admin.');
  }

  const name = String(directory.name || '').trim();
  const className = String(directory.className || '').trim();
  if (!name || !className) {
    throw new Error('Data kelas siswa belum lengkap. Hubungi admin sekolah.');
  }

  return {
    id: String(directory.id || params.directoryId || lookup.studentId),
    name,
    className,
    nis: '',
    nisn: params.normalizedNisn,
    gender: '',
    authMode: 'firebase_directory',
    ownerUid: params.ownerUid,
  };
}
