'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

interface Article {
  id: string; title: string; content: string; category: string; imageUrl: string;
  authorEmail: string; createdAt: any; slug: string; dateline?: string; tags?: string[];
  views?: number; commentCount?: number;
  kredit?: { penulis: string; editor: string; fotografer: string; sumber: string; };
}

interface Comment { id: string; name: string; text: string; createdAt: any; }

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
          
          const articleRef = doc(db, 'articles', docData.id);
          const hasViewed = sessionStorage.getItem(`viewed_${docData.id}`);

          if (!hasViewed) {
            await updateDoc(articleRef, { views: increment(1) });
            setArticle({ ...articleData, id: docData.id, views: (articleData.views || 0) + 1 });
            sessionStorage.setItem(`viewed_${docData.id}`, 'true');
          } else {
            setArticle({ ...articleData, id: docData.id, views: articleData.views || 0 });
          }

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
      <div className="flex min-h-screen items-center justify-center bg-white">
         <div className="text-center">
           <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0f2136] rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-xs font-bold tracking-widest uppercase text-gray-500">Memuat Berita...</p>
         </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Berita tidak ditemukan</h1>
        <button onClick={() => router.push('/')} className="text-[#0f2136] font-bold hover:text-yellow-500 transition">&larr; Kembali ke Beranda</button>
      </div>
    );
  }

  const formattedDate = article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tanggal tidak diketahui';

  // --- PERBAIKAN SPASI GAIB & STANDAR NASIONAL: DATELINE JURNALISTIK ---
  
  // 1. Bersihkan spasi gaib (Non-Breaking Space) bawaan Quill Editor
  let displayContent = article.content.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
  
  // 2. Sisipkan Dateline
  if (article.dateline) {
    displayContent = displayContent.replace(
      /<p[^>]*>/i, 
      (match) => `${match}<strong class="font-bold uppercase">${article.dateline}, Karyakader.id</strong> &mdash; `
    );
  } else {
    displayContent = displayContent.replace(
      /<p[^>]*>/i, 
      (match) => `${match}<strong class="font-bold uppercase">Karyakader.id</strong> &mdash; `
    );
  }

  return (
    <main className="min-h-screen bg-white pb-16 pt-8">
      
      <article className="container mx-auto px-4 max-w-7xl">
        
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* KOLOM KIRI (KONTEN BERITA) */}
          <div className="w-full lg:w-[68%]">
            
            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 text-[11px] mb-6 font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-4">
              <Link href="/" className="hover:text-[#0f2136] transition-colors">Beranda</Link>
              <span className="text-gray-300">/</span>
              <span className="text-blue-700">{article.category}</span>
            </div>

            {/* JUDUL */}
            <h1 className="text-3xl md:text-[42px] font-serif font-bold text-[#111827] mt-2 mb-6 leading-[1.2]">
              {article.title}
            </h1>
            
            {/* METADATA (Penulis, Tanggal, Views) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 mb-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-500">
                <span className="font-bold text-[#0f2136] uppercase tracking-wide border-r border-gray-300 pr-4">
                  Oleh: {article.kredit?.penulis || 'Redaksi'}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  {formattedDate}
                </span>
              </div>

              {/* TOMBOL SHARE */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 font-medium mr-2 hidden sm:block">Bagikan:</span>
                <a href={getShareUrl('wa', article.title, currentUrl)} target="_blank" className="bg-[#25D366]/10 text-[#25D366] p-2 rounded-full hover:bg-[#25D366] hover:text-white transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href={getShareUrl('fb', article.title, currentUrl)} target="_blank" className="bg-[#1877F2]/10 text-[#1877F2] p-2 rounded-full hover:bg-[#1877F2] hover:text-white transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href={getShareUrl('x', article.title, currentUrl)} target="_blank" className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-800 hover:text-white transition">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
              </div>
            </div>

            {/* GAMBAR UTAMA & CAPTION */}
            <div className="mb-8">
              <div className="relative w-full aspect-[16/9] md:h-[450px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority />
              </div>
              {/* Caption Foto Standar Media Nasional */}
              {article.kredit?.sumber && (
                <p className="text-[11px] text-gray-500 mt-2 italic font-medium px-1">
                  Foto: {article.kredit.sumber}
                </p>
              )}
            </div>

            {/* TEKS BERITA (BEBAS DARI BREAK-WORDS AGAR TIDAK TERPOTONG) */}
            <div 
              className="prose md:prose-lg max-w-none text-gray-800 
              prose-p:leading-[1.8] prose-p:mb-6 prose-p:text-[17px]
              prose-headings:font-serif prose-headings:font-bold prose-headings:text-[#0f2136] 
              prose-a:text-blue-600 hover:prose-a:text-blue-800 
              prose-img:rounded-xl prose-img:w-full 
              prose-blockquote:border-l-4 prose-blockquote:border-yellow-500 prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-gray-700"
              dangerouslySetInnerHTML={{ __html: displayContent }} 
            />

            {/* TAGS */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded uppercase tracking-widest hover:bg-gray-200 transition cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* KREDIT REDAKSI */}
              {article.kredit && (
                <div className="text-[13px] text-gray-600 space-y-1 mb-12 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {article.kredit.editor && <p><span className="font-bold">Editor:</span> {article.kredit.editor}</p>}
                  {article.kredit.fotografer && article.kredit.fotografer !== '-' && <p><span className="font-bold">Fotografer:</span> {article.kredit.fotografer}</p>}
                </div>
              )}
            </div>

            {/* BERITA TERKAIT */}
            {relatedArticles.length > 0 && (
              <div className="mb-12 pt-6 border-t-[3px] border-gray-100">
                <h3 className="text-xl font-bold font-serif text-[#0f2136] mb-5 border-b-2 border-yellow-500 pb-2 inline-block">
                  Baca Juga
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {relatedArticles.map((rel) => (
                    <Link href={`/berita/${rel.slug}`} key={rel.id} className="group flex flex-col gap-3 hover:opacity-80 transition">
                      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <Image src={rel.imageUrl} alt={rel.title} fill className="object-cover group-hover:scale-105 transition duration-500" />
                      </div>
                      <h4 className="font-bold text-[#111827] text-sm leading-snug line-clamp-2 group-hover:text-blue-700">{rel.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* KOMENTAR */}
            <div className="bg-white border-t-[3px] border-gray-100 pt-8 mt-4">
              <h3 className="text-xl font-bold font-serif text-[#0f2136] mb-6 flex items-center gap-2">
                Komentar ({article.commentCount || 0})
              </h3>

              <form onSubmit={handleAddComment} className="mb-10">
                <div className="mb-3">
                  <input type="text" placeholder="Nama Anda" value={commentName} onChange={(e) => setCommentName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                </div>
                <div className="mb-3">
                  <textarea placeholder="Tulis komentar..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" required></textarea>
                </div>
                <button type="submit" disabled={isSubmittingComment} className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-sm text-sm transition ${isSubmittingComment ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>
                  {isSubmittingComment ? 'Mengirim...' : 'Kirim Komentar'}
                </button>
              </form>

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">Belum ada komentar.</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold uppercase shrink-0">
                        {comment.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-[#0f2136] text-sm">{comment.name}</h4>
                          <span className="text-[11px] text-gray-400">
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