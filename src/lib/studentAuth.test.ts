import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVerifiedStudentProfileFromDirectory,
  validateStoredStudentSession,
} from './studentAuth';

test('validateStoredStudentSession accepts custom_token session with matching student claim', () => {
  const saved = JSON.stringify({
    id: 'std-123',
    name: 'AHMAD',
    className: 'VII (Tujuh)',
    nis: '1001',
    nisn: '0099887766',
    gender: 'L',
  });

  const valid = validateStoredStudentSession({
    rawJson: saved,
    uid: 'student_std-123',
    isAnonymous: false,
    claims: { role: 'student', studentId: 'std-123' },
  });
  assert.equal(valid?.id, 'std-123');
  assert.equal(valid?.authMode, 'custom_token');

  const mismatch = validateStoredStudentSession({
    rawJson: saved,
    uid: 'student_other',
    isAnonymous: false,
    claims: { role: 'student', studentId: 'std-other' },
  });
  assert.equal(mismatch, null);
});

test('validateStoredStudentSession accepts firebase_directory anonymous session only for matching ownerUid', () => {
  const saved = JSON.stringify({
    id: 'std-456',
    name: 'AISYAH',
    className: 'VIII (Delapan)',
    nisn: '1234567890',
    authMode: 'firebase_directory',
    ownerUid: 'anon-uid-1',
  });

  const valid = validateStoredStudentSession({
    rawJson: saved,
    uid: 'anon-uid-1',
    isAnonymous: true,
  });
  assert.equal(valid?.id, 'std-456');
  assert.equal(valid?.name, 'AISYAH');

  const wrongUid = validateStoredStudentSession({
    rawJson: saved,
    uid: 'anon-uid-2',
    isAnonymous: true,
  });
  assert.equal(wrongUid, null);
});

test('buildVerifiedStudentProfileFromDirectory validates active student and exact NISN match', () => {
  const profile = buildVerifiedStudentProfileFromDirectory({
    normalizedNisn: '0011223344',
    ownerUid: 'anon-uid-9',
    lookupData: { studentId: 'std-9', nisn: '0011223344' },
    directoryData: { id: 'std-9', name: 'BUDI SANTOSO', className: 'IX (Sembilan)', status: 'Aktif' },
    directoryId: 'std-9',
  });

  assert.equal(profile.id, 'std-9');
  assert.equal(profile.name, 'BUDI SANTOSO');
  assert.equal(profile.className, 'IX (Sembilan)');
  assert.equal(profile.authMode, 'firebase_directory');
  assert.equal(profile.ownerUid, 'anon-uid-9');

  assert.throws(() =>
    buildVerifiedStudentProfileFromDirectory({
      normalizedNisn: '0011223344',
      ownerUid: 'anon-uid-9',
      lookupData: { studentId: 'std-9', nisn: '9999999999' },
      directoryData: { id: 'std-9', name: 'BUDI SANTOSO', className: 'IX (Sembilan)', status: 'Aktif' },
      directoryId: 'std-9',
    })
  );

  assert.throws(() =>
    buildVerifiedStudentProfileFromDirectory({
      normalizedNisn: '0011223344',
      ownerUid: 'anon-uid-9',
      lookupData: { studentId: 'std-9', nisn: '0011223344' },
      directoryData: { id: 'std-9', name: 'BUDI SANTOSO', className: 'IX (Sembilan)', status: 'menunggu' },
      directoryId: 'std-9',
    })
  );
});
