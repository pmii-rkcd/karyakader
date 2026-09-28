import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireInventoryAccess } from '@/lib/admin-access';
import { calculateRentalCost, maxReservedQuantityForRange, rentalUnits } from '@/lib/inventory';
import { detectRentalFileType, MAX_RENTAL_FILE_SIZE } from '@/lib/rental-files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    const snapshot = await adminDb.collection('inventory_requests').orderBy('createdAt', 'desc').limit(100)
      .select('borrowerName', 'phone', 'institution', 'itemId', 'itemName', 'price', 'unit', 'createdAt', 'status', 'startDate', 'endDate', 'quantity', 'days', 'billedUnits', 'totalCost', 'decidedAt').get();
    return Response.json({ requests: snapshot.docs.map(doc => {
      const data = doc.data();
      const recalculated = typeof data.startDate === 'string' && typeof data.endDate === 'string' && Number.isSafeInteger(data.quantity) && Number.isSafeInteger(data.price) && rentalUnits.includes(data.unit)
        ? calculateRentalCost({ startDate: data.startDate, endDate: data.endDate, quantity: data.quantity, price: data.price, unit: data.unit })
        : null;
      return { id: doc.id, ...data, ...(recalculated ? { days: recalculated.days, billedUnits: recalculated.billedUnits, totalCost: recalculated.total } : {}), createdAt: data.createdAt?.toDate().toISOString() || null };
    }) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Gagal membaca pengajuan inventaris:', error);
    return Response.json({ message: 'Pengajuan belum dapat dimuat.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 900 * 1024) return Response.json({ message: 'Berkas terlalu besar. Maksimal 400 KB per berkas.' }, { status: 413 });
    let form;
    try { form = await request.formData(); }
    catch { return Response.json({ message: 'Formulir tidak valid.' }, { status: 400 }); }
    const name = form.get('borrowerName');
    const rawPhone = form.get('phone');
    const phone = typeof rawPhone === 'string' ? rawPhone.replace(/[\s()-]/g, '') : '';
    if (typeof rawPhone !== 'string' || rawPhone.length > 30 || !/^\+?[0-9]{8,15}$/.test(phone)) {
      return Response.json({ message: 'Nomor HP wajib diisi dengan 8-15 digit angka. Contoh: 081234567890 atau +6281234567890.' }, { status: 400 });
    }
    const institution = form.get('institution');
    const itemId = form.get('itemId');
    const requestId = form.get('requestId');
    const startDate = form.get('startDate');
    const endDate = form.get('endDate');
    const rawQuantity = form.get('quantity');
    const requestedQuantity = typeof rawQuantity === 'string' ? Number(rawQuantity) : NaN;
    if (typeof name !== 'string' || !name.trim() || name.length > 150 || typeof institution !== 'string' || !institution.trim() || institution.length > 200 || typeof itemId !== 'string' || !/^[\w-]{1,128}$/.test(itemId) || typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(requestId)) {
      return Response.json({ message: 'Nama peminjam, asal instansi, dan barang wajib diisi dengan benar.' }, { status: 400 });
    }
    if (typeof startDate !== 'string' || typeof endDate !== 'string' || !Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1) {
      return Response.json({ message: 'Tanggal sewa dan jumlah barang wajib diisi dengan benar.' }, { status: 400 });
    }
    const files: Record<string, { bytes: Buffer; type: string }> = {};
    for (const key of ['letter', 'payment']) {
      const file = form.get(key);
      if (!(file instanceof File) || file.size === 0 || file.size > MAX_RENTAL_FILE_SIZE) return Response.json({ message: 'Surat dan bukti pembayaran wajib diunggah, maksimal 400 KB per berkas.' }, { status: 400 });
      const bytes = Buffer.from(await file.arrayBuffer());
      const type = detectRentalFileType(bytes);
      if (!type) return Response.json({ message: 'Berkas harus berupa PDF, JPG, atau PNG.' }, { status: 400 });
      files[key] = { bytes, type };
    }
    const reference = adminDb.collection('inventory_requests').doc(requestId);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const throttle = adminDb.collection('inventory_request_limits').doc(createHash('sha256').update(ip).digest('hex'));
    const result = await adminDb.runTransaction(async transaction => {
      const existing = await transaction.get(reference);
      if (existing.exists) return 200;
      const item = await transaction.get(adminDb.collection('inventory').doc(itemId));
      const limit = await transaction.get(throttle);
      if (!item.exists || item.data()?.status === 'Perawatan' || item.data()?.quantity < 1) return 409;
      if (requestedQuantity > item.data()!.quantity) return 409;
      const cost = calculateRentalCost({ startDate, endDate, quantity: requestedQuantity, price: item.data()!.price, unit: item.data()!.unit });
      if (!cost) return 400;
      const now = Date.now();
      const recent = now - Number(limit.data()?.startedAt || 0) < 3600000;
      const count = recent ? Number(limit.data()?.count || 0) : 0;
      if (count >= 5) return 429;
      transaction.set(throttle, { count: count + 1, startedAt: recent ? limit.data()!.startedAt : now });
      transaction.create(reference, { borrowerName: name.trim(), phone, institution: institution.trim(), itemId, itemName: item.data()!.name, price: item.data()!.price, unit: item.data()!.unit, startDate, endDate, quantity: requestedQuantity, days: cost.days, billedUnits: cost.billedUnits, totalCost: cost.total, status: 'Menunggu verifikasi', createdAt: FieldValue.serverTimestamp(), files });
      return 201;
    });
    if (result === 400) return Response.json({ message: 'Tanggal sewa dan jumlah barang wajib diisi dengan benar.' }, { status: 400 });
    if (result === 409) return Response.json({ message: 'Barang sudah tidak tersedia. Silakan pilih barang lain.' }, { status: 409 });
    if (result === 429) return Response.json({ message: 'Terlalu banyak pengajuan. Silakan coba lagi dalam satu jam.' }, { status: 429 });
    return Response.json({ id: requestId, message: 'Pengajuan berhasil dikirim. Menunggu verifikasi pengurus.' }, { status: result });
  } catch (error) {
    console.error('Gagal menyimpan pengajuan inventaris:', error);
    return Response.json({ message: 'Pengajuan belum dapat dikirim. Silakan coba lagi.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ message: 'Permintaan tidak valid.' }, { status: 400 }); }
    const { id, action } = body as { id?: unknown; action?: unknown };
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id) || (action !== 'approve' && action !== 'reject' && action !== 'cancel')) {
      return Response.json({ message: 'Aksi persetujuan tidak valid.' }, { status: 400 });
    }
    const reference = adminDb.collection('inventory_requests').doc(id);
    const result = await adminDb.runTransaction(async transaction => {
      const requestSnapshot = await transaction.get(reference);
      if (!requestSnapshot.exists) return { status: 404 as const };
      const rental = requestSnapshot.data()!;
      if (action === 'cancel') {
        if (rental.status !== 'Disetujui') return { status: 409 as const, message: 'Hanya pinjaman yang sudah disetujui yang dapat dibatalkan.' };
        transaction.update(reference, { status: 'Dibatalkan', canceledAt: FieldValue.serverTimestamp() });
        if (typeof rental.itemId === 'string') transaction.update(adminDb.collection('inventory').doc(rental.itemId), { status: 'Tersedia', rentalRevision: FieldValue.increment(1) });
        return { status: 200 as const, data: { id, ...rental, status: 'Dibatalkan' } };
      }
      if (rental.status !== 'Menunggu verifikasi') return { status: 409 as const, message: 'Pengajuan ini sudah diputuskan.' };
      if (action === 'reject') {
        transaction.update(reference, { status: 'Ditolak', decidedAt: FieldValue.serverTimestamp() });
        return { status: 200 as const, data: { id, ...rental, status: 'Ditolak' } };
      }
      const validSchedule = typeof rental.itemId === 'string' && typeof rental.startDate === 'string' && typeof rental.endDate === 'string' && Number.isSafeInteger(rental.quantity) && rental.quantity > 0;
      if (!validSchedule) return { status: 400 as const, message: 'Pengajuan lama belum memiliki tanggal sewa dan jumlah barang.' };
      const itemRef = adminDb.collection('inventory').doc(rental.itemId);
      const item = await transaction.get(itemRef);
      if (!item.exists || item.data()?.status === 'Perawatan') return { status: 409 as const, message: 'Barang belum tersedia untuk disetujui.' };
      const approved = await transaction.get(adminDb.collection('inventory_requests').where('itemId', '==', rental.itemId).where('status', '==', 'Disetujui'));
      const bookings = approved.docs.filter(doc => doc.id !== id).map(doc => {
        const data = doc.data();
        return { startDate: String(data.startDate || ''), endDate: String(data.endDate || ''), quantity: Number(data.quantity || 0) };
      });
      const reserved = maxReservedQuantityForRange(bookings, rental.startDate, rental.endDate);
      if (reserved + rental.quantity > item.data()!.quantity) return { status: 409 as const, message: 'Stok pada tanggal tersebut tidak cukup.' };
      transaction.update(reference, { status: 'Disetujui', decidedAt: FieldValue.serverTimestamp() });
      transaction.update(itemRef, { rentalRevision: FieldValue.increment(1) });
      return { status: 200 as const, data: { id, ...rental, status: 'Disetujui' } };
    });
    if (result.status !== 200) return Response.json({ message: result.message || 'Pengajuan tidak dapat diproses.' }, { status: result.status });
    return Response.json({ request: result.data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Gagal memproses persetujuan inventaris:', error);
    return Response.json({ message: 'Persetujuan belum dapat diproses.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireInventoryAccess(request);
    if (denied) return denied;
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ message: 'Permintaan tidak valid.' }, { status: 400 }); }
    const { id } = body as { id?: unknown };
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) {
      return Response.json({ message: 'ID pengajuan tidak valid.' }, { status: 400 });
    }
    const reference = adminDb.collection('inventory_requests').doc(id);
    const result = await adminDb.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return { status: 404 as const };
      const rental = snapshot.data()!;
      transaction.delete(reference);
      if (rental.status === 'Disetujui' && typeof rental.itemId === 'string') {
        transaction.update(adminDb.collection('inventory').doc(rental.itemId), { status: 'Tersedia', rentalRevision: FieldValue.increment(1) });
      }
      return { status: 200 as const };
    });
    if (result.status !== 200) return Response.json({ message: 'Pengajuan tidak ditemukan.' }, { status: result.status });
    return Response.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Gagal menghapus pengajuan inventaris:', error);
    return Response.json({ message: 'Pengajuan belum dapat dihapus.' }, { status: 503 });
  }
}
