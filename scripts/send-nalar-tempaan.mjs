// Usage: node --env-file=.env.local scripts/send-nalar-tempaan.mjs article.json
// Connection check: replace article.json with --check. Secrets stay in env files.
import { readFile } from 'node:fs/promises';

async function main() {
  const endpoint = process.env.NALAR_TEMPAAN_ENDPOINT;
  const token = process.env.NALAR_TEMPAAN_INGEST_TOKEN;
  if (!endpoint || !token || token.length < 32) throw new Error('Isi NALAR_TEMPAAN_ENDPOINT dan token minimal 32 karakter pada environment lokal.');
  const url = new URL(endpoint);
  if (url.username || url.password || url.search || url.hash) throw new Error('URL endpoint tidak boleh berisi kredensial, parameter, atau fragmen.');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Gunakan endpoint HTTPS atau localhost untuk pengujian.');
  if (url.pathname !== '/api/nalar-tempaan') throw new Error('Alamat endpoint harus berakhir /api/nalar-tempaan.');
  const file = process.argv[2];
  if (!file) throw new Error('Sertakan lokasi JSON artikel atau --check.');
  const check = file === '--check';
  const body = check ? undefined : JSON.stringify(JSON.parse(await readFile(file, 'utf8')));
  if (body && Buffer.byteLength(body) > 64 * 1024) throw new Error('JSON artikel maksimal 64 KiB.');
  const response = await fetch(url, {
    method: check ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, ...(check ? {} : { 'Content-Type': 'application/json' }) },
    body, redirect: 'error', signal: AbortSignal.timeout(30000),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error(`Server tidak mengirim JSON (HTTP ${response.status}). Periksa deployment dan perlindungan akses hosting.`); }
  if (!response.ok || result.ok !== true) throw new Error(`Pengiriman belum berhasil (HTTP ${response.status}): ${result.message || 'Permintaan ditolak server.'}`);
  if (check) console.log(`Koneksi ke penyimpanan berhasil. Mode penerima: ${result.mode}.`);
  else console.log(result.duplicate ? 'Edisi sudah diterima sebelumnya; artikel yang ada tidak diubah.' : `${result.mode === 'publish' ? 'Artikel berhasil diterbitkan' : 'Draf berhasil disimpan'}. ID: ${result.id}`);
}

main().catch(() => {
  // Avoid printing nested fetch errors that can include request metadata.
  console.error('Operasi belum berhasil. Periksa konfigurasi, JSON, jaringan, serta log server. Tidak ada keberhasilan yang dikonfirmasi.');
  process.exitCode = 1;
});
