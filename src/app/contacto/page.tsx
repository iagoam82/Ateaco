'use client';

import * as React from 'react';
import Link from 'next/link';
import ContactForm from '@/app/contacto/contact-form';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { SocialLink } from '@/lib/definitions';
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

const SocialLinksDisplay = () => {
    const firestore = useFirestore();
    const socialLinksCollection = React.useMemo(() => firestore ? collection(firestore, 'social-links') : null, [firestore]);
    const { data: socialLinks, isLoading } = useCollection<SocialLink>(socialLinksCollection);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>
        )
    }

    const visibleLinks = socialLinks?.filter(link => link.url) || [];

    return (
        <div className="flex items-center space-x-6">
            {visibleLinks.map((social) => {
                const Icon = socialIconMap[social.name] || User;
                return (
                    <Link
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                    >
                        <div className="p-4 bg-muted rounded-full group-hover:bg-accent/20 transition-colors">
                            <Icon className="h-8 w-8" />
                        </div>
                        <span className="text-sm font-medium">{social.name}</span>
                    </Link>
                )
            })}
        </div>
    );
};


export default function ContactoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Contacto y Redes Sociales</h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          ¿Tienes alguna pregunta o propuesta? ¡Nos encantaría saber de ti!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold font-headline text-primary mb-4">Síguenos</h2>
            <p className="text-muted-foreground mb-6">
              Mantente al día de nuestras últimas noticias, funciones y momentos entre bambalinas a través de nuestras redes sociales.
            </p>
            <SocialLinksDisplay />
          </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold font-headline text-primary mb-4">Envíanos un mensaje</h2>
            <ContactForm />
        </div>
      </div>
    </div>
  );
}
