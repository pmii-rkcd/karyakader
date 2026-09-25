import { isPublicArticle } from '@/lib/article-visibility';
// app/penulis/[slug]/page.tsx
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import DetailPenulisClient from './ClientPage';
import Link from 'next/link';
import type { DocumentData } from 'firebase/firestore';
import type { AuthorProfile, PortfolioArticle } from '@/lib/content-types';

// 🔥 MESIN PEMBUAT SEO OTOMATIS (Untuk WA / Facebook) 🔥
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slugOrId = resolvedParams.slug;

  try {
    let authorData: DocumentData | null = null;

    // Cari pakai SLUG dulu
    const q = query(collection(db, 'authors'), where('slug', '==', slugOrId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      authorData = querySnapshot.docs[0].data();
    } else {
      // Cadangan: Cari pakai ID acak
      const docRef = doc(db, 'authors', slugOrId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        authorData = docSnap.data();
      }
    }

    if (!authorData) {
      return { title: 'Penulis Tidak Ditemukan - Karya Kader' };
    }

    return {
      title: `${authorData.name} - Portofolio Kader`,
      description: authorData.bio || `Kenali profil dan karya-karya hebat dari ${authorData.name}, ${authorData.role} PMII Kawah Chondrodimuko.`,
      openGraph: {
        title: `${authorData.name} - Portofolio Kader`,
        description: authorData.bio || `Kenali profil dan karya-karya hebat dari ${authorData.name}, ${authorData.role} PMII Kawah Chondrodimuko.`,
        url: `https://penulis.karyakader.id/${slugOrId}`, // Sesuaikan dengan domain Mas Ahmad
        siteName: 'Karya Kader',
        images: [{ url: authorData.imageUrl || '/icon.png', width: 800, height: 800, alt: authorData.name }],
        locale: 'id_ID',
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${authorData.name} - Portofolio Kader`,
        description: authorData.bio,
        images: [authorData.imageUrl || '/icon.png'],
      },
    };
  } catch {
    return { title: 'Portofolio Penulis - Karya Kader' };
  }
}

// 🚀 SERVER PAGE: Mengambil data dan mengirimkannya ke Client
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slugOrId = resolvedParams.slug;

  let authorData: DocumentData | null = null;
  let articlesData: PortfolioArticle[] = [];

  try {
    // 1. Ambil Data Penulis
    const q = query(collection(db, 'authors'), where('slug', '==', slugOrId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      authorData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    } else {
      const docRef = doc(db, 'authors', slugOrId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        authorData = { id: docSnap.id, ...docSnap.data() };
      }
    }

    // 2. Jika penulis ketemu, ambil daftar beritanya
    if (authorData) {
      const articlesQuery = query(
        collection(db, 'articles'),
        where('kredit.penulis', '==', authorData.name)
      );
      const articlesSnap = await getDocs(articlesQuery);
      articlesData = articlesSnap.docs.filter(item => isPublicArticle(item.data())).map(doc => {
        const data = doc.data();
        return { id: doc.id, title: data.title || '', slug: data.slug || '', content: data.content || '', category: data.category || '', imageUrl: data.imageUrl || '/icon.png', views: data.views || 0, createdAt: data.createdAt ? { seconds: data.createdAt.seconds } : null };
      });
      
      // Mengurutkan berita terbaru di atas (karena Date dari Firebase tidak bisa disortir langsung di Server Component)
      articlesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }

  if (!authorData) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 dark:bg-[#0a0f18] w-full flex-col gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-500">Penulis Tidak Ditemukan</h2>
        <Link href="/penulis" className="text-yellow-600 font-bold hover:underline">
          &larr; Kembali ke Daftar Penulis
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Melempar data yang sudah diambil oleh server ke komponen visual (Client).
        Ini membuat loading halaman terasa sangat instan tanpa logo "muter-muter" (Loader)!
      */}
      <DetailPenulisClient author={{ id: authorData.id, name: authorData.name || '', role: authorData.role || '', bio: authorData.bio || '', imageUrl: authorData.imageUrl || '', instagram: authorData.instagram || '', linkedin: authorData.linkedin || '' } satisfies AuthorProfile} articles={articlesData} />
    </>
  );
}