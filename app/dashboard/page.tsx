// app/dashboard/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css'; 

// 🚀 IMPORT LUCIDE ICONS
import { PenSquare, LayoutList, Trash2, Edit, Loader2, Plus, Image as ImageIcon } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Article {
  id: string; title: string; category: string; status: string; createdAt: any; 
  dateline?: string; content: string; imageUrl: string; tags: string[];
  kredit?: { penulis: string; fotoPenulis: string; editor: string; fotoEditor: string; fotografer: string; fotoFotografer: string; sumber: string; fotoSumber: string; };
}

export default function DashboardPage() {
  // === STATE NAVIGASI TAB ===
  const [activeTab, setActiveTab] = useState<'kelola' | 'tulis'>('kelola'); 
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // === STATE FORM BERITA ===
  const [title, setTitle] = useState('');
  const [dateline, setDateline] = useState('');
  const [category, setCategory] = useState('Kabar Dari Kawah');
  const [status, setStatus] = useState('Langsung Terbit');
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(''); 
  const [content, setContent] = useState('');
  
  // === STATE KREDIT REDAKSI ===
  const [penulis, setPenulis] = useState('');
  const [fotoPenulis, setFotoPenulis] = useState<File | null>(null);
  const [currentFotoPenulis, setCurrentFotoPenulis] = useState('');
  
  const [editorName, setEditorName] = useState('');
  const [fotoEditor, setFotoEditor] = useState<File | null>(null);
  const [currentFotoEditor, setCurrentFotoEditor] = useState('');
  
  const [fotografer, setFotografer] = useState('');
  const [fotoFotografer, setFotoFotografer] = useState<File | null>(null);
  const [currentFotoFotografer, setCurrentFotoFotografer] = useState('');
  
  const [sumber, setSumber] = useState('');
  const [fotoSumber, setFotoSumber] = useState<File | null>(null);
  const [currentFotoSumber, setCurrentFotoSumber] = useState('');
  
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
      ['link', 'image', 'blockquote'],
      ['clean']
    ],
  }), []);

  // === FUNGSI AMBIL DAFTAR BERITA ===
  const fetchArticles = async () => {
    setIsLoadingList(true);
    try {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticlesList(data);
    } catch (error) {
      console.error("Gagal memuat berita:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kelola') fetchArticles();
  }, [activeTab]);

  // === FUNGSI HAPUS BERITA ===
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Yakin ingin menghapus berita "${title}"?\nTindakan ini tidak bisa dibatalkan!`)) {
      try {
        await deleteDoc(doc(db, 'articles', id));
        alert('Berita berhasil dihapus!');
        fetchArticles(); 
      } catch (error) {
        alert('Gagal menghapus berita.');
      }
    }
  };

  // === FUNGSI EDIT BERITA ===
  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title); setDateline(article.dateline || ''); setCategory(article.category); setStatus(article.status || 'Langsung Terbit');
    setContent(article.content); setTags(article.tags ? article.tags.join(', ') : ''); setCurrentImageUrl(article.imageUrl || '');
    setPenulis(article.kredit?.penulis || ''); setCurrentFotoPenulis(article.kredit?.fotoPenulis || '');
    setEditorName(article.kredit?.editor || ''); setCurrentFotoEditor(article.kredit?.fotoEditor || '');
    setFotografer(article.kredit?.fotografer || ''); setCurrentFotoFotografer(article.kredit?.fotoFotografer || '');
    setSumber(article.kredit?.sumber || ''); setCurrentFotoSumber(article.kredit?.fotoSumber || '');
    
    setActiveTab('tulis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // === FUNGSI BATAL EDIT (Reset Form) ===
  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setDateline(''); setCategory('Kabar Dari Kawah'); setStatus('Langsung Terbit');
    setImage(null); setCurrentImageUrl(''); setContent(''); setTags('');
    setPenulis(''); setFotoPenulis(null); setCurrentFotoPenulis('');
    setEditorName(''); setFotoEditor(null); setCurrentFotoEditor('');
    setFotografer(''); setFotoFotografer(null); setCurrentFotoFotografer('');
    setSumber(''); setFotoSumber(null); setCurrentFotoSumber('');
  };

  // === FUNGSI UPLOAD CLOUDINARY ===
  const uploadImageToCloudinary = async (file: File | null) => {
    if (!file) return ''; 
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  // === FUNGSI SUBMIT (Create & Update) ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || content === '<p><br></p>' || (!image && !currentImageUrl)) {
      alert('Harap isi Judul, Gambar Sampul, dan Isi Berita!');
      return;
    }
    setIsSubmitting(true);

    try {
      const [ newImageUrl, newFotoPenulis, newFotoEditor, newFotoFotografer, newFotoSumber ] = await Promise.all([
        uploadImageToCloudinary(image), uploadImageToCloudinary(fotoPenulis), uploadImageToCloudinary(fotoEditor), uploadImageToCloudinary(fotoFotografer), uploadImageToCloudinary(fotoSumber)
      ]);

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

      const articleData = {
        title, slug, dateline: dateline || "", content, category, status,
        imageUrl: newImageUrl || currentImageUrl || "", 
        kredit: {
          penulis: penulis || 'Redaksi', fotoPenulis: newFotoPenulis || currentFotoPenulis || "", 
          editor: editorName || 'Redaksi', fotoEditor: newFotoEditor || currentFotoEditor || "",
          fotografer: fotografer || '-', fotoFotografer: newFotoFotografer || currentFotoFotografer || "",
          sumber: sumber || '-', fotoSumber: newFotoSumber || currentFotoSumber || ""
        },
        tags: tagsArray,
        authorId: auth.currentUser?.uid || 'Unknown',
        authorEmail: auth.currentUser?.email || 'Unknown',
        published: status === 'Langsung Terbit'
      };

      if (editingId) {
        await updateDoc(doc(db, 'articles', editingId), { ...articleData, updatedAt: serverTimestamp() });
        alert('Berita berhasil diperbarui!');
      } else {
        await addDoc(collection(db, 'articles'), { ...articleData, createdAt: serverTimestamp() });
        alert('Berita baru berhasil dipublikasikan!');
      }
      
      resetForm(); setActiveTab('kelola');
      
    } catch (error) {
      console.error('Error menyimpan berita:', error); alert('Terjadi kesalahan saat menyimpan berita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      
      {/* === HEADER TABS === */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-black text-[#0f2136] mb-6">Manajemen Berita</h1>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-max overflow-x-auto max-w-full">
          <button 
            onClick={() => { setActiveTab('kelola'); resetForm(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'kelola' ? 'bg-[#0f2136] text-white shadow-md' : 'text-gray-500 hover:text-[#0f2136] hover:bg-gray-100'}`}
          >
            <LayoutList className="w-4 h-4" /> Kelola Arsip
          </button>
          <button 
            onClick={() => setActiveTab('tulis')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'tulis' ? 'bg-[#0f2136] text-white shadow-md' : 'text-gray-500 hover:text-[#0f2136] hover:bg-gray-100'}`}
          >
            <PenSquare className="w-4 h-4" /> {editingId ? 'Edit Berita' : 'Tulis Berita Baru'}
          </button>
        </div>
      </div>

      {/* =========================================
          TAB 1: KELOLA BERITA (TABEL CRUD)
          ========================================= */}
      {activeTab === 'kelola' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50">
            <h2 className="text-lg md:text-xl font-black text-[#0f2136] flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-yellow-500" /> Daftar Berita
            </h2>
            <button onClick={() => setActiveTab('tulis')} className="bg-[#0f2136] text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-[#0f2136] transition shadow-md w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Buat Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider w-[45%] md:w-1/2">Judul & Kategori</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isLoadingList ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-3" /> Memuat data arsip...
                    </td>
                  </tr>
                ) : articlesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-gray-500 font-medium">Belum ada berita yang diterbitkan.</td>
                  </tr>
                ) : (
                  articlesList.map((art) => (
                    <tr key={art.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0f2136] text-sm line-clamp-2 leading-snug mb-1.5">{art.title}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 inline-block px-2 py-0.5 rounded">{art.category}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap hidden md:table-cell font-medium">
                        {art.createdAt?.toDate ? art.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'}) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider shadow-sm ${art.status === 'Draft' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                          {art.status || 'Published'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2 md:gap-3">
                          <button onClick={() => handleEdit(art)} className="text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-100 p-2 rounded-lg transition" title="Edit Berita">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(art.id, art.title)} className="text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border border-red-100 p-2 rounded-lg transition" title="Hapus Berita">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 2: TULIS / EDIT BERITA (FORM)
          ========================================= */}
      {activeTab === 'tulis' && (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
          
          {editingId && (
            <div className="bg-blue-50 border border-blue-200 p-4 md:p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg mt-0.5"><Edit className="w-4 h-4" /></div>
                <div>
                  <h4 className="text-blue-900 font-bold">Mode Edit Berita</h4>
                  <p className="text-blue-700 text-xs md:text-sm mt-1">Perubahan yang kamu simpan akan menimpa berita yang sudah ada.</p>
                </div>
              </div>
              <button type="button" onClick={() => { setActiveTab('kelola'); resetForm(); }} className="w-full md:w-auto text-xs bg-white border border-blue-300 px-4 py-2 rounded-lg text-blue-800 font-bold hover:bg-blue-100 transition shadow-sm">
                ✕ Batalkan Edit
              </button>
            </div>
          )}

          {/* BARIS 1: Judul, Dateline, Kategori, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-bold text-[#0f2136] mb-2">Judul Berita</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-lg text-gray-800 placeholder-gray-400 transition bg-gray-50 focus:bg-white" placeholder="Masukkan judul berita yang menarik..." required />
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">📍 Dateline / Lokasi (Opsional)</label>
                  <input type="text" value={dateline} onChange={(e) => setDateline(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-sm bg-gray-50 focus:bg-white transition" placeholder="Contoh: Malang / Jakarta" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 md:mt-6 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 hidden md:block">Akan muncul tebal di paragraf pertama</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-bold text-[#0f2136] mb-2">Pilih Kanal / Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none text-gray-700 bg-gray-50 font-medium cursor-pointer transition">
                  <option value="Kabar Dari Kawah">Kabar Dari Kawah (Berita)</option>
                  <option value="Bararasa">Bararasa (Opini/Esai)</option>
                  <option value="Nalar Tempaan">Nalar Tempaan (Kajian)</option>
                  <option value="Mutiara Chondro">Mutiara Chondro (Sastra)</option>
                </select>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-bold text-[#0f2136] mb-2">Status Publikasi</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`w-full px-4 py-3.5 border font-bold rounded-xl outline-none cursor-pointer transition ${status === 'Draft' ? 'bg-gray-50 border-gray-300 text-gray-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <option value="Langsung Terbit">✅ Terbitkan Langsung</option>
                  <option value="Draft">📝 Simpan ke Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* BARIS 2: Gambar Sampul */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-[#0f2136] mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-yellow-500" /> Gambar Sampul (Thumbnail) <span className="text-red-500">*Wajib</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-yellow-50/50 hover:border-yellow-400 transition-all relative overflow-hidden group">
              {image ? (
                <div className="z-10 bg-green-100 border border-green-300 px-6 py-3 rounded-xl flex flex-col items-center">
                   <span className="text-green-700 font-bold mb-1">File Baru Terpilih ✓</span>
                   <span className="text-[10px] text-green-600 max-w-[200px] truncate">{image.name}</span>
                </div>
              ) : currentImageUrl ? (
                <div className="text-center z-10 flex flex-col items-center">
                   <div className="bg-[#0f2136]/80 backdrop-blur-sm text-white border border-gray-600 px-6 py-3 rounded-xl mb-3 shadow-lg">
                      <p className="text-sm font-bold flex items-center gap-2">✓ Menggunakan Gambar Lama</p>
                   </div>
                   <p className="text-[11px] font-bold text-[#0f2136] bg-white px-3 py-1.5 rounded-full shadow-sm">Klik di sini jika ingin mengganti gambar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                  </div>
                  <div className="bg-[#0f2136] text-white px-8 py-3 rounded-xl font-bold cursor-pointer mb-2 group-hover:bg-yellow-500 group-hover:text-[#0f2136] transition shadow-md">Jelajahi File</div>
                  <p className="text-[11px] text-gray-500 font-medium">Format: JPG, PNG. Maksimal ukuran 4MB</p>
                </div>
              )}
              {currentImageUrl && !image && (
                <img src={currentImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-10 transition-opacity blur-sm" alt="Preview" />
              )}
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setImage(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
            </div>
          </div>

          {/* BARIS 3: Isi Berita */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-[#0f2136] mb-3">Teks & Isi Berita</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className="h-[400px] md:h-[500px] mb-12 bg-white" />
            </div>
          </div>

          {/* BARIS 4: Kredit Redaksi & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-[#0f2136] mb-5 flex items-center gap-2 border-b border-gray-100 pb-3 uppercase tracking-widest">👥 Susunan Redaksi (Kredit)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* PENULIS */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2">1. Nama Penulis</label>
                  <input type="text" value={penulis} onChange={(e) => setPenulis(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400 mb-4 bg-white shadow-sm" placeholder="Contoh: Ahmad Sahal" />
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Upload Foto (Opsional):</label>
                  <input type="file" accept="image/*" onChange={(e) => setFotoPenulis(e.target.files?.[0] || null)} className="block w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-bold file:bg-[#0f2136] file:text-white hover:file:bg-yellow-500 hover:file:text-[#0f2136] cursor-pointer transition" />
                  {currentFotoPenulis && !fotoPenulis && <span className="text-[10px] text-green-600 mt-2 block font-bold bg-green-50 px-2 py-1 rounded w-max border border-green-100">✓ Foto Tersimpan</span>}
                </div>

                {/* EDITOR */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2">2. Nama Editor</label>
                  <input type="text" value={editorName} onChange={(e) => setEditorName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400 mb-4 bg-white shadow-sm" placeholder="Contoh: Budi Santoso" />
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Upload Foto (Opsional):</label>
                  <input type="file" accept="image/*" onChange={(e) => setFotoEditor(e.target.files?.[0] || null)} className="block w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-bold file:bg-[#0f2136] file:text-white hover:file:bg-yellow-500 hover:file:text-[#0f2136] cursor-pointer transition" />
                  {currentFotoEditor && !fotoEditor && <span className="text-[10px] text-green-600 mt-2 block font-bold bg-green-50 px-2 py-1 rounded w-max border border-green-100">✓ Foto Tersimpan</span>}
                </div>

                {/* FOTOGRAFER */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2">3. Fotografer</label>
                  <input type="text" value={fotografer} onChange={(e) => setFotografer(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400 mb-4 bg-white shadow-sm" placeholder="Contoh: Dok. Pribadi" />
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Upload Foto (Opsional):</label>
                  <input type="file" accept="image/*" onChange={(e) => setFotoFotografer(e.target.files?.[0] || null)} className="block w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-bold file:bg-[#0f2136] file:text-white hover:file:bg-yellow-500 hover:file:text-[#0f2136] cursor-pointer transition" />
                  {currentFotoFotografer && !fotoFotografer && <span className="text-[10px] text-green-600 mt-2 block font-bold bg-green-50 px-2 py-1 rounded w-max border border-green-100">✓ Foto Tersimpan</span>}
                </div>

                {/* SUMBER */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2">4. Instansi / Sumber</label>
                  <input type="text" value={sumber} onChange={(e) => setSumber(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-400 mb-4 bg-white shadow-sm" placeholder="Contoh: Humas PMII" />
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Upload Logo/Foto (Opsional):</label>
                  <input type="file" accept="image/*" onChange={(e) => setFotoSumber(e.target.files?.[0] || null)} className="block w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-bold file:bg-[#0f2136] file:text-white hover:file:bg-yellow-500 hover:file:text-[#0f2136] cursor-pointer transition" />
                  {currentFotoSumber && !fotoSumber && <span className="text-[10px] text-green-600 mt-2 block font-bold bg-green-50 px-2 py-1 rounded w-max border border-green-100">✓ Logo Tersimpan</span>}
                </div>

              </div>
            </div>

            {/* TAGS */}
            <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-2xl shadow-sm border border-yellow-200 h-max">
              <h3 className="text-sm font-bold text-[#0f2136] mb-3 flex items-center gap-2 uppercase tracking-widest">🏷️ Kata Kunci (Tags)</h3>
              <p className="text-[11px] font-medium text-gray-500 mb-4 leading-relaxed bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">Gunakan tanda koma ( , ) untuk memisahkan kata kunci agar berita ini mudah dicari pembaca.</p>
              <textarea value={tags} onChange={(e) => setTags(e.target.value)} rows={7} className="w-full px-4 py-3 border border-yellow-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500 bg-white shadow-inner resize-none transition-shadow" placeholder="Contoh: Politik, Kampus, Kaderisasi, PMII Malang" />
            </div>
          </div>

          {/* TOMBOL TERBITKAN / UPDATE */}
          <div className="pt-6">
            <button type="submit" disabled={isSubmitting} className={`w-full py-5 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all duration-300 text-sm md:text-base flex justify-center items-center gap-3 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136] hover:-translate-y-1 hover:shadow-2xl'}`}>
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : editingId ? <Edit className="w-6 h-6" /> : <PenSquare className="w-6 h-6" />} 
              {isSubmitting ? 'Sedang Memproses Server...' : editingId ? 'Simpan Perubahan Berita' : 'Terbitkan Berita Sekarang'}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}