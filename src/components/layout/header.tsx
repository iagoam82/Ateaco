'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import AteacoLogo from '@/components/icons/ateaco-logo';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import type { Branding } from '@/lib/definitions';
import { Skeleton } from '../ui/skeleton';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/elenco', label: 'Elenco' },
  { href: '/obras', label: 'Obras' },
  { href: '/posts', label: 'Posts' },
  { href: '/galeria', label: 'Galería' },
  { href: '/menciones', label: 'Menciones' },
  { href: '/relacionados', label: 'Webs Relacionadas' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const isAdminPage = pathname === '/admin';

  const brandingDocRef = React.useMemo(() => firestore ? doc(firestore, 'branding', 'main') : null, [firestore]);
  const { data: branding, isLoading: isLoadingBranding } = useDoc<Branding>(brandingDocRef);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const Logo = () => {
    if (isLoadingBranding) {
      return <Skeleton className="h-10 w-24" />;
    }
    if (branding?.logoUrl) {
      return <Image src={branding.logoUrl} alt="Ateaco Logo" width={110} height={40} className="h-10 w-auto" />;
    }
    return <AteacoLogo className="h-10 w-auto text-primary" />;
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-bold text-xl font-headline text-primary">Ateaco</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {!isAdminPage && (
            <>
              {navLinks.map((link) => (
                <Button key={link.href} variant="ghost" asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      pathname === link.href ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                </Button>
              ))}
            </>
          )}
          {!isLoading && user && (
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
          )}
          {!isAdminPage && (
            <Button variant="ghost" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xs p-0">
               <SheetHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                        <Logo />
                        <span className="font-bold text-xl font-headline text-primary">Ateaco</span>
                    </Link>
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                            <span className="sr-only">Cerrar menú</span>
                        </Button>
                    </SheetClose>
                </div>
                 <SheetTitle className="sr-only">Menú Principal</SheetTitle>
                 <SheetDescription className="sr-only">Navegación principal del sitio web. Selecciona una página para visitar.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <nav className="flex-grow p-4">
                  <ul className="space-y-2">
                    {!isAdminPage && navLinks.map((link) => (
                      <li key={link.href}>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link
                            href={link.href}
                            onClick={() => setIsSheetOpen(false)}
                            className={cn(
                                'text-lg font-medium transition-colors w-full',
                                pathname === link.href ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
                            )}
                            >
                            {link.label}
                            </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className='p-4 border-t'>
                    {!isLoading && user && (
                        <Button variant="destructive" className="w-full justify-start" onClick={() => { handleLogout(); setIsSheetOpen(false); }}>
                            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                        </Button>
                     )}
                     <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/admin" onClick={() => setIsSheetOpen(false)} className={cn('text-lg font-medium transition-colors w-full justify-start', pathname === '/admin' ? 'text-primary' : 'text-foreground/70 hover:text-foreground')}>Admin</Link>
                    </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
