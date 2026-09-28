import { adminDb } from '@/lib/firebase-admin';
import { requireInventoryAccess } from '@/lib/admin-access';
import { borrowerWhatsappNumber, createInventoryReceiptPdf } from '@/lib/inventory-receipt-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return Response.json({ message: 'WhatsApp Cloud API belum dikonfigurasi. Isi WHATSAPP_CLOUD_API_TOKEN dan WHATSAPP_PHONE_NUMBER_ID di environment.' }, { status: 501 });
    }
    const { id } = await params;
    if (!/^[\w-]{1,128}$/.test(id)) return Response.json({ message: 'ID kuitansi tidak valid.' }, { status: 400 });
    const snapshot = await adminDb.collection('inventory_requests').doc(id).get();
    const data = snapshot.data();
    if (!data) return Response.json({ message: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    if (data.status !== 'Disetujui' && data.status !== 'Dibatalkan') return Response.json({ message: 'Kuitansi hanya dapat dikirim untuk pengajuan yang pernah disetujui.' }, { status: 409 });
    const to = borrowerWhatsappNumber(data);
    if (!to) return Response.json({ message: 'Nomor WhatsApp peminjam belum tersedia.' }, { status: 400 });
    const settings = (await adminDb.collection('settings').doc('inventory').get()).data() || {};
    const pdf = createInventoryReceiptPdf(id, { ...data, inventoryOfficerName: settings.inventoryOfficerName });
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('file', new Blob([pdf], { type: 'application/pdf' }), `kuitansi-${id}.pdf`);
    const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const media = await mediaResponse.json();
    if (!mediaResponse.ok || typeof media.id !== 'string') {
      return Response.json({ message: media.error?.message || 'PDF kuitansi gagal diunggah ke WhatsApp.' }, { status: 502 });
    }
    const sendResponse = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { id: media.id, filename: `kuitansi-${id}.pdf`, caption: 'Kuitansi peminjaman inventaris Karya Kader.' },
      }),
    });
    const sent = await sendResponse.json();
    if (!sendResponse.ok) {
      return Response.json({ message: sent.error?.message || 'PDF kuitansi gagal dikirim ke WhatsApp.' }, { status: 502 });
    }
    return Response.json({ sent: true, to });
  } catch (error) {
    console.error('Gagal mengirim kuitansi WhatsApp:', error);
    return Response.json({ message: 'Kuitansi belum dapat dikirim ke WhatsApp.' }, { status: 503 });
  }
}
