'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFirestore, useUser, useStorage } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, getDoc, deleteDoc } from 'firebase/firestore';
import type { GalleryImage } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteObject, ref } from 'firebase/storage';

export default function GaleriaPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, isLoading: isLoadingUser } = useUser();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const galleryCollection = React.useMemo(() => firestore ? collection(firestore, 'gallery') : null, [firestore]);
  const { data: galleryImages, isLoading: isLoadingImages } = useCollection<GalleryImage>(galleryCollection);
  const { toast } = useToast();
  const [shuffledImages, setShuffledImages] = React.useState<GalleryImage[]>([]);

  React.useEffect(() => {
    if (galleryImages && galleryImages.length > 0) {
      setShuffledImages([...galleryImages].sort(() => Math.random() - 0.5));
    }
  }, [galleryImages]);

  React.useEffect(() => {
    if (user && firestore) {
      const checkAdminStatus = async () => {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists());
      };
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user, firestore]);

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation(); 
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'imagen-galeria';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDelete = async (e: React.MouseEvent, image: GalleryImage) => {
    e.stopPropagation();
    if (!firestore || !storage) return;
    try {
        const imageRef = ref(storage, image.imageUrl);
        await deleteObject(imageRef);
        await deleteDoc(doc(firestore, "gallery", image.id));
        toast({ title: "Imagen eliminada", description: "La imagen ha sido eliminada de la galería." });
    } catch (error: any) {
         if (error.code === 'storage/object-not-found') {
            try {
                await deleteDoc(doc(firestore, "gallery", image.id));
                toast({ title: 'Referencia eliminada', description: 'La referencia de la imagen ha sido eliminada.' });
            } catch (dbError) {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la imagen de la base de datos.' });
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la imagen.' });
        }
    }
  };
  
  const isLoading = isLoadingImages || isLoadingUser;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Galería de Fotos</h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          Momentos inolvidables, escenas memorables y la magia del teatro capturada en imágenes.
        </p>
      </div>

      {isLoading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton key={index} className="w-full h-48 md:h-64 break-inside-avoid" />
              ))}
          </div>
      )}

      {!isLoading && shuffledImages.length > 0 && (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {shuffledImages.map((image) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer group relative transform hover:scale-105 transition-transform duration-300 ease-in-out break-inside-avoid">
                  <CardContent className="p-0">
                    <Image
                      src={image.imageUrl}
                      alt="Imagen de la galería"
                      width={400}
                      height={400}
                      className="object-cover w-full h-auto"
                    />
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                           <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Eliminará permanentemente la imagen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => handleDelete(e, image)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute bottom-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                          onClick={(e) => handleDownload(e, image.imageUrl)}
                          aria-label="Descargar imagen"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 border-0">
                 <DialogHeader>
                    <DialogTitle className="sr-only">Imagen de la galería ampliada</DialogTitle>
                  </DialogHeader>
                <Image
                  src={image.imageUrl}
                  alt="Imagen de la galería ampliada"
                  width={1200}
                  height={800}
                  className="object-contain w-full h-auto rounded-lg"
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

       {!isLoading && (!galleryImages || galleryImages.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No hay imágenes en la galería para mostrar.</p>
            </div>
        )}
    </div>
  );
}
