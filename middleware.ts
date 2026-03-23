// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 🔥 Mengecek apakah pengunjung mengakses sub-domain penulis 🔥
  // Tambahkan juga localhost:3000 kalau Mas Ahmad ingin tes di komputer lokal dengan trik khusus
  if (hostname === 'penulis.karyakader.id') {
    
    // Jika path belum berawalan /penulis, maka kita "rewrite" secara internal ke folder /penulis
    // Contoh: penulis.karyakader.id/ -> diarahkan ke folder /penulis
    // Contoh: penulis.karyakader.id/ahmad -> diarahkan ke folder /penulis/ahmad
    if (!url.pathname.startsWith('/penulis')) {
      url.pathname = `/penulis${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Jika yang diakses adalah karyakader.id biasa, biarkan berjalan normal
  return NextResponse.next();
}

// Konfigurasi ini agar middleware tidak mengganggu aset gambar, font, atau API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};