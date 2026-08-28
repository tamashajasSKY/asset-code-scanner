import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dell Service Tag címkeolvasó',
  description: 'Dell eszközök Service Tag, Express SVC Code és PPID azonosítóinak mobilos beolvasása és Excel-exportja.',
  openGraph: {
    title: 'Dell Service Tag címkeolvasó',
    description: 'Mobilos beolvasás és Excel-export Dell eszközökhöz.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dell Service Tag címkeolvasó',
    description: 'Mobilos beolvasás és Excel-export Dell eszközökhöz.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
