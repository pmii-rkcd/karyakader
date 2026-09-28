import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { adminDb } from '@/lib/firebase-admin';
import { requireInventoryAccess } from '@/lib/admin-access';
import { renderInventoryReceiptHtml } from '@/lib/inventory-receipt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function defaultStampDataUri() {
  const bytes = await readFile(path.join(process.cwd(), 'public', 'stempel-chondro.png'));
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    const { id } = await params;
    if (!/^[\w-]{1,128}$/.test(id)) return new Response(null, { status: 400 });
    const snapshot = await adminDb.collection('inventory_requests').doc(id).get();
    const data = snapshot.data();
    if (!data) return new Response(null, { status: 404 });
    if (data.status !== 'Disetujui' && data.status !== 'Dibatalkan') return Response.json({ message: 'Kuitansi hanya tersedia untuk pengajuan yang pernah disetujui.' }, { status: 409 });
    const settings = (await adminDb.collection('settings').doc('inventory').get()).data() || {};
    return new Response(renderInventoryReceiptHtml(id, { ...data, inventoryOfficerName: settings.inventoryOfficerName, stampImageUrl: settings.stampImageUrl || await defaultStampDataUri(), signatureImageUrl: settings.signatureImageUrl }), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return Response.json({ message: 'Kuitansi belum dapat dibuat.' }, { status: 503 });
  }
}
