'use server';

import { z } from 'zod';
import JSZip from 'jszip';

const downloadSchema = z.object({
  url: z.string().url(),
});

export async function downloadImageAction(formData: FormData): Promise<{
    success: boolean;
    error?: string;
    fileData?: {
        base64: string;
        contentType: string;
        filename: string;
    };
}> {
  const validatedFields = downloadSchema.safeParse({
    url: formData.get('url'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'URL no válida.',
    };
  }

  const { url } = validatedFields.data;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('No se pudo obtener la imagen del servidor.');
    }

    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const filename = url.split('/').pop()?.split('?')[0] || 'imagen.jpg';

    return {
        success: true,
        fileData: {
            base64,
            contentType,
            filename
        }
    };

  } catch (error) {
    console.error("Error al descargar la imagen:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'Error desconocido en el servidor.' };
  }
}

const base64Schema = z.object({
  url: z.string().url(),
});

export async function getImageAsBase64Action(formData: FormData): Promise<{
    success: boolean;
    error?: string;
    dataUrl?: string;
}> {
    const validatedFields = base64Schema.safeParse({
        url: formData.get('url'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'URL no válida.',
        };
    }

    const { url } = validatedFields.data;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('No se pudo obtener la imagen del servidor para la conversión a Base64.');
        }

        const imageBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        
        return {
            success: true,
            dataUrl: `data:${contentType};base64,${base64}`,
        };

    } catch (error) {
        console.error("Error al convertir la imagen a Base64:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor.';
        return { success: false, error: errorMessage };
    }
}


const downloadAllSchema = z.object({
  urls: z.array(z.string().url()),
});

export async function downloadAllImagesAsZipAction(formData: FormData): Promise<{
    success: boolean;
    error?: string;
    fileData?: {
        base64: string;
        filename: string;
    };
}> {
  const urls = formData.getAll('urls') as string[];
  const validatedFields = downloadAllSchema.safeParse({ urls });

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Una o más URLs no son válidas.',
    };
  }
  
  const zip = new JSZip();

  try {
    const fetchPromises = validatedFields.data.urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`No se pudo descargar la imagen: ${url}`);
          return;
        }
        const imageBuffer = await response.arrayBuffer();
        const filename = url.split('/').pop()?.split('?')[0] || 'imagen.jpg';
        zip.file(filename, imageBuffer);
      } catch (e) {
        console.warn(`Error procesando la URL ${url}:`, e);
      }
    });

    await Promise.all(fetchPromises);

    const zipAsBase64 = await zip.generateAsync({ type: 'base64' });

    return {
        success: true,
        fileData: {
            base64: zipAsBase64,
            filename: 'galeria.zip'
        }
    };

  } catch (error) {
    console.error("Error al crear el archivo ZIP:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'Error desconocido en el servidor al crear el ZIP.' };
  }
}
