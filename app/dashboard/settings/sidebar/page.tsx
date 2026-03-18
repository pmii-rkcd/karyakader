// app/dashboard/settings/sidebar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PosterData {
  url: string;
  link: string;
}

export default function SidebarSettingsPage() {
  const [posters, setPosters] = useState<PosterData[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newLink, setNewLink] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSidebarData = async () => {
      setIsLoading(true);
      const docRef = doc(db, 'settings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        // Menyesuaikan jika sebelumnya masih pakai 1 poster (posterUrl), ubah ke format array (posters)
        if (data.posters) {
          setPosters(data.posters);
        } else if (data.posterUrl) {
          setPosters([{ url: data.posterUrl, link: data.posterLink || '#' }]);
        }
      }
      setIsLoading(false);
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

  const handleAddPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) return alert('Harap pilih gambar poster terlebih dahulu!');
    
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImage(newFile);
      const updatedPosters = [...posters, { url: uploadedUrl, link: newLink || '#' }];
      
      setPosters(updatedPosters);
      
      // Simpan array poster ke Firebase
      await setDoc(doc(db, 'settings', 'general'), {
        posters: updatedPosters, updatedAt: new Date()
      }, { merge: true });

      alert('Poster berhasil ditambahkan ke Slider!');
      setNewFile(null); // Reset input file
      setNewLink(''); // Reset input link
    } catch (error) {
      alert('Gagal mengunggah poster.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePoster = async (indexToRemove: number) => {
    if (!confirm('Yakin ingin menghapus poster ini dari slider?')) return;
    
    const updatedPosters = posters.filter((_, index) => index !== indexToRemove);
    setPosters(updatedPosters);
    
    await setDoc(doc(db, 'settings', 'general'), {
      posters: updatedPosters, updatedAt: new Date()
    }, { merge: true });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-[#0f2136]">Pengaturan Poster Slider</h2>
        <p className="text-gray-500 text-sm mt-1">Tambahkan beberapa poster untuk membuat tampilan bergeser (Slider) di sidebar publik.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* FORM TAMBAH POSTER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">➕ Tambah Poster Baru</h3>
          <form onSubmit={handleAddPoster} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gambar Poster</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setNewFile(e.target.files[0]); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:font-semibold file:bg-[#0f2136] file:text-white hover:file:bg-gray-800 transition cursor-pointer" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">🔗 Link Tujuan (Jika diklik)</label>
              <input type="url" value={newLink} onChange={(e) => setNewLink(e.target.value)} className="w-full px-4 py-2 border rounded text-sm outline-none focus:border-blue-500" placeholder="https://..." />
            </div>
            <button type="submit" disabled={isUploading} className={`w-full py-3 text-white font-bold rounded shadow-md transition ${isUploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
              {isUploading ? 'Mengunggah...' : 'Tambah ke Slider'}
            </button>
          </form>
        </div>

        {/* DAFTAR POSTER DI SLIDER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">📋 Daftar Poster Aktif</h3>
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">Memuat data...</p>
          ) : posters.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Belum ada poster di dalam Slider.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {posters.map((poster, index) => (
                <div key={index} className="flex gap-4 p-3 border rounded-lg bg-gray-50 items-center">
                  <div className="w-20 h-24 shrink-0 relative rounded overflow-hidden shadow-sm border border-gray-200">
                    <img src={poster.url} alt={`Poster ${index+1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-[#0f2136] mb-1">Poster {index + 1}</p>
                    <p className="text-[10px] text-blue-500 truncate hover:underline">
                      <a href={poster.link} target="_blank">{poster.link !== '#' ? poster.link : 'Tidak ada link'}</a>
                    </p>
                  </div>
                  <button onClick={() => handleDeletePoster(index)} className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition">
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}