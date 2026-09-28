import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { inventoryCookieName, verifyInventorySessionValue } from '@/lib/inventory-session';

function getCookie(request: Request, name: string): string | undefined {
  return request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}

export async function requireInventoryAccess(request: Request): Promise<Response | null> {
  if (verifyInventorySessionValue(getCookie(request, inventoryCookieName()))) return null;
  return requireAdmin(request);
}

export async function requireAdmin(request: Request): Promise<Response | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return Response.json({ message: 'Silakan login sebagai admin.' }, { status: 401 });
  let token;
  try { token = await adminAuth.verifyIdToken(header.slice(7), true); }
  catch { return Response.json({ message: 'Sesi tidak valid. Silakan login kembali.' }, { status: 401 }); }
  const admin = await adminDb.collection('admins').doc(token.uid).get();
  if (!admin.exists || admin.data()?.role !== 'admin') return Response.json({ message: 'Akses admin diperlukan.' }, { status: 403 });
  return null;
}
