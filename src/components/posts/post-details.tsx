'use client';

import type { Post } from '@/lib/definitions';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, BookOpen, BookText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PostDetailsProps = {
  post: Post;
};

const isValidDate = (dateString: string | undefined | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

export default function PostDetails({ post }: PostDetailsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="w-full">
          <BookText className="mr-2 h-4 w-4" /> Leer artículo completo
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto p-0">
        {post.imageUrl && (
          <div className="relative h-64 md:h-80 w-full">
            <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
            />
          </div>
        )}
        <div className="p-6">
            <SheetHeader className="mb-6 text-left">
                <SheetTitle className="text-3xl font-headline text-primary">{post.title}</SheetTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-base text-muted-foreground pt-2">
                    <span className="flex items-center gap-2 text-primary/80">
                        <User className="h-4 w-4" />
                        {post.author}
                    </span>
                    <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {isValidDate(post.publishDate) ? format(new Date(post.publishDate), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'N/A'}
                    </span>
                </div>
            </SheetHeader>
            
            <Separator className="my-6" />

            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-2 font-headline flex items-center gap-2"><BookOpen className="w-5 h-5 text-accent"/>Artículo</h3>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-justify">{post.article}</p>
                </div>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
