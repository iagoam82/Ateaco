'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AteacoLogo from '@/components/icons/ateaco-logo';
import { useFirestore, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SocialLink, Branding } from '@/lib/definitions';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FacebookIcon from '@/components/icons/facebook-logo';
import InstagramIcon from '@/components/icons/instagram-logo';
import YoutubeIcon from '@/components/icons/youtube-logo';
import XIcon from '@/components/icons/x-logo';


const socialIconMap: { [key in SocialLink['name']]: React.ElementType } = {
  Facebook: FacebookIcon,
  YouTube: YoutubeIcon,
  Instagram: InstagramIcon,
  X: XIcon,
};


const SocialLinks = () => {
    const firestore = useFirestore();
    const socialLinksCollection = React.useMemo(() => firestore ? collection(firestore, 'social-links') : null, [firestore]);
    const { data: socialLinks, isLoading } = useCollection<SocialLink>(socialLinksCollection);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
            </div>
        );
    }
    
    const visibleLinks = socialLinks?.filter(link => link.url) || [];

    return (
        <div className="flex items-center space-x-4">
            {visibleLinks.map((social) => {
                 const Icon = socialIconMap[social.name] || User;
                 return (
                    <Link
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                    >
                        <Icon className="h-6 w-6" />
                        <span className="sr-only">{social.name}</span>
                    </Link>
                )
            })}
        </div>
    );
};


export default function Footer() {
  const [copyrightText, setCopyrightText] = React.useState('');
  
  const firestore = useFirestore();
  const brandingDocRef = React.useMemo(() => firestore ? doc(firestore, 'branding', 'main') : null, [firestore]);
  const { data: branding, isLoading: isLoadingBranding } = useDoc<Branding>(brandingDocRef);


  React.useEffect(() => {
    // This runs only on the client, after hydration, preventing mismatch
    setCopyrightText(`© ${new Date().getFullYear()} Asociación cultural Ateaco. Todos los derechos reservados.`);
  }, []);

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
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-lg font-headline text-primary">Ateaco</span>
          </div>
            {copyrightText ? (
                <p className="text-sm text-muted-foreground">{copyrightText}</p>
            ) : (
                <Skeleton className="h-5 w-96 max-w-full" />
            )}
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
