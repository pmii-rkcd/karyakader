import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireInventoryAccess } from '@/lib/admin-access';
import { maxReservedQuantityForRange, validateInventory, type InventoryItem } from '@/lib/inventory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicItem(id: string, data: FirebaseFirestore.DocumentData, rentedQuantity = 0): InventoryItem {
  const quantity = Number(data.quantity || 0);
  const availableQuantity = Math.max(quantity - rentedQuantity, 0);
  const status = data.status === 'Perawatan' ? 'Perawatan' : availableQuantity > 0 ? 'Tersedia' : 'Sedang disewa';
  return { id, name: data.name, description: data.description || '', price: data.price, unit: data.unit, quantity, status, imageUrl: data.imageUrl || '', rentedQuantity, availableQuantity };
}

export async function GET() {
  try {
    const [snapshot, approved] = await Promise.all([
      adminDb.collection('inventory').get(),
      adminDb.collection('inventory_requests').where('status', '==', 'Disetujui').get(),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const approvedByItem = new Map<string, Array<{ startDate: string; endDate: string; quantity: number }>>();
    for (const doc of approved.docs) {
      const data = doc.data();
      if (typeof data.itemId !== 'string') continue;
      const entries = approvedByItem.get(data.itemId) || [];
      entries.push({ startDate: String(data.startDate || ''), endDate: String(data.endDate || ''), quantity: Number(data.quantity || 0) });
      approvedByItem.set(data.itemId, entries);
    }
    const items = snapshot.docs.map(doc => publicItem(doc.id, doc.data(), maxReservedQuantityForRange(approvedByItem.get(doc.id) || [], today, today))).sort((a, b) => a.name.localeCompare(b.name, 'id'));
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Gagal membaca inventaris:', error);
    return NextResponse.json({ message: 'Daftar barang gagal dimuat dari server. Silakan coba lagi.' }, { status: 503 });
  }
}

async function mutate(request: Request) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;

    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ message: 'Data barang tidak valid.' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ message: 'Data barang tidak valid.' }, { status: 400 });
    const isNew = request.method === 'POST';
    if (!isNew && (typeof body.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.id))) return NextResponse.json({ message: 'ID barang tidak valid.' }, { status: 400 });
    const reference = isNew ? adminDb.collection('inventory').doc() : adminDb.collection('inventory').doc(body.id);

    if (request.method === 'DELETE') {
      await reference.delete();
      return NextResponse.json({ deleted: true });
    }
    const data = { name: body.name, description: body.description, price: body.price, unit: body.unit, quantity: body.quantity, status: body.status, imageUrl: body.imageUrl };
    const validation = validateInventory(data);
    if (validation) return NextResponse.json({ message: validation }, { status: 400 });
    data.name = data.name.trim(); data.description = data.description.trim();
    if (isNew) await reference.create({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    else await reference.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ item: publicItem(reference.id, data) }, { status: isNew ? 201 : 200 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 5) {
      return NextResponse.json({ message: 'Barang sudah tidak ditemukan. Muat ulang daftar barang.' }, { status: 404 });
    }
    console.error('Gagal mengubah inventaris:', error);
    return NextResponse.json({ message: 'Perubahan belum tersimpan di server. Silakan coba lagi.' }, { status: 503 });
  }
}

export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
