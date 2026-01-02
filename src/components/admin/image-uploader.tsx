'use client';

import * as React from 'react';
import { useDropzone, type FileWithPath } from 'react-dropzone';
import { UploadCloud, X, LoaderCircle } from 'lucide-react';
import { useStorage } from '@/firebase/provider';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import Image from 'next/image';

interface ImageUploaderProps {
  onUploadSuccess: (urls: string[]) => void;
  onUploadError: (error: string) => void;
  folder: string;
  multiple?: boolean;
  value?: string; // URL de la imagen actual para previsualización
  onRemovePreview?: () => void; // Función para eliminar la previsualización
}

export function ImageUploader({
  onUploadSuccess,
  onUploadError,
  folder,
  multiple = true,
  value,
  onRemovePreview,
}: ImageUploaderProps) {
  const storage = useStorage();
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [fileCount, setFileCount] = React.useState({ uploading: 0, total: 0 });
  const isUploading = uploadProgress !== null;

  const onDrop = React.useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (!storage) {
        onUploadError("El servicio de almacenamiento no está disponible.");
        return;
      }
      
      if (acceptedFiles.length === 0) {
        onUploadError("No se ha seleccionado ningún archivo válido.");
        return;
      }

      setUploadProgress(0);
      setFileCount({ uploading: 0, total: acceptedFiles.length });
      
      const uploadPromises = acceptedFiles.map(file => {
        const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => reject(error),
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setFileCount(prev => ({ ...prev, uploading: prev.uploading + 1 }));
                setUploadProgress((fileCount.uploading + 1) / fileCount.total * 100);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      });

      try {
        const downloadURLs = await Promise.all(uploadPromises);
        onUploadSuccess(downloadURLs);
      } catch (error: any) {
        console.error('Upload failed:', error);
          let errorMessage = 'Ocurrió un error desconocido al subir las imágenes.';
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = "No tienes permisos para subir archivos.";
              break;
            case 'storage/canceled':
              errorMessage = "La subida ha sido cancelada.";
              break;
          }
          onUploadError(errorMessage);
      } finally {
        setUploadProgress(null);
        setFileCount({ uploading: 0, total: 0 });
      }
    },
    [storage, onUploadSuccess, onUploadError, folder, fileCount]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    multiple: multiple,
    disabled: !storage || isUploading,
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div
            {...getRootProps()}
            className={cn(
              'relative w-full aspect-video rounded-md border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-center cursor-pointer transition-colors overflow-hidden',
              isDragActive ? 'bg-accent/20 border-primary' : 'bg-muted/50',
              (!storage || isUploading) && 'cursor-not-allowed bg-muted/20 opacity-50',
              !value && 'hover:bg-muted'
            )}
          >
            <input {...getInputProps()} />
            
            {value && !isUploading && (
              <>
                <Image
                    src={value}
                    alt="Vista previa"
                    fill
                    className="object-contain"
                />
                {onRemovePreview && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 z-10"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemovePreview();
                        }}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Eliminar imagen</span>
                    </Button>
                )}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-white text-sm font-semibold">
                      <p>Cambiar imagen</p>
                      <p className="text-xs">Arrastra o haz clic</p>
                    </div>
                </div>
              </>
            )}

            {!value && !isUploading && (
                 <div className="space-y-2 text-muted-foreground">
                    {!storage ? (
                    <div className='text-destructive p-4'>
                        <LoaderCircle className="h-10 w-10 mx-auto animate-spin" />
                        <p className="font-semibold mt-2">El almacenamiento no está disponible</p>
                    </div>
                    ) : (
                    <>
                        <UploadCloud className="h-10 w-10 mx-auto" />
                        <p className="font-semibold">Arrastra y suelta {multiple ? 'imágenes' : 'una imagen'} aquí</p>
                        <p className="text-xs">o haz clic para seleccionar {multiple ? 'archivos' : 'un archivo'}</p>
                    </>
                    )}
              </div>
            )}
            
            {isUploading && (
              <div className="w-4/5 space-y-3 bg-background/80 p-4 rounded-md">
                <p className="text-sm text-muted-foreground">Subiendo {fileCount.total} {fileCount.total > 1 ? 'imágenes' : 'imagen'}...</p>
                <Progress value={uploadProgress} className="w-full" />
                {uploadProgress !== null && (
                  <p className="text-xs font-mono text-muted-foreground">{Math.round(uploadProgress)}% ({fileCount.uploading}/{fileCount.total})</p>
                )}
              </div>
            )}
          </div>
      </CardContent>
    </Card>
  );
}
