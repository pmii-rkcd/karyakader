import test from 'node:test';
import assert from 'node:assert/strict';
import { detectRentalFileType, MAX_RENTAL_FILE_SIZE } from '../lib/rental-files.ts';

test('rental attachments use supported signatures rather than trusting filenames', () => {
  assert.equal(detectRentalFileType(Buffer.from('%PDF-1.7\n')), 'application/pdf');
  assert.equal(detectRentalFileType(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(detectRentalFileType(Uint8Array.from([255, 216, 255, 224])), 'image/jpeg');
  assert.equal(detectRentalFileType(Buffer.from('<svg onload="alert(1)">')), null);
  assert.equal(detectRentalFileType(new Uint8Array()), null);
  assert.ok(MAX_RENTAL_FILE_SIZE * 2 < 1024 * 1024 - 10000);
});
