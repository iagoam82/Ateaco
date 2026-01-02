'use client';

import type { Performance, Play } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Info, Calendar, Clock, User, Users, Feather, BookOpen, Plus, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PlayDetailsProps = {
  play: Play;
  fullWidth?: boolean;
};

const isValidDate = (dateString: string | undefined | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

export default function PlayDetails({ play, fullWidth = false }: PlayDetailsProps) {

  const formatPerformance = (perf: Performance) => {
    const date = isValidDate(perf.date) ? format(new Date(perf.date), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'Fecha no especificada';
    return `${date} - ${perf.location}, ${perf.city}`;
  }
  
  const premiereDateFormatted = play.premiereDate ? formatPerformance(play.premiereDate) : 'No especificada';
  const performanceDatesFormatted = Array.isArray(play.performanceDates) ? play.performanceDates.map(formatPerformance) : [];

  const detailItems = [
    { icon: BookOpen, label: 'Género', value: play.genre },
    { icon: Clock, label: 'Duración', value: `${play.duration} min` },
    { icon: Feather, label: 'Autor', value: play.author },
    { icon: User, label: 'Director', value: play.director },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className={cn(fullWidth && 'w-full')}>
          <Plus className="mr-2 h-4 w-4" /> Ver más
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-3xl font-headline text-primary">{play.title}</SheetTitle>
          <SheetDescription className="text-lg text-muted-foreground">{play.genre}</SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline flex items-center gap-2"><BookOpen className="w-5 h-5 text-accent"/>Sinopsis:</h3>
            <p className="text-foreground/80 leading-relaxed">{play.synopsis}</p>
          </div>

          <Separator />

          <div>
             <h3 className="text-xl font-semibold mb-4 font-headline flex items-center gap-2"><Info className="w-5 h-5 text-accent"/>Detalles</h3>
             <div className="flex items-start gap-3 mb-4">
                  <Calendar className="w-5 h-5 mt-1 text-accent flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Estreno</p>
                    <p className="text-muted-foreground">{premiereDateFormatted}</p>
                  </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {detailItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 mt-1 text-accent flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline flex items-center gap-2"><Users className="w-5 h-5 text-accent"/>Actores</h3>
            <ul className="list-disc list-inside text-foreground/80 space-y-1">
              {Array.isArray(play.actors) && play.actors.map((actor, index) => <li key={index}>{actor}</li>)}
            </ul>
          </div>

          {performanceDatesFormatted && performanceDatesFormatted.length > 0 && (
            <>
            <Separator />
            <div>
              <h3 className="text-xl font-semibold mb-2 font-headline flex items-center gap-2"><MapPin className="w-5 h-5 text-accent"/>Representaciones</h3>
              <ul className="list-none text-foreground/80 space-y-2">
                {performanceDatesFormatted.map((date, index) => <li key={index} className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground"/><span>{date}</span></li>)}
              </ul>
            </div>
            </>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
