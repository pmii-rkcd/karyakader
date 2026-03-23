// app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ⚠️ Ganti dengan domain utama Mas Ahmad saat sudah online nanti
  const baseUrl = 'https://karyakader.id'; 

  try {
    // 1. Ambil semua link Berita dari Firebase
    const articlesSnapshot = await getDocs(collection(db, 'articles'));
    const articles = articlesSnapshot.docs.map((doc) => {
      const data = doc.data();
      const date = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date();
      return {
        url: `${baseUrl}/berita/${data.slug}`,
        lastModified: date,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

    // 2. Ambil semua link Portofolio Penulis
    const authorsSnapshot = await getDocs(collection(db, 'authors'));
    const authors = authorsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/penulis/${data.slug || doc.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });

    // 3. Daftar Halaman Statis (Menu Utama)
    const staticRoutes = ['', '/bararasa', '/kabar', '/mutiara', '/nalar', '/tentang', '/penulis'].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.8,
    }));

    // Gabungkan semuanya dan berikan ke Google!
    return [...staticRoutes, ...articles, ...authors];
  } catch (error) {
    console.error("Gagal membuat sitemap:", error);
    // Jika gagal ambil database, tetap berikan halaman utama ke Google
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        priority: 1.0,
      }
    ];
  }
}