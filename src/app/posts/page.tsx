'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Calendar, Newspaper } from 'lucide-react';
import PostDetails from '@/components/posts/post-details';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Post } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PostsPage() {
    const firestore = useFirestore();
    const postsCollection = React.useMemo(() => firestore ? collection(firestore, 'posts') : null, [firestore]);
    const { data: posts, isLoading } = useCollection<Post>(postsCollection);
    
    const sortedPosts = React.useMemo(() => {
        if (!posts) return [];
        return [...posts].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    }, [posts]);

    const isValidDate = (dateString: string | undefined | null) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Nuestro Blog</h1>
                <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                    Reflexiones, historias y anécdotas desde el corazón de Ateaco.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {isLoading && Array.from({ length: 4 }).map((_, index) => (
                    <article key={index}>
                        <Card className="overflow-hidden shadow-lg flex flex-col h-full">
                            <Skeleton className="h-64 w-full" />
                            <div className="flex flex-col flex-grow p-6">
                                <Skeleton className="h-7 w-3/4 mb-4" />
                                <div className="flex items-center gap-4 mb-4">
                                  <Skeleton className="h-5 w-28" />
                                  <Skeleton className="h-5 w-32" />
                                </div>
                                <div className="space-y-2 mt-2">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-5/6" />
                                </div>
                            </div>
                        </Card>
                    </article>
                 ))}

                {!isLoading && sortedPosts.map((post) => {
                    const TRUNCATE_LENGTH = 250;
                    const isTruncated = post.article.length > TRUNCATE_LENGTH;
                    const truncatedArticle = isTruncated
                        ? `${post.article.substring(0, TRUNCATE_LENGTH)}...`
                        : post.article;

                    return (
                        <article key={post.id}>
                            <Card className="overflow-hidden shadow-lg flex flex-col h-full">
                                {post.imageUrl ? (
                                    <div className="relative h-64 w-full">
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-64 w-full bg-muted flex items-center justify-center">
                                      <Newspaper className="w-24 h-24 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex flex-col flex-grow">
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-headline text-primary">{post.title}</CardTitle>
                                        <CardDescription className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-x-4 gap-y-1 text-base">
                                            <span className="flex items-center gap-2 text-primary/80">
                                                <User className="h-4 w-4" />
                                                {post.author}
                                            </span>
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {isValidDate(post.publishDate) ? format(new Date(post.publishDate), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'N/A'}
                                            </span>

                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{truncatedArticle}</p>
                                    </CardContent>
                                    {isTruncated && (
                                        <CardFooter>
                                            <PostDetails post={post} />
                                        </CardFooter>
                                    )}
                                </div>
                            </Card>
                        </article>
                    );
                })}
            </div>
             {!isLoading && sortedPosts.length === 0 && (
                <div className="text-center py-16 col-span-1 md:col-span-2">
                    <p className="text-muted-foreground">No hay posts en el blog todavía.</p>
                </div>
            )}
        </div>
    );
}
