// app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://karyakader.id'; // Pastikan ini domain aslimu

  // 1. Mendaftarkan Halaman Statis (Kanal)
  const staticRoutes = ['', '/kabar', '/bararasa', '/nalar', '/mutiara'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Mendaftarkan Seluruh Berita Secara Dinamis
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    dynamicRoutes = querySnapshot.docs.map((doc) => {
      const article = doc.data();
      // Ambil waktu update terakhir, atau waktu terbit jika belum pernah di-update
      const lastMod = article.updatedAt?.toDate() || article.createdAt?.toDate() || new Date();

      return {
        url: `${baseUrl}/berita/${article.slug}`,
        lastModified: lastMod,
        changeFrequency: 'never' as const,
        priority: 0.6, // Prioritas artikel standar
      };
    });
  } catch (error) {
    console.error("Gagal membuat sitemap:", error);
  }

  // Gabungkan halaman statis dan halaman berita
  return [...staticRoutes, ...dynamicRoutes];
}