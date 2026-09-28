import { auth } from '@/lib/firebase';
import type { InventoryItem } from '@/lib/inventory';

export async function loadInventory(signal?: AbortSignal): Promise<InventoryItem[]> {
  const response = await fetch('/api/inventory', { cache: 'no-store', signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Daftar barang gagal dimuat.');
  return data.items;
}

export async function changeInventory(method: 'POST' | 'PATCH' | 'DELETE', body: object): Promise<{ item: InventoryItem }> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : '';
  const response = await fetch('/api/inventory', {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Perubahan belum tersimpan. Silakan coba lagi.');
  return data;
}
