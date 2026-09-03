import type { Metadata } from 'next';
import './globals.css';
import { AppleNavbar } from '../components/AppleNavbar';

export const metadata: Metadata = {
  title: 'SatQuery AI — Interactive Earth Observation Platform',
  description: 'Evidence-grounded multimodal remote sensing vision-language platform for ISRO / SIH26167.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05070a] text-neutral-200 antialiased h-screen overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <AppleNavbar />
        <div className="flex-1 overflow-hidden pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
