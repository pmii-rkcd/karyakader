// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

// === SEO & META TAGS GLOBAL ===
export const metadata: Metadata = {
  title: 'Karya Kader - PR. PMII "KAWAH" Chondrodimuko',
  description: 'Portal Berita Resmi Pergerakan Mahasiswa Islam Indonesia (PMII) Rayon "KAWAH" Chondrodimuko. Menyajikan informasi teraktual, kajian, dan opini kader.',
  keywords: ['PMII', 'Kawah Chondrodimuko', 'UIN Malang', 'Berita Mahasiswa', 'Karya Kader', 'Pergerakan Mahasiswa', 'Artikel PMII'],
  authors: [{ name: 'Redaksi Karya Kader' }],
  metadataBase: new URL('https://karyakader.id'),
  
  verification: {
    google: '4wTXqRwb4ZiJlKueNYdht0aBjlGSL32DBbLLjVn1Mv0',
  },
  
  openGraph: {
    title: 'Karya Kader - PR. PMII "KAWAH" Chondrodimuko',
    description: 'Portal Berita Resmi PR. PMII "KAWAH" Chondrodimuko. Menyajikan informasi teraktual, kajian, dan opini kader.',
    url: '/', 
    siteName: 'Karya Kader',
    images: [
      {
        url: '/logo-pmii.png',
        width: 1200,
        height: 630,
        alt: 'PMII',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Karya Kader - PR. PMII "KAWAH" Chondrodimuko',
    description: 'Portal Berita Resmi PR. PMII "KAWAH" Chondrodimuko.',
    images: ['/logo-pmii.png'], // Sama seperti gambar OG
  },
  
  // 🔥 PERBAIKAN IKON GLOBE: Memaksa Next.js membaca icon.png 🔥
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico' } // Cadangan
    ],
    apple: [
      { url: '/icon.png' } // Agar logonya juga muncul jika di-save ke Homescreen iPhone
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-gray-50 text-gray-900`}>
        {/* Desain Header, Navbar, dan Footer milikmu akan dirender di dalam sini */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
