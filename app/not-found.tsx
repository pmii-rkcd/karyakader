// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-6 py-24">
      <div className="text-center max-w-xl mx-auto">
        
        {/* Ikon Keren */}
        <div className="relative w-48 h-48 mx-auto mb-8 drop-shadow-xl animate-bounce-slow">
          <svg className="w-full h-full text-[#0f2136] opacity-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <div className="absolute top-0 right-10 w-8 h-8 bg-yellow-500 rounded-full mix-blend-multiply animate-pulse"></div>
        </div>

        {/* Teks 404 */}
        <h1 className="text-7xl md:text-9xl font-black text-[#0f2136] tracking-tighter mb-4 drop-shadow-sm font-serif">
          4<span className="text-yellow-500">0</span>4
        </h1>
        
        {/* Pesan Error yang Ramah */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 font-serif">
          Waduh, Kamu Tersesat! 🕵️‍♂️
        </h2>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          Halaman atau berita yang kamu cari sepertinya sudah dihapus, pindah dimensi, atau memang tidak pernah ada di Kawah Chondrodimuko.
        </p>

        {/* Tombol Kembali ke Beranda */}
        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 bg-[#0f2136] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-yellow-500 hover:text-[#0f2136] hover:shadow-lg transition-all duration-300 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}