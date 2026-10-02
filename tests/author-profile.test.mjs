import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAuthorSlug, normalizeAuthorName, shouldCreateAuthorProfile } from '../lib/author-profile.ts';

test('author names are normalized before profile matching', () => {
  assert.equal(normalizeAuthorName('  Orva   Farihah   Arrosidah  '), 'Orva Farihah Arrosidah');
});

test('author slug is stable for duplicate prevention', () => {
  assert.equal(generateAuthorSlug('Orva Farihah Arrosidah'), 'orva-farihah-arrosidah');
  assert.equal(generateAuthorSlug('M. Faza Syihab'), 'm-faza-syihab');
});

test('default redaksi author is not auto-created', () => {
  assert.equal(shouldCreateAuthorProfile('Redaksi'), false);
  assert.equal(shouldCreateAuthorProfile('Orva Farihah Arrosidah'), true);
});
