// app/dashboard/settings/sidebar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SidebarSettingsPage() {
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [posterLink, setPosterLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Hanya mengambil data dari dokumen 'general' (Utama)
    const fetchSidebarData = async () => {
      const docRef = doc(db, 'settings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().posterUrl) {
        setPosterUrl(snap.data().posterUrl);
        setPosterLink(snap.data().posterLink || '');
      } else {
        setPosterUrl(''); setPosterLink('');
      }
    };
    fetchSidebarData();
  }, []);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalPosterUrl = posterUrl;
      if (posterFile) finalPosterUrl = await uploadImage(posterFile);
      
      // Selalu menyimpan ke dokumen 'general' agar tampil di semua halaman
      await setDoc(doc(db, 'settings', 'general'), {
        posterUrl: finalPosterUrl, posterLink: posterLink || '#', updatedAt: new Date()
      }, { merge: true });

      alert(`Poster Sidebar berhasil disimpan dan akan tampil di semua halaman!`);
      setPosterFile(null);
    } catch (error) {
      alert('Gagal menyimpan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-[#0f2136] mb-2 border-b pb-2">🖼️ Pengaturan Sidebar Publik (Global)</h2>
      <p className="text-sm text-gray-500 mb-6">Poster dan tautan yang diunggah di sini akan otomatis tampil di beranda dan seluruh halaman kategori.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Poster / Banner Saat Ini</label>
          {posterUrl ? (
            <img src={posterUrl} alt="Poster" className="h-64 mb-2 rounded border shadow-sm object-contain bg-gray-50" />
          ) : (
            <div className="h-32 mb-2 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400 bg-gray-50">Belum ada poster</div>
          )}
          <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setPosterFile(e.target.files[0]); }} className="w-full text-sm mt-2" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">🔗 Link Tujuan Poster</label>
          <input type="url" value={posterLink} onChange={(e) => setPosterLink(e.target.value)} className="w-full px-4 py-2 border rounded" placeholder="https://..." />
          <p className="text-xs text-gray-400 mt-1">Isi dengan link Google Form atau WA. Kosongkan jika poster tidak bisa diklik.</p>
        </div>
        <button type="submit" disabled={isSubmitting} className={`w-full py-4 text-white font-bold rounded shadow-md ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136] transition'}`}>Simpan Pengaturan Poster</button>
      </form>
    </div>
  );
}