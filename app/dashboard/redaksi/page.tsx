// app/dashboard/redaksi/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

interface Redaksi {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export default function RedaksiPage() {
  const [members, setMembers] = useState<Redaksi[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [image, setImage] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref untuk membersihkan input file setelah sukses
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'redaksi'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Redaksi));
      setMembers(data);
    } catch (error) {
      console.error("Gagal mengambil data redaksi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST', body: formData
    });
    
    const data = await res.json();
    
    // 🔥 PENDETEKSI ERROR CLOUDINARY
    if (!data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary gagal mengembalikan URL gambar.");
    }
    
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !image) {
      alert('Nama, Jabatan, dan Foto wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Gambar Dulu
      const imageUrl = await uploadImage(image);
      
      // 2. Simpan ke Firebase
      await addDoc(collection(db, 'redaksi'), {
        name,
        role,
        imageUrl,
        createdAt: serverTimestamp()
      });

      alert('✅ Anggota Redaksi berhasil ditambahkan!');
      
      // Bersihkan Form
      setName(''); 
      setRole(''); 
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input file visual
      
      fetchMembers(); 
    } catch (error: any) {
      console.error("Gagal menambah redaksi:", error);
      // 🔥 ALERT ERROR SPESIFIK AGAR KITA TAHU PENYEBABNYA
      alert(`❌ GAGAL: ${error.message || "Terjadi kesalahan saat menyimpan data."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus anggota redaksi ini?')) {
      try {
        await deleteDoc(doc(db, 'redaksi', id));
        alert('Anggota dihapus!');
        fetchMembers();
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#0f2136]">Susunan Redaksi</h2>
          <p className="text-gray-500 text-sm mt-1">Atur profil tim redaksi yang akan ditampilkan di halaman Tentang Kami.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit sticky top-4">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">➕ Tambah Anggota</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm" placeholder="Contoh: Ahmad Albert" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jabatan / Posisi</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border rounded outline-none focus:border-blue-500 text-sm" placeholder="Contoh: Pemimpin Redaksi" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Foto Profil</label>
              <div className="border border-dashed border-gray-300 rounded p-4 text-center bg-gray-50">
                {image ? (
                   <p className="text-xs font-bold text-green-600 truncate">{image.name}</p>
                ) : (
                   <p className="text-[10px] text-gray-400 mb-2">Pilih foto rasio 1:1 (Kotak)</p>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} // Dihubungkan ke ref agar bisa dibersihkan
                  onChange={(e) => { if (e.target.files) setImage(e.target.files[0]); }} 
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                  required 
                />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className={`w-full py-3 text-white font-bold rounded shadow-md transition ${isSubmitting ? 'bg-gray-400' : 'bg-[#0f2136] hover:bg-yellow-500 hover:text-[#0f2136]'}`}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Anggota'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#0f2136] mb-4 border-b pb-2">📋 Daftar Tim Redaksi</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#0f2136] border-t-yellow-500 rounded-full animate-spin"></div></div>
          ) : members.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Belum ada anggota redaksi yang ditambahkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition bg-white group relative">
                  <div className="w-16 h-16 relative rounded-full overflow-hidden shrink-0 border-2 border-yellow-500 bg-gray-100">
                    {member.imageUrl && <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#0f2136] text-sm leading-tight">{member.name}</h4>
                    <p className="text-xs text-yellow-600 font-semibold mt-0.5">{member.role}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(member.id)} className="w-6 h-6 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center text-xs font-bold transition">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}