import type { Metadata } from 'next';
import './globals.css';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { FirebaseClientProvider } from '@/firebase/client-provider';


export const metadata: Metadata = {
  title: 'Ateaco Compañía de Teatro',
  description: 'Web oficial de la compañía de teatro Ateaco de A Coruña.',
  keywords: ['teatro', 'A Coruña', 'Ateaco', 'compañía de teatro', 'artes escénicas']
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased flex flex-col min-h-screen")}>
        <svg className="svg-defs">
          <defs>
              <linearGradient id="fill1" x1="28.9" y1="21.6" x2="68.4" y2="61.1" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#d5e1f1"/><stop offset="1" stopColor="#c8d7e9"/></linearGradient>
              <linearGradient id="fill2" x1="49.5" y1="18.9" x2="89" y2="58.4" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#e4f0ee"/><stop offset="1" stopColor="#dce8e6"/></linearGradient>
              <linearGradient id="fill3" x1="68.2" y1="36.2" x2="107.7" y2="75.7" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#f8f4e9"/><stop offset="1" stopColor="#f4eee0"/></linearGradient>
              <linearGradient id="stroke-grad" x1="-1.6" y1="35.9" x2="88" y2="35.9" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#d77a7b"/><stop offset=".1" stopColor="#c78d96"/><stop offset=".2" stopColor="#b4a3b5"/><stop offset=".4" stopColor="#a3b7d1"/><stop offset=".5" stopColor="#9ac2e6"/><stop offset=".6" stopColor="#97c5e3"/><stop offset=".7" stopColor="#8cbbd2"/><stop offset=".8" stopColor="#7ab0b9"/><stop offset=".9" stopColor="#5ea298"/><stop offset="1" stopColor="#549d8c"/></linearGradient>
          </defs>
        </svg>
        <FirebaseClientProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {children}
          </main>
          <Footer />
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
