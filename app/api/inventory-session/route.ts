import { NextResponse } from 'next/server';
import { createInventorySessionValue, hasInventoryPassword, inventoryCookieName, inventorySessionMaxAge, isInventorySessionConfigured, verifyInventorySessionValue } from '@/lib/inventory-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${inventoryCookieName()}=`))?.split('=').slice(1).join('=');
  return NextResponse.json({ ok: verifyInventorySessionValue(value) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isInventorySessionConfigured()) return NextResponse.json({ message: 'Sandi inventaris belum dikonfigurasi.' }, { status: 503 });
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ message: 'Permintaan login tidak valid.' }, { status: 400 }); }
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!hasInventoryPassword(password)) return NextResponse.json({ message: 'Sandi inventaris salah.' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(inventoryCookieName(), createInventorySessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: inventorySessionMaxAge(),
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(inventoryCookieName(), '', { path: '/', maxAge: 0 });
  return response;
}
