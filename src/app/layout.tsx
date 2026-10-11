import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mitra Megah Interior | 3D Architectural & Interior Configurator',
  description:
    'Mitra Megah Interior - Solusi Desain Interior & Arsitektur Interaktif 3D. Kustomisasi warna dinding, material lantai, dan visualisasi spasial secara real-time langsung di browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F7F7F5] text-[#171717] antialiased">
        {children}
      </body>
    </html>
  );
}
