import { adminDb } from '@/lib/firebase-admin';
import { requireInventoryAccess } from '@/lib/admin-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    const { id, kind } = await params;
    if (!/^[\w-]{1,128}$/.test(id) || !['letter', 'payment'].includes(kind)) return new Response(null, { status: 400 });
    const snapshot = await adminDb.collection('inventory_requests').doc(id).get();
    const file = snapshot.data()?.files?.[kind];
    if (!file) return new Response(null, { status: 404 });
    const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
    return new Response(new Uint8Array(file.bytes), { headers: {
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${kind === 'letter' ? 'surat-peminjaman' : 'bukti-pembayaran'}-${id}.${extension}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    } });
  } catch { return Response.json({ message: 'Berkas belum dapat diunduh.' }, { status: 503 }); }
}
