// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // Mengizinkan semua robot (Google, Bing, Yahoo, dll)
      allow: '/',     // Boleh membaca semua halaman web utama
      disallow: [
        '/dashboard/', // MELARANG robot masuk ke area Admin
        '/login/',     // MELARANG robot membaca halaman Login
      ],
    },
    // Beritahu Google di mana letak Peta Situs-nya
    sitemap: 'https://karyakader.id/sitemap.xml', 
  };
}