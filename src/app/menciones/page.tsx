'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Mention } from '@/lib/definitions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Calendar, Newspaper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function MencionesPage() {
    const firestore = useFirestore();
    const mentionsCollection = React.useMemo(() => firestore ? collection(firestore, 'mentions') : null, [firestore]);
    const { data: mentions, isLoading } = useCollection<Mention>(mentionsCollection);

    const sortedMentions = React.useMemo(() => {
        if (!mentions) return [];
        return [...mentions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [mentions]);
    
    const isValidDate = (dateString: string | undefined | null) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Menciones Externas</h1>
                <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                    Lo que dicen de nosotros en los medios.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                 {isLoading && Array.from({ length: 2 }).map((_, index) => (
                    <Card key={index} className="flex flex-col md:flex-row overflow-hidden shadow-lg">
                        <div className="md:w-1/3 relative h-48 md:h-auto">
                            <Skeleton className="w-full h-full" />
                        </div>
                        <div className="flex flex-col justify-between md:w-2/3">
                            <CardHeader>
                                <Skeleton className="h-5 w-1/3 mb-2" />
                                <Skeleton className="h-8 w-3/4 mb-4" />
                                <Skeleton className="h-5 w-1/2" />
                            </CardHeader>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </div>
                    </Card>
                 ))}

                {!isLoading && sortedMentions.map((mention) => (
                    <Card key={mention.id} className="flex flex-col md:flex-row overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="md:w-1/3 relative h-48 md:h-auto">
                            {mention.imageUrl ? (
                            <Image
                                src={mention.imageUrl}
                                alt={`Logo de ${mention.source}`}
                                fill
                                className="object-cover"
                            />
                            ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Newspaper className="w-16 h-16 text-muted-foreground" />
                            </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-between md:w-2/3">
                            <CardHeader>
                                <CardDescription className="text-accent font-semibold">{mention.source}</CardDescription>
                                <CardTitle className="text-2xl font-headline text-primary">{mention.title}</CardTitle>
                                <div className="flex items-center text-sm text-muted-foreground pt-2">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>{isValidDate(mention.date) ? format(new Date(mention.date), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'N/A'}</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {mention.type === 'traditional' && mention.content && (
                                <p className="text-sm text-muted-foreground italic">"{mention.content.substring(0, 150)}..."</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                {mention.type === 'digital' && mention.url ? (
                                    <Button asChild className="w-full">
                                        <Link href={mention.url} target="_blank" rel="noopener noreferrer">
                                            Leer artículo <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : mention.type === 'traditional' && mention.content ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full">Leer contenido</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{mention.title}</DialogTitle>
                                                <DialogDescription>{mention.source} - {isValidDate(mention.date) ? format(new Date(mention.date), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'N/A'}</DialogDescription>
                                            </DialogHeader>
                                            <p className="whitespace-pre-wrap">{mention.content}</p>
                                        </DialogContent>
                                    </Dialog>
                                ) : null}
                            </CardFooter>
                        </div>
                    </Card>
                ))}

                 {!isLoading && sortedMentions.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No hay menciones para mostrar en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
