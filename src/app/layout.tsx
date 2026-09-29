import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HomeCraft 3D | Interactive Architectural Home Configurator',
  description:
    'Commercial 3D Home Configurator for architects and buyers. Explore architectural models in real time and customize wall colors, hardwood flooring, and ceramic tiles directly inside the browser.',
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
