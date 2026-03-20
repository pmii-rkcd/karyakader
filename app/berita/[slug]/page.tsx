import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ClientPage from './ClientPage'; // Memanggil halaman aslimu

// 🔥 PERBAIKAN: Tipe data params diubah menjadi Promise (Standar Next.js 15)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // 🔥 PERBAIKAN: Gunakan await untuk membuka (unwrap) Promise
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const q = query(collection(db, 'articles'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { title: 'Berita Tidak Ditemukan - Karyakader.id' };
    }

    const article = querySnapshot.docs[0].data();

    // Sapu bersih tag HTML untuk mengambil 150 huruf pertama sebagai deskripsi di WA/FB
    let plainText = article.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
    const shortDesc = plainText.substring(0, 150) + '...';

    return {
      title: `${article.title} - Karyakader.id`,
      description: shortDesc,
      openGraph: {
        title: article.title,
        description: shortDesc,
        url: `https://karyakader.id/berita/${slug}`, // Link asli website kamu nantinya
        siteName: 'Karya Kader',
        images: [
          {
            url: article.imageUrl,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        locale: 'id_ID',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: shortDesc,
        images: [article.imageUrl],
      },
    };
  } catch (error) {
    return { title: 'Karyakader.id - Portal Berita Pergerakan' };
  }
}

// Render tampilan halaman beritamu yang asli
export default function Page() {
  return <ClientPage />;
}