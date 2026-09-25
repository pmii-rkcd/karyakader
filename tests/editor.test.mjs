import test from 'node:test';
import assert from 'node:assert/strict';
import { createImageUploader } from '../lib/quill-image-uploader.ts';
import { uploadImageToCloudinary } from '../lib/upload-image.ts';
import { isPublicArticle } from '../lib/article-visibility.ts';

function editorFixture(upload) {
  const inserted = [];
  const errors = [];
  const statuses = [];
  const pending = { current: false };
  let enabled = true;
  const editor = {
    root: { isConnected: true },
    isEnabled: () => enabled,
    enable: () => { enabled = true; },
    disable: () => { enabled = false; },
    insertEmbed: (...args) => { assert.equal(enabled, true); inserted.push(args); },
    setSelection: () => {},
  };
  const uploader = createImageUploader({ pending, upload, onError: value => errors.push(value), onStatus: value => statuses.push(value) });
  const run = () => uploader.handler.call({ quill: editor }, { index: 5, length: 0 }, [new File(['photo'], 'photo.webp', { type: 'image/webp' })]);
  return { editor, inserted, errors, statuses, pending, run };
}

test('inline upload inserts the hosted URL at the cursor and unlocks editor', async () => {
  const fixture = editorFixture(async () => 'https://example.com/photo.webp');
  await fixture.run();
  assert.deepEqual(fixture.inserted, [[5, 'image', 'https://example.com/photo.webp', 'user']]);
  assert.deepEqual(fixture.statuses, [true, false]);
  assert.equal(fixture.pending.current, false);
  assert.equal(fixture.editor.isEnabled(), true);
});

test('failed upload leaves text untouched and allows retry', async () => {
  const fixture = editorFixture(async () => { throw new Error('Upload failed'); });
  await fixture.run();
  assert.deepEqual(fixture.inserted, []);
  assert.equal(fixture.errors.at(-1), 'Upload failed');
  assert.equal(fixture.pending.current, false);
  assert.equal(fixture.editor.isEnabled(), true);
});

test('concurrent image uploads are ignored while editor is locked', async () => {
  let finish;
  let calls = 0;
  const fixture = editorFixture(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const first = fixture.run();
  assert.equal(fixture.pending.current, true);
  assert.equal(fixture.editor.isEnabled(), false);
  await fixture.run();
  assert.equal(calls, 1);
  finish('https://example.com/photo.webp');
  await first;
  assert.equal(fixture.inserted.length, 1);
});

test('upload finishing after editor is unmounted does not insert content', async () => {
  const fixture = editorFixture(async () => 'https://example.com/photo.webp');
  fixture.editor.root.isConnected = false;
  await fixture.run();
  assert.deepEqual(fixture.inserted, []);
  assert.equal(fixture.pending.current, false);
});

test('draft flags are hidden and legacy published articles remain visible', () => {
  assert.equal(isPublicArticle({ status: 'Draft' }), false);
  assert.equal(isPublicArticle({ published: false }), false);
  assert.equal(isPublicArticle({ status: 'Draft', published: true }), false);
  assert.equal(isPublicArticle({ status: 'Langsung Terbit', published: true }), true);
  assert.equal(isPublicArticle({}), true);
});

test('Cloudinary upload validates configuration, response and request body', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.cloudinary.com/v1_1/test-cloud/image/upload');
    assert.equal(options.body.get('upload_preset'), 'test-preset');
    assert.equal(options.body.get('file').name, 'photo.webp');
    return { ok: true, json: async () => ({ secure_url: 'https://example.com/photo.webp' }) };
  });
  const oldCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const oldPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  t.after(() => {
    for (const [key, value] of [['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', oldCloud], ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', oldPreset]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';
  const file = new File(['photo'], 'photo.webp', { type: 'image/webp' });
  assert.equal(await uploadImageToCloudinary(null), '');
  assert.equal(await uploadImageToCloudinary(file), 'https://example.com/photo.webp');
  for (const response of [{ ok: false, json: async () => ({}) }, { ok: true, json: async () => ({}) }]) {
    globalThis.fetch.mock.mockImplementation(async () => response);
    await assert.rejects(uploadImageToCloudinary(file), /Gagal mengunggah/);
  }
  delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  await assert.rejects(uploadImageToCloudinary(file), /Konfigurasi/);
});
