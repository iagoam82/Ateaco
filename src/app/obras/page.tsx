'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import type { Play } from '@/lib/definitions';
import { Card } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import PlayDetails from '@/components/plays/play-details';
import { Button } from '@/components/ui/button';
import { Clock, Ticket, Theater, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ObrasPage() {
  const firestore = useFirestore();
  const playsCollection = React.useMemo(() => firestore ? collection(firestore, 'plays') : null, [firestore]);
  const { data: playsData, isLoading } = useCollection<Play>(playsCollection);
  
  const [sortedPlays, setSortedPlays] = React.useState<Play[]>([]);

  React.useEffect(() => {
    if (playsData) {
      const onShowPlays = playsData
        .filter(p => p.onShow)
        .sort((a, b) => {
          const dateA = a.premiereDate?.date ? new Date(a.premiereDate.date) : new Date(0);
          const dateB = b.premiereDate?.date ? new Date(b.premiereDate.date) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      const otherPlays = playsData.filter(p => !p.onShow);
      const shuffledOtherPlays = [...otherPlays].sort(() => Math.random() - 0.5);

      setSortedPlays([...onShowPlays, ...shuffledOtherPlays]);
    }
  }, [playsData]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Nuestras Obras</h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          Un recorrido por las producciones que hemos llevado a escena a lo largo de nuestra historia.
        </p>
      </div>

      {isLoading && (
        <div className="max-w-4xl mx-auto space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
             <Card key={index} className="flex flex-col md:flex-row items-center overflow-hidden shadow-lg">
                <div className="relative w-full md:w-1/4 aspect-[3/4]">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="flex-1 self-stretch flex flex-col p-6">
                  <div className="flex-grow">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="mt-4 flex items-center gap-4 md:self-end">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                </div>
             </Card>
          ))}
        </div>
      )}

      {!isLoading && sortedPlays.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
          {sortedPlays.map((play) => {
            const isOnShow = play.onShow && play.ticketUrl;
            return (
              <Card key={play.id} className={cn(
                "flex flex-col md:flex-row items-center overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300",
                play.onShow && "border-2 border-destructive ring-2 ring-destructive/50"
              )}>
                <div className="relative w-full md:w-1/4 aspect-[3/4]">
                   {play.posterUrl ? (
                    <Image
                      src={play.posterUrl}
                      alt={`Cartel de ${play.title}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex items-center justify-center h-full">
                      <Theater className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 self-stretch flex flex-col p-6">
                  <div className="flex-grow space-y-2">
                    
                    {play.onShow && play.nextShow?.date && (
                      <Badge variant="destructive" className="mb-2">
                        Próxima función: {format(new Date(play.nextShow.date), "dd/MM/yyyy", { locale: es })} en {play.nextShow.city}, {play.nextShow.province}
                      </Badge>
                    )}

                    <h2 className="text-2xl font-headline font-bold text-primary">{play.title}</h2>
                    <div className="flex flex-col items-start gap-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Theater className="w-4 h-4 mr-1.5" />
                        <span className="font-semibold text-foreground/90 mr-1">Género:</span>
                        <span>{play.genre}</span>
                      </div>
                       <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span className="font-semibold text-foreground/90 mr-1">Duración:</span>
                        <span>{play.duration} min.</span>
                      </div>
                    </div>
                     <div className="flex items-start text-sm text-muted-foreground pt-1">
                        <BookOpen className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2">
                           <span className="font-semibold text-foreground/90 mr-1">Sinopsis:</span>
                          {play.synopsis}
                        </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 md:self-end">
                    {isOnShow && (
                      <Button asChild variant="destructive">
                        <Link href={play.ticketUrl!} target="_blank" rel="noopener noreferrer">
                          <Ticket className="mr-2 h-4 w-4" /> Entradas
                        </Link>
                      </Button>
                    )}
                    <PlayDetails play={play} fullWidth={!isOnShow} />
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
      )}
       {!isLoading && sortedPlays.length === 0 && (
         <div className="text-center py-16">
            <p className="text-muted-foreground">No hay obras para mostrar en este momento.</p>
         </div>
      )}
    </div>
  );
}
