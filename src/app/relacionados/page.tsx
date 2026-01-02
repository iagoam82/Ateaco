'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { RelatedWebsite } from '@/lib/definitions';
import { collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function RelacionadosPage() {
    const firestore = useFirestore();
    const websitesCollection = React.useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, 'related-web');
    }, [firestore]);
    const { data: sites, isLoading } = useCollection<RelatedWebsite>(websitesCollection);
    const [shuffledSites, setShuffledSites] = React.useState<RelatedWebsite[]>([]);

    React.useEffect(() => {
        if (sites && sites.length > 0) {
            setShuffledSites([...sites].sort(() => Math.random() - 0.5));
        }
    }, [sites]);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Webs Relacionadas</h1>
                <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                    Una colección de recursos y sitios de interés del mundo del teatro.
                </p>
            </div>

            {isLoading && (
                 <div className="text-center py-16 flex flex-col items-center gap-4">
                    <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando webs relacionadas...</p>
                 </div>
            )}

            {!isLoading && shuffledSites.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {shuffledSites.map((site) => (
                        <Card key={site.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                            {site.imageUrl && (
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={site.imageUrl}
                                        alt={`Logo de ${site.name}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex flex-col flex-grow">
                                <CardHeader>
                                    <CardTitle className="text-xl font-headline text-primary">{site.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <CardDescription>{site.description}</CardDescription>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={site.url} target="_blank" rel="noopener noreferrer">
                                            Visitar web <ArrowUpRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && (!sites || sites.length === 0) && (
                 <div className="text-center py-16">
                    <p className="text-muted-foreground">No hay sitios web relacionados para mostrar en este momento.</p>
                 </div>
            )}
        </div>
    );
}
