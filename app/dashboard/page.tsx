// app/dashboard/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css'; // Menggunakan react-quill-new sesuai perbaikanmu

// Import dinamis
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function DashboardPage() {
  // === STATE DIPERBARUI SESUAI DESAIN BARU ===
  const [title, setTitle] = useState('');
  const [dateline, setDateline] = useState('');
  const [category, setCategory] = useState('Kabar Dari Kawah');
  const [status, setStatus] = useState('Langsung Terbit');
  const [image, setImage] = useState<File | null>(null);
  const [content, setContent] = useState('');
  
  // State untuk Kredit Redaksi
  const [penulis, setPenulis] = useState('');
  const [editorName, setEditorName] = useState('');
  const [fotografer, setFotografer] = useState('');
  const [sumber, setSumber] = useState('');
  
  // State untuk Tags
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Konfigurasi toolbar
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
      ['link', 'image', 'blockquote'],
      ['clean']
    ],
  }), []);

  const uploadImageToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || content === '<p><br></p>' || !image) {
      alert('Harap isi Judul, Gambar Sampul, dan Isi Berita!');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrl = await uploadImageToCloudinary(image);
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Menyimpan data lengkap ke Firebase
      await addDoc(collection(db, 'articles'), {
        title,
        slug,
        dateline,
        content, 
        category,
        status,
        imageUrl,
        kredit: {
          penulis: penulis || 'Redaksi',
          editor: editorName || 'Redaksi',
          fotografer: fotografer || '-',
          sumber: sumber || '-'
        },
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        authorId: auth.currentUser?.uid || 'Unknown',
        authorEmail: auth.currentUser?.email || 'Unknown',
        createdAt: serverTimestamp(),
        published: status === 'Langsung Terbit' // Jika draft, status false
      });

      alert('Berita berhasil dipublikasikan!');
      
      // Reset semua form setelah sukses
      setTitle(''); setDateline(''); setCategory('Kabar Dari Kawah'); setStatus('Langsung Terbit');
      setImage(null); setContent(''); setPenulis(''); setEditorName('');
      setFotografer(''); setSumber(''); setTags('');
    } catch (error) {
      console.error('Error mempublikasikan berita:', error);
      alert('Terjadi kesalahan saat menyimpan berita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER TULIS BERITA */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-serif font-bold text-[#0f2136]">Tulis Berita Baru</h2>
        <button type="button" onClick={() => window.history.back()} className="text-gray-500 hover:text-red-500 text-sm font-medium transition flex items-center gap-1">
          ✕ Batal
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BARIS 1: Judul, Dateline, Kategori, Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Judul Berita</label>
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-lg text-gray-800 placeholder-gray-400" 
                placeholder="Masukkan judul berita..." required 
              />
            </div>
            <div className="bg-[#f8faff] p-5 rounded-lg border border-blue-100 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#0f2136] mb-1 flex items-center gap-1">📍 Dateline / Lokasi</label>
                <input 
                  type="text" value={dateline} onChange={(e) => setDateline(e.target.value)} 
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" 
                  placeholder="Contoh: Malang / Jakarta" 
                />
              </div>
              <span className="text-xs text-gray-500 md:mt-5">- Muncul tebal di awal paragraf</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-700">
                <option value="Kabar Dari Kawah">Kabar Dari Kawah (Berita)</option>
                <option value="Bararasa">Bararasa (Opini/Esai)</option>
                <option value="Nalar Tempaan">Nalar Tempaan (Kajian)</option>
                <option value="Mutiara Chondro">Mutiara Chondro (Sastra)</option>
              </select>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 border border-green-200 bg-green-50 text-green-700 font-medium rounded-md focus:ring-2 focus:ring-green-500 outline-none">
                <option value="Langsung Terbit">✅ Langsung Terbit</option>
                <option value="Draft">📝 Simpan sebagai Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* BARIS 2: Gambar Sampul */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-[#0f2136] mb-3">Gambar Sampul (Thumbnail)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition relative">
            {image ? (
              <p className="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded">✓ Gambar terpilih: {image.name}</p>
            ) : (
              <>
                <div className="bg-[#3b82f6] text-white px-6 py-2 rounded-md font-bold cursor-pointer mb-2 hover:bg-blue-700 transition">Choose File</div>
                <p className="text-xs text-gray-500">Image (4MB)</p>
                <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG</p>
              </>
            )}
            <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setImage(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
          </div>
        </div>

        {/* BARIS 3: Isi Berita */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-[#0f2136] mb-3">Isi Berita</label>
          <div className="border border-gray-200 rounded-md">
            <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className="h-96 mb-12" />
          </div>
        </div>

        {/* BARIS 4: Kredit Redaksi & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-[#0f2136] mb-4 flex items-center gap-2">👥 KREDIT REDAKSI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Penulis</label><input type="text" value={penulis} onChange={(e) => setPenulis(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Editor</label><input type="text" value={editorName} onChange={(e) => setEditorName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fotografer</label><input type="text" value={fotografer} onChange={(e) => setFotografer(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Sumber</label><input type="text" value={sumber} onChange={(e) => setSumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500" /></div>
            </div>
          </div>

          <div className="bg-[#fffdf2] p-6 rounded-lg shadow-sm border border-yellow-200">
            <h3 className="text-sm font-bold text-[#0f2136] mb-4 flex items-center gap-2">🏷️ TAGS / TOPIK</h3>
            <textarea value={tags} onChange={(e) => setTags(e.target.value)} rows={4} className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-yellow-400 bg-white" placeholder="Contoh: Politik, Kampus, PMII Malang (Pisahkan dengan koma)" />
          </div>
        </div>

        {/* TOMBOL TERBITKAN */}
        <button type="submit" disabled={isSubmitting} className={`w-full py-4 text-white font-extrabold rounded-lg shadow-md transition-all text-lg flex justify-center items-center gap-2 ${isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#0a1727] hover:bg-[#152e4d]'}`}>
          🚀 {isSubmitting ? 'Mempublikasikan...' : 'Terbitkan Berita'}
        </button>

      </form>
    </div>
  );
}