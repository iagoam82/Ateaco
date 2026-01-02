'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { User, LoaderCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { CastMember } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import FacebookIcon from '@/components/icons/facebook-logo';
import InstagramIcon from '@/components/icons/instagram-logo';
import YoutubeIcon from '@/components/icons/youtube-logo';
import XIcon from '@/components/icons/x-logo';
import TikTokIcon from '@/components/icons/tiktok-logo';
import '../globals.css';


const socialIcons = [
    { key: 'facebookUrl', icon: FacebookIcon },
    { key: 'instagramUrl', icon: InstagramIcon },
    { key: 'youtubeUrl', icon: YoutubeIcon },
    { key: 'xUrl', icon: XIcon },
    { key: 'tiktokUrl', icon: TikTokIcon },
] as const;


export default function ElencoPage() {
  const firestore = useFirestore();
  const castCollection = React.useMemo(() => firestore ? collection(firestore, 'cast') : null, [firestore]);
  const { data: cast, isLoading } = useCollection<CastMember>(castCollection);
  const [shuffledCast, setShuffledCast] = React.useState<CastMember[]>([]);

  React.useEffect(() => {
    if (cast && cast.length > 0) {
      setShuffledCast([...cast].sort(() => Math.random() - 0.5));
    }
  }, [cast]);


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Nuestro Elenco</h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          Conoce a las personas que dan vida a Ateaco, dentro y fuera del escenario.
        </p>
      </div>

       {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Card key={index} className="flex flex-col text-center items-center pt-6">
                         <Skeleton className="h-36 w-36 rounded-full" />
                         <CardHeader className="p-4 pt-4 w-full">
                            <Skeleton className="h-6 w-3/4 mx-auto" />
                            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                        </CardHeader>
                        <CardContent className="w-full flex-grow p-4 pt-0">
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}

      {!isLoading && shuffledCast.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shuffledCast.map((member) => (
            <Card key={member.id} className="flex flex-col text-center items-center pt-6 transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl">
              <div className="relative h-36 w-36 mb-4">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={`Foto de ${member.name}`}
                    fill
                    className="object-cover rounded-full border-4 border-background shadow-md"
                  />
                ) : (
                  <div className="bg-muted flex items-center justify-center h-full w-full rounded-full border-4 border-background shadow-md">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="p-4 pt-0">
                <CardTitle className="text-xl font-headline text-primary">{member.name}</CardTitle>
                <CardDescription className="font-semibold text-sm text-primary/80 h-auto flex items-center justify-center flex-wrap gap-1 py-1">
                   {member.roles.map((role, index) => <Badge key={index} variant="secondary">{role}</Badge>)}
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full flex-grow p-4 pt-0">
                  <div className="flex justify-center items-center gap-3 mb-4">
                    {socialIcons.map(social => {
                        const url = member[social.key];
                        if (url) {
                            return (
                                <Link key={social.key} href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                    <social.icon className="h-5 w-5" />
                                </Link>
                            );
                        }
                        return null;
                    })}
                  </div>
                <div className="text-foreground/80 text-sm text-left">
                  {member.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        {!isLoading && (!cast || cast.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No hay miembros del elenco para mostrar en este momento.</p>
            </div>
        )}
    </div>
  );
}
