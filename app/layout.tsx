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
  description: 'Portal Berita Resmi Pergerakan Mahasiswa Islam Indonesia (PMII) Rayon Kawah Chondrodimuko. Menyajikan informasi teraktual, kajian, dan opini kader.',
  keywords: ['PMII', 'Kawah Chondrodimuko', 'UIN Malang', 'Berita Mahasiswa', 'Karya Kader', 'Pergerakan Mahasiswa', 'Artikel PMII'],
  authors: [{ name: 'Redaksi Karya Kader' }],
  metadataBase: new URL('https://karyakader.id'), // Ganti dengan domain aslimu nanti
  
  openGraph: {
    title: 'Karya Kader - PR. PMII "KAWAH" Chondrodimuko',
    description: 'Portal Berita Resmi PR. PMII "KAWAH" Chondrodimuko. Menyajikan informasi teraktual, kajian, dan opini kader.',
    url: '/', 
    siteName: 'Karya Kader',
    images: [
      {
        url: '/logo-pmii.png', // Pastikan kamu menaruh file logo-pmii.png di dalam folder "public"
        width: 1200,
        height: 630,
        alt: 'Logo Karya Kader PMII',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Karya Kader - PR. PMII Kawah Chondrodimuko',
    description: 'Portal Berita Resmi PR. PMII Kawah Chondrodimuko.',
    images: ['/logo-pmii.png'], // Sama seperti gambar OG
  },
  
  icons: {
    icon: '/favicon.ico', // Pastikan ada file favicon.ico atau icon.png di dalam folder "public"
    apple: '/apple-touch-icon.png',
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