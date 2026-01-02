'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import './carousel.css';
import { useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, collection } from 'firebase/firestore';
import type { HomePageContent, GalleryImage } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase/firestore/use-collection';

const HomeContent = () => {
  const firestore = useFirestore();
  const homeDocRef = React.useMemo(() => firestore ? doc(firestore, 'pages', 'home') : null, [firestore]);
  const { data: homeContent, isLoading } = useDoc<HomePageContent>(homeDocRef);

  if (isLoading) {
    return (
      <section className="text-center">
        <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto mb-2" />
        <Skeleton className="h-5 w-full max-w-xl mx-auto" />
      </section>
    );
  }

  return (
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-4">
          {homeContent?.title || 'Bienvenidos a Ateaco'}
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/80 whitespace-pre-line">
          {homeContent?.paragraph || 'Ateaco nació en A Coruña en 2002 gracias a las inquietudes de un grupo de conocidos con una pasión en común, el teatro. Con una mezcla de edades y un entusiasmo inquebrantable, comenzamos este viaje con la ilusión de contribuir al panorama teatral local y compartir nuestra pasión por las artes escénicas con el público. Nos tomamos cada ensayo como un encuentro entre amigos, donde el esfuerzo y la dedicación se combinan con la alegría y el humor.'}
        </p>
      </section>
  )
}


export default function Home() {
  const firestore = useFirestore();
  const galleryCollection = React.useMemo(() => firestore ? collection(firestore, 'gallery') : null, [firestore]);
  const { data: galleryImagesData, isLoading } = useCollection<GalleryImage>(galleryCollection);
  
  const [images, setImages] = React.useState<GalleryImage[]>([]);
  
  React.useEffect(() => {
    if (galleryImagesData && galleryImagesData.length > 0) {
      const shuffledImages = [...galleryImagesData]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      
      // Duplicamos las imágenes para el efecto de scroll infinito
      setImages([...shuffledImages, ...shuffledImages]);
    }

    const scrollers = document.querySelectorAll(".scroller");

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      addAnimation();
    }

    function addAnimation() {
      scrollers.forEach((scroller) => {
        scroller.setAttribute("data-animated", "true");
      });
    }
  }, [galleryImagesData]);


  return (
    <div className="space-y-12">
      <HomeContent />

      <section className="w-full max-w-6xl mx-auto">
        <div className="scroller" data-speed="slow">
            <ul className="tag-list scroller__inner">
                {isLoading || images.length === 0 ? Array.from({ length: 10 }).map((_, index) => (
                  <li key={index}>
                    <Card className="overflow-hidden">
                      <CardContent className="flex aspect-square items-center justify-center p-0">
                        <div className="w-[200px] h-[200px] bg-muted animate-pulse" />
                      </CardContent>
                    </Card>
                  </li>
                )) : images.map((image, index) => (
                   <li key={`${image.id}-${index}`}>
                     <Card className="overflow-hidden">
                        <CardContent className="flex aspect-square items-center justify-center p-0">
                        <Image
                            src={image.imageUrl}
                            alt="Imagen de la galería"
                            width={200}
                            height={200}
                            className="object-cover w-full h-full"
                        />
                        </CardContent>
                    </Card>
                   </li>
                ))}
            </ul>
        </div>
      </section>
    </div>
  );
}
