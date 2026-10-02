import test from 'node:test';
import assert from 'node:assert/strict';
import { getShareImageUrl } from '../lib/social-image.ts';

test('share image normalizes Cloudinary uploads for social previews', () => {
  assert.equal(
    getShareImageUrl('https://res.cloudinary.com/dzxghc1vt/image/upload/v1790787430/f91dvjg0z4nvkdbftwd3.png'),
    'https://res.cloudinary.com/dzxghc1vt/image/upload/c_fill,w_1200,h_630,g_auto,f_jpg,q_auto/v1790787430/f91dvjg0z4nvkdbftwd3.png'
  );
});

test('share image falls back to site icon for missing or unsafe values', () => {
  assert.equal(getShareImageUrl(''), 'https://karyakader.id/icon.png');
  assert.equal(getShareImageUrl('javascript:alert(1)'), 'https://karyakader.id/icon.png');
});

test('share image keeps valid non Cloudinary absolute urls', () => {
  assert.equal(getShareImageUrl('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');
});
