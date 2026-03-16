// app/dashboard/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Wajib: Import tema CSS dari Quill

// Import dinamis untuk mencegah error SSR di Next.js
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function DashboardPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Sekarang akan menyimpan format HTML
  const [category, setCategory] = useState('Kabar Dari Kawah'); // Default diubah menyesuaikan opsi pertama
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Konfigurasi tombol-tombol di toolbar editor
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      ['clean'] // Tombol untuk menghapus format
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
    // Validasi tambahan: cegah submit jika konten kosong (Quill defaultnya '<p><br></p>')
    if (!title || !content || content === '<p><br></p>' || !image) {
      alert('Harap isi judul, konten berita, dan pilih gambar cover!');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrl = await uploadImageToCloudinary(image);
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      await addDoc(collection(db, 'articles'), {
        title,
        slug,
        content, // Menyimpan HTML (misal: <p><strong>Teks tebal</strong></p>)
        category,
        imageUrl,
        authorId: auth.currentUser?.uid || 'Unknown',
        authorEmail: auth.currentUser?.email || 'Unknown',
        createdAt: serverTimestamp(),
        published: true
      });

      alert('Berita berhasil dipublikasikan!');
      setTitle('');
      setContent('');
      setImage(null);
    } catch (error) {
      console.error('Error mempublikasikan berita:', error);
      alert('Terjadi kesalahan saat menyimpan berita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-serif font-bold mb-6 text-[#0f2136] border-b-2 border-yellow-500 pb-2 inline-block">
        Tulis Berita Redaksi
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Judul Berita</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#0f2136] outline-none transition"
              placeholder="Masukkan judul menarik..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#0f2136] outline-none transition"
            >
              {/* Opsi kategori diperbarui sesuai dengan menu utama */}
              <option value="Kabar Dari Kawah">Kabar Dari Kawah (Berita/Kegiatan)</option>
              <option value="Bararasa">Bararasa (Opini/Esai)</option>
              <option value="Nalar Tempaan">Nalar Tempaan (Kajian/Intelektual)</option>
              <option value="Mutiara Chondro">Mutiara Chondro (Sastra/Puisi)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Gambar Cover</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { if (e.target.files) setImage(e.target.files[0]); }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#0f2136] file:text-white hover:file:bg-gray-800 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Isi Berita</label>
          {/* Implementasi React Quill */}
          <div className="bg-white">
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules}
              className="h-64 mb-12" // Margin bottom agar ruang ketik tidak tertutup toolbar bawah
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 text-white font-bold rounded-md transition text-lg shadow-md ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'
          }`}
        >
          {isSubmitting ? 'Mempublikasikan...' : 'Publikasikan Berita'}
        </button>
      </form>
    </div>
  );
}