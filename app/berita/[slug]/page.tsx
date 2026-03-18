// app/berita/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
// Pastikan path Sidebar ini benar (karena file ini ada di dalam folder berita/[slug])
import Sidebar from '../../components/Sidebar';

interface Article {
  id: string; title: string; content: string; category: string; imageUrl: string;
  authorEmail: string; createdAt: any; slug: string; dateline?: string; tags?: string[];
  views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
}

interface Comment { id: string; name: string; text: string; createdAt: any; }

// --- FUNGSI HELPER SHARE ---
const getShareUrl = (platform: string, title: string, currentUrl: string) => {
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(currentUrl);
  if (platform === 'wa') return `https://wa.me/?text=${t}%20-%20${u}`;
  if (platform === 'fb') return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  if (platform === 'x') return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
  return '#';
};

export default function DetailBerita() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State form komentar
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchArticleAndComments = async () => {
      if (!slug) return;

      try {
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0];
          const articleData = docData.data() as Article;
          
          // === SISTEM VIEWS ANTI-SPAM ===
          const articleRef = doc(db, 'articles', docData.id);
          const hasViewed = sessionStorage.getItem(`viewed_${docData.id}`);

          if (!hasViewed) {
            await updateDoc(articleRef, { views: increment(1) });
            setArticle({ ...articleData, id: docData.id, views: (articleData.views || 0) + 1 });
            sessionStorage.setItem(`viewed_${docData.id}`, 'true');
          } else {
            setArticle({ ...articleData, id: docData.id, views: articleData.views || 0 });
          }

          // === Ambil Komentar & Berita Terkait ===
          const [commentsSnap, relatedSnap] = await Promise.all([
            getDocs(query(collection(db, 'comments'), where('articleId', '==', docData.id), orderBy('createdAt', 'desc'))),
            getDocs(query(collection(db, 'articles'), where('category', '==', articleData.category), where('slug', '!=', slug), limit(3)))
          ]);

          setComments(commentsSnap.docs.map(c => ({ id: c.id, ...c.data() })) as Comment[]);
          setRelatedArticles(relatedSnap.docs.map(c => ({ id: c.id, ...c.data() })) as Article[]);

        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error("Gagal mengambil berita:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleAndComments();
  }, [slug]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim() || !article) return;
    setIsSubmittingComment(true);
    try {
      const newComment = { articleId: article.id, name: commentName, text: commentText, createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, 'comments'), newComment);
      await updateDoc(doc(db, 'articles', article.id), { commentCount: increment(1) });
      setComments([{ id: docRef.id, name: commentName, text: commentText, createdAt: { toDate: () => new Date() } }, ...comments]);
      setArticle({ ...article, commentCount: (article.commentCount || 0) + 1 });
      setCommentName(''); setCommentText('');
    } catch (error) { alert("Terjadi kesalahan."); } finally { setIsSubmittingComment(false); }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
         <div className="text-center">
           <div className="w-12 h-12 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-sm font-serif font-bold tracking-widest uppercase text-[#0f2136]">Memuat Artikel...</p>
         </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Berita tidak ditemukan</h1>
        <button onClick={() => router.push('/')} className="text-[#0f2136] font-bold hover:text-yellow-500 transition">&larr; Kembali ke Beranda</button>
      </div>
    );
  }

  const formattedDate = article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tanggal tidak diketahui';

  // --- PERBAIKAN LOGIKA DATELINE (MENCEGAH MELUBER) ---
  let displayContent = article.content;
  if (article.dateline) {
    displayContent = article.content.replace(
      /<p[^>]*>/i, 
      (match) => `${match}<strong class="uppercase text-[#0a1727]">KARYAKADER.ID, ${article.dateline}</strong> &mdash; `
    );
  }

  return (
    // POIN 5: Menghapus <nav> gelap bertuliskan <- BERANDA
    <main className="min-h-screen bg-white pb-16 pt-8">
      
      <article className="container mx-auto px-4 max-w-7xl">
        
        {/* POIN 1: LAYOUT 2 KOLOM (Kiri Konten, Kanan Sidebar) */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* KOLOM KIRI (KONTEN UTAMA) */}
          <div className="w-full lg:w-[68%]">
            
            {/* BREADCRUMB PENGGANTI NAV */}
            <div className="flex items-center gap-2 text-xs mb-6 font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-3">
              <Link href="/" className="hover:text-[#0f2136] transition-colors">Beranda</Link>
              <span className="text-gray-300">/</span>
              <span className="text-[#f97316] font-extrabold">{article.category}</span>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl md:text-5xl font-serif font-extrabold text-[#0f2136] mt-2 mb-6 leading-tight">
                {article.title}
              </h1>
              
              {/* METADATA & TOMBOL SHARE */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-gray-100 py-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <span className="font-bold text-[#0f2136]">{article.kredit?.penulis || 'Redaksi Karya Kader'}</span>
                  </div>
                  <span className="flex items-center gap-1.5 font-medium"><svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V8h14v11zM16 1h-2v1h-4V1H8v1H2v18h20V2h-6V1z"/></svg>{formattedDate}</span>
                  <span className="flex items-center gap-1.5 font-medium"><svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>{article.views || 0} Tayangan</span>
                </div>

                {/* TOMBOL SHARE */}
                <div className="flex items-center gap-3 shrink-0">
                  <a href={getShareUrl('wa', article.title, currentUrl)} target="_blank" className="bg-green-100 p-2 rounded-full hover:bg-green-200 transition">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-4 h-4" />
                  </a>
                  <a href={getShareUrl('fb', article.title, currentUrl)} target="_blank" className="bg-blue-100 p-2 rounded-full hover:bg-blue-200 transition">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="FB" className="w-4 h-4" />
                  </a>
                  <a href={getShareUrl('x', article.title, currentUrl)} target="_blank" className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg" alt="X" className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="relative w-full h-64 md:h-[450px] mb-10 rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority />
            </div>

            {/* POIN 6 & 4: TEKS BERITA (Mencegah meluber break-words & Drop Cap) */}
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed break-words prose-p:mb-5 prose-headings:font-serif prose-headings:font-extrabold prose-headings:text-[#0f2136] prose-a:text-blue-600 hover:prose-a:text-blue-800
              /* Fitur Drop Cap (Huruf Besar di Paragraf Pertama) */
              prose-p:first-of-type:first-letter:text-5xl
              prose-p:first-of-type:first-letter:md:text-6xl
              prose-p:first-of-type:first-letter:font-extrabold
              prose-p:first-of-type:first-letter:text-[#0a1727]
              prose-p:first-of-type:first-letter:float-left
              prose-p:first-of-type:first-letter:mr-3
              prose-p:first-of-type:first-letter:font-serif
              prose-p:first-of-type:first-letter:mt-1"
              dangerouslySetInnerHTML={{ __html: displayContent }} 
            />

            <div className="mt-12 pt-8 border-t border-gray-200">
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-sm uppercase tracking-wider hover:bg-yellow-100 hover:text-yellow-800 transition cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {article.kredit && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-sm mb-12">
                  <h4 className="font-bold text-[#0f2136] mb-4 uppercase tracking-widest text-xs border-b border-gray-200 pb-2 flex items-center gap-2">
                    👥 Kredit Redaksi
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-700">
                    {article.kredit.penulis && (<div><span className="block text-xs text-gray-500 mb-1">Penulis</span><span className="font-semibold">{article.kredit.penulis}</span></div>)}
                    {article.kredit.editor && (<div><span className="block text-xs text-gray-500 mb-1">Editor</span><span className="font-semibold">{article.kredit.editor}</span></div>)}
                    {article.kredit.fotografer && article.kredit.fotografer !== '-' && (<div><span className="block text-xs text-gray-500 mb-1">Fotografer</span><span className="font-semibold">{article.kredit.fotografer}</span></div>)}
                    {article.kredit.sumber && article.kredit.sumber !== '-' && (<div><span className="block text-xs text-gray-500 mb-1">Sumber Foto</span><span className="font-semibold truncate block">{article.kredit.sumber}</span></div>)}
                  </div>
                </div>
              )}
            </div>

            {/* --- POIN 3: BERITA TERKAIT --- */}
            {relatedArticles.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-bold font-serif text-[#0f2136] mb-5 border-b-2 border-[#0f2136] pb-2 inline-block">
                  Baca Jugak ...
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedArticles.map((rel) => (
                    <Link href={`/berita/${rel.slug}`} key={rel.id} className="group flex flex-col gap-3 hover:shadow-md transition bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="relative w-full aspect-video rounded-md overflow-hidden">
                        <Image src={rel.imageUrl} alt={rel.title} fill className="object-cover group-hover:scale-105 transition" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-700">{rel.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* KOMENTAR */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
              <h3 className="text-xl font-bold font-serif text-[#0f2136] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                Komentar Pembaca ({article.commentCount || 0})
              </h3>

              <form onSubmit={handleAddComment} className="mb-10 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="mb-4">
                  <input type="text" placeholder="Nama Anda" value={commentName} onChange={(e) => setCommentName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div className="mb-4">
                  <textarea placeholder="Tulis pendapat atau tanggapan Anda..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" required></textarea>
                </div>
                <button type="submit" disabled={isSubmittingComment} className={`px-6 py-2 text-white font-bold rounded shadow-sm text-sm transition ${isSubmittingComment ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>
                  {isSubmittingComment ? 'Mengirim...' : 'Kirim Komentar'}
                </button>
              </form>

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm italic">Belum ada komentar. Jadilah yang pertama memberikan tanggapan!</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="w-10 h-10 bg-[#0f2136] rounded-full flex items-center justify-center text-white font-bold uppercase shrink-0">
                        {comment.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-[#0f2136] text-sm">{comment.name}</h4>
                          <span className="text-[10px] text-gray-400">
                            • {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru saja'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* KOLOM KANAN (SIDEBAR) */}
          <div className="w-full lg:w-[32%] space-y-8 sticky top-24 self-start">
            <Sidebar menuName={article.category} />
          </div>

        </div>
      </article>
    </main>
  );
}