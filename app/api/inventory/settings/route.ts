import { adminDb } from '@/lib/firebase-admin';
import { requireInventoryAccess } from '@/lib/admin-access';
import { inventoryWhatsappFallback, normalizeWhatsappNumber, validateCloudinaryImageUrl, validateInventoryOfficerName, validateQrisImageUrl, validateWhatsappNumber } from '@/lib/inventory-settings';
import { validateQrisPayload } from '@/lib/qris';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const settingsRef = () => adminDb.collection('settings').doc('inventory');
const defaultOfficerName = 'Moh. Alfiyan Efendi';

export async function GET() {
  try {
    const snapshot = await settingsRef().get();
    const data = snapshot.data();
    const stored = data?.whatsappNumber;
    const whatsappNumber = typeof stored === 'string' && !validateWhatsappNumber(stored) ? normalizeWhatsappNumber(stored) : inventoryWhatsappFallback();
    const qrisImageUrl = typeof data?.qrisImageUrl === 'string' && !validateQrisImageUrl(data.qrisImageUrl) ? data.qrisImageUrl : '';
    const qrisPayload = typeof data?.qrisPayload === 'string' && !validateQrisPayload(data.qrisPayload) ? data.qrisPayload : '';
    const inventoryOfficerName = typeof data?.inventoryOfficerName === 'string' && !validateInventoryOfficerName(data.inventoryOfficerName) ? data.inventoryOfficerName : defaultOfficerName;
    const stampImageUrl = typeof data?.stampImageUrl === 'string' && !validateCloudinaryImageUrl(data.stampImageUrl, 'Gambar stempel') ? data.stampImageUrl : '';
    const signatureImageUrl = typeof data?.signatureImageUrl === 'string' && !validateCloudinaryImageUrl(data.signatureImageUrl, 'Gambar tanda tangan') ? data.signatureImageUrl : '';
    return Response.json({ settings: { whatsappNumber, qrisImageUrl, qrisPayload, inventoryOfficerName, stampImageUrl, signatureImageUrl } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Gagal membaca pengaturan inventaris:', error);
    return Response.json({ settings: { whatsappNumber: inventoryWhatsappFallback(), qrisImageUrl: '', qrisPayload: '', inventoryOfficerName: defaultOfficerName, stampImageUrl: '', signatureImageUrl: '' } }, { headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ message: 'Data pengaturan tidak valid.' }, { status: 400 }); }
    const rawWhatsappNumber = body && typeof body === 'object' && !Array.isArray(body) ? (body as { whatsappNumber?: unknown }).whatsappNumber : undefined;
    const rawQrisImageUrl = body && typeof body === 'object' && !Array.isArray(body) ? (body as { qrisImageUrl?: unknown }).qrisImageUrl : undefined;
    const rawQrisPayload = body && typeof body === 'object' && !Array.isArray(body) ? (body as { qrisPayload?: unknown }).qrisPayload : undefined;
    const rawInventoryOfficerName = body && typeof body === 'object' && !Array.isArray(body) ? (body as { inventoryOfficerName?: unknown }).inventoryOfficerName : undefined;
    const rawStampImageUrl = body && typeof body === 'object' && !Array.isArray(body) ? (body as { stampImageUrl?: unknown }).stampImageUrl : undefined;
    const rawSignatureImageUrl = body && typeof body === 'object' && !Array.isArray(body) ? (body as { signatureImageUrl?: unknown }).signatureImageUrl : undefined;
    if (typeof rawWhatsappNumber !== 'string') return Response.json({ message: 'Nomor WhatsApp wajib diisi.' }, { status: 400 });
    const validation = validateWhatsappNumber(rawWhatsappNumber);
    if (validation) return Response.json({ message: validation }, { status: 400 });
    if (rawQrisImageUrl !== undefined && typeof rawQrisImageUrl !== 'string') return Response.json({ message: 'URL QRIS tidak valid.' }, { status: 400 });
    const qrisValidation = validateQrisImageUrl(rawQrisImageUrl || '');
    if (qrisValidation) return Response.json({ message: qrisValidation }, { status: 400 });
    if (rawQrisPayload !== undefined && typeof rawQrisPayload !== 'string') return Response.json({ message: 'Payload QRIS tidak valid.' }, { status: 400 });
    const qrisPayloadValidation = validateQrisPayload(rawQrisPayload || '');
    if (qrisPayloadValidation) return Response.json({ message: qrisPayloadValidation }, { status: 400 });
    if (rawInventoryOfficerName !== undefined && typeof rawInventoryOfficerName !== 'string') return Response.json({ message: 'Nama pengurus inventaris tidak valid.' }, { status: 400 });
    const officerValidation = validateInventoryOfficerName(rawInventoryOfficerName || defaultOfficerName);
    if (officerValidation) return Response.json({ message: officerValidation }, { status: 400 });
    if (rawStampImageUrl !== undefined && typeof rawStampImageUrl !== 'string') return Response.json({ message: 'URL stempel tidak valid.' }, { status: 400 });
    const stampValidation = validateCloudinaryImageUrl(rawStampImageUrl || '', 'Gambar stempel');
    if (stampValidation) return Response.json({ message: stampValidation }, { status: 400 });
    if (rawSignatureImageUrl !== undefined && typeof rawSignatureImageUrl !== 'string') return Response.json({ message: 'URL tanda tangan tidak valid.' }, { status: 400 });
    const signatureValidation = validateCloudinaryImageUrl(rawSignatureImageUrl || '', 'Gambar tanda tangan');
    if (signatureValidation) return Response.json({ message: signatureValidation }, { status: 400 });
    const whatsappNumber = normalizeWhatsappNumber(rawWhatsappNumber);
    const qrisImageUrl = rawQrisImageUrl || '';
    const qrisPayload = (rawQrisPayload || '').trim().replace(/[\r\n\t]+/g, '');
    const inventoryOfficerName = (rawInventoryOfficerName || defaultOfficerName).trim();
    const stampImageUrl = rawStampImageUrl || '';
    const signatureImageUrl = rawSignatureImageUrl || '';
    await settingsRef().set({ whatsappNumber, qrisImageUrl, qrisPayload, inventoryOfficerName, stampImageUrl, signatureImageUrl, updatedAt: new Date().toISOString() }, { merge: true });
    return Response.json({ settings: { whatsappNumber, qrisImageUrl, qrisPayload, inventoryOfficerName, stampImageUrl, signatureImageUrl } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Gagal menyimpan pengaturan inventaris:', error);
    return Response.json({ message: 'Pengaturan belum tersimpan. Silakan coba lagi.' }, { status: 503 });
  }
}
