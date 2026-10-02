import test from 'node:test';
import assert from 'node:assert/strict';
import { getArticlePublishedDate, formatArticlePublishedDate } from '../lib/article-date.ts';

test('article published date prefers scheduled publishAt over createdAt', () => {
  const date = getArticlePublishedDate({
    createdAt: { seconds: 1790701200 },
    publishAt: { seconds: 1790787600 },
  });
  assert.equal(date?.toISOString(), '2026-09-30T17:00:00.000Z');
});

test('article published date falls back to createdAt', () => {
  const formatted = formatArticlePublishedDate({ createdAt: { seconds: 1790701200 } }, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
  assert.equal(formatted, '30 Sep 2026');
});
