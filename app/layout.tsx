// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout'; // Ini akan memanggil 100% desain buatanmu

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Karya Kader - PR. PMII Kawah Chondrodimuko',
  description: 'Portal Berita Resmi PR. PMII Kawah Chondrodimuko',
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