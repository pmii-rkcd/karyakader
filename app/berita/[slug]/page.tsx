// app/berita/[slug]/page.tsx
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ClientPage from './ClientPage'; 

// 🔥 GENERATE METADATA (Untuk SEO WA/FB)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const q = query(collection(db, 'articles'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { title: 'Berita Tidak Ditemukan - Karyakader.id' };
    }

    const article = querySnapshot.docs[0].data();
    let plainText = article.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
    const shortDesc = plainText.substring(0, 150) + '...';

    return {
      title: `${article.title} - Karyakader.id`,
      description: shortDesc,
      openGraph: {
        title: article.title,
        description: shortDesc,
        url: `https://karyakader.id/berita/${slug}`,
        siteName: 'Karya Kader',
        images: [{ url: article.imageUrl, width: 1200, height: 630, alt: article.title }],
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

// 🚀 SERVER PAGE
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  let jsonLd = null;

  try {
    const q = query(collection(db, 'articles'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const article = querySnapshot.docs[0].data();
      const datePublished = article.createdAt?.toDate().toISOString() || new Date().toISOString();
      const dateModified = article.updatedAt?.toDate().toISOString() || datePublished;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        image: [article.imageUrl],
        datePublished: datePublished,
        dateModified: dateModified,
        author: [{
          '@type': 'Person',
          name: article.kredit?.penulis || 'Redaksi',
          url: 'https://karyakader.id'
        }],
        publisher: {
          '@type': 'Organization',
          name: 'Karya Kader',
          logo: {
            '@type': 'ImageObject',
            url: 'https://karyakader.id/logo.png'
          }
        }
      };
    }
  } catch (error) {
    console.error("Gagal membuat JSON-LD:", error);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* PERBAIKAN UTAMA: 
          Kita harus memanggil ClientPage dan memastikan dia merender ulang 
          berdasarkan params yang baru.
      */}
      <ClientPage />
    </>
  );
}