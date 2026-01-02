'use client';

import * as React from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, PlusCircle, Trash2, User, Check, ChevronsUpDown, Pencil, Image as ImageIcon, ArrowUpRight, LogOut, Newspaper, Download, Clock, Feather, BookOpen, MapPin, Info, Theater, Plus, Link as LinkIcon, Palette, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger, PopoverPortal } from "@/components/ui/dialog";
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useStorage, useUser } from '@/firebase';
import { addRelatedWebsite, updateHomePageContent, updateRelatedWebsite, addCastMember, updateCastMember, deleteCastMember, addPlay, updatePlay, deletePlay, addPost, updatePost, deletePost, updateSocialLink, addSocialLink, deleteSocialLink, addGalleryImage, updateGalleryImage, deleteGalleryImage, addMention, updateMention, deleteMention, addAdmin, deleteAdmin, updateBranding } from '@/firebase/firestore/writes';
import type { HomePageContent, RelatedWebsite, RelatedWebsiteDoc, CastMember, CastMemberDoc, Play, PlayDoc, Performance, Post, PostDoc, SocialLink, SocialLinkDoc, GalleryImage, Mention, MentionDoc, AdminUser, AdminUserDoc, Branding } from '@/lib/definitions';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { deleteObject, ref } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { seedMentions, seedPlays, seedPosts } from '@/lib/seed-data';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { downloadImageAction, downloadAllImagesAsZipAction, getImageAsBase64Action } from './actions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FacebookIcon from '@/components/icons/facebook-logo';
import InstagramIcon from '@/components/icons/instagram-logo';
import YoutubeIcon from '@/components/icons/youtube-logo';
import XIcon from '@/components/icons/x-logo';
import TikTokIcon from '@/components/icons/tiktok-logo';
import '../globals.css';

const socialIconsMap: { [key: string]: React.ElementType } = {
    Facebook: FacebookIcon,
    YouTube: YoutubeIcon,
    Instagram: InstagramIcon,
    X: XIcon,
    TikTok: TikTokIcon,
};


// SECTION: Branding
const brandingFormSchema = z.object({
  logoUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
});

const BrandingForm = () => {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);

    const brandingDocRef = React.useMemo(() => firestore ? doc(firestore, 'branding', 'main') : null, [firestore]);
    const { data: brandingContent, isLoading } = useDoc<Branding>(brandingDocRef);

    const form = useForm<z.infer<typeof brandingFormSchema>>({
        resolver: zodResolver(brandingFormSchema),
        values: {
            logoUrl: brandingContent?.logoUrl || '',
        }
    });

    const handleRemoveImage = async () => {
        const imageUrl = form.getValues('logoUrl');
        if (!imageUrl || !storage) {
            form.setValue('logoUrl', '');
            return;
        }

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({ title: "Imagen eliminada" });
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("No se pudo eliminar la imagen del almacenamiento.", error);
                toast({ variant: "destructive", title: "Error al eliminar imagen", description: "No se pudo eliminar la imagen del almacenamiento." });
            }
        } finally {
            form.setValue('logoUrl', '');
            // Also update in Firestore
            if (firestore) {
                await updateBranding(firestore, { logoUrl: '' });
            }
        }
    };
    
    const handleDownload = async () => {
        const url = form.getValues('logoUrl');
        if (!url) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay logo para descargar.' });
            return;
        }
        setIsDownloading(true);
        const formData = new FormData();
        formData.append('url', url);

        try {
            const result = await downloadImageAction(formData);
            
            if (result.success && result.fileData) {
                const { base64, contentType, filename } = result.fileData;
                const link = document.createElement('a');
                link.href = `data:${contentType};base64,${base64}`;
                link.download = `logo_ateaco_${filename}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                 throw new Error(result.error || 'Error desconocido al procesar la descarga.');
            }
        } catch (error) {
            console.error("Error al descargar la imagen:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo iniciar la descarga.";
            toast({ variant: 'destructive', title: 'Error de descarga', description: errorMessage });
        } finally {
            setIsDownloading(false);
        }
    };

    async function onSubmit(values: z.infer<typeof brandingFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;
        
        try {
            await updateBranding(firestore, values);
            toast({ title: "¡Éxito!", description: "La imagen del logo ha sido actualizada." });
        } catch (error) {
            console.error("Error updating branding:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el logo.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                  <CardTitle>Marca</CardTitle>
                  <CardDescription>Gestiona el logo principal de la web.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-10 w-24" />
                </CardContent>
            </Card>
        )
    }
    
    const hasLogo = !!form.watch('logoUrl');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Marca</CardTitle>
                <CardDescription>Gestiona el logo principal de la web. Sube un archivo SVG o PNG.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logo</FormLabel>
                                    <FormControl>
                                        <ImageUploader
                                            value={field.value}
                                            onUploadSuccess={(urls) => field.onChange(urls[0])}
                                            onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                            folder="branding"
                                            multiple={false}
                                            onRemovePreview={handleRemoveImage}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        El logo aparecerá en la cabecera y pie de página. Si no se sube ninguno, se usará el logo por defecto.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Logo
                            </Button>
                            <Button type="button" variant="outline" onClick={handleDownload} disabled={isDownloading || !hasLogo}>
                                {isDownloading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Descargar Logo
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};


// SECTION: Related Websites
const relatedWebsiteFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  url: z.string().refine((val) => val === '' || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(val), {
    message: "Debe ser una URL válida.",
  }),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
});


const WebsiteForm = ({ website, onFinished }: { website?: RelatedWebsite, onFinished: () => void }) => {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<z.infer<typeof relatedWebsiteFormSchema>>({
        resolver: zodResolver(relatedWebsiteFormSchema),
        defaultValues: {
            name: website?.name || "",
            url: website?.url || "",
            description: website?.description || "",
            imageUrl: website?.imageUrl || "",
        },
    });

    const handleRemoveImage = async () => {
        const imageUrl = form.getValues('imageUrl');
        if (!imageUrl || !storage) {
            form.setValue('imageUrl', '');
            return;
        }

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({ title: "Imagen eliminada" });
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("No se pudo eliminar la imagen del almacenamiento.", error);
                toast({ variant: "destructive", title: "Error al eliminar imagen", description: "No se pudo eliminar la imagen del almacenamiento." });
            }
        } finally {
            form.setValue('imageUrl', '');
        }
    };


    async function onSubmit(values: z.infer<typeof relatedWebsiteFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;
        
        let fullUrl = values.url;
        if (fullUrl && !/^https?:\/\//i.test(fullUrl)) {
            fullUrl = `https://${fullUrl}`;
        }
        
        const dataToSave: RelatedWebsiteDoc = {
          name: values.name,
          url: fullUrl,
          description: values.description,
          imageUrl: values.imageUrl || '',
        };

        try {
            if (website?.id) {
                await updateRelatedWebsite(firestore, website.id, dataToSave);
                toast({ title: "¡Éxito!", description: "Sitio web actualizado correctamente." });
            } else {
                await addRelatedWebsite(firestore, dataToSave);
                toast({ title: "¡Éxito!", description: "Nuevo sitio web añadido." });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving website:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el sitio web.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre del sitio</FormLabel>
                        <FormControl><Input placeholder="Ej: FEGATEA" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="url" render={({ field }) => (
                    <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl><Input placeholder="www.ejemplo.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea placeholder="Breve descripción del sitio web." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagen</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value}
                                    onUploadSuccess={(urls) => field.onChange(urls[0])}
                                    onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                    folder="related-websites"
                                    multiple={false}
                                    onRemovePreview={handleRemoveImage}
                                />
                            </FormControl>
                            <FormDescription>
                                Sube una imagen para la web relacionada.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const RelatedWebsitesForm = () => {
    const firestore = useFirestore();
    const websitesCollection = React.useMemo(() => firestore ? collection(firestore, 'related-web') : null, [firestore]);
    const { data: websites, isLoading, error } = useCollection<RelatedWebsite>(websitesCollection);
    const [editWebsite, setEditWebsite] = React.useState<RelatedWebsite | undefined>(undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const { toast } = useToast();

    const handleEditClick = (website: RelatedWebsite) => {
        setEditWebsite(website);
        setIsEditDialogOpen(true);
    }

    const handleDelete = async (websiteId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'related-web', websiteId));
            toast({ title: 'Sitio eliminado', description: 'El sitio web ha sido eliminado correctamente.' });
        } catch (error) {
            console.error('Error deleting document: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el sitio web.' });
        }
    };

    const handleFormFinished = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditWebsite(undefined);
    }
    
    const handleDownloadPdf = async () => {
        if (!websites || websites.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos', description: 'No hay webs para exportar.' });
            return;
        }
        setIsGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const { default: autoTable } = await import('jspdf-autotable');
            
            doc.setFontSize(18);
            doc.text("Listado de Webs Relacionadas", 14, 22);
            
            const tableData = websites.map(site => [site.name, site.description, site.url]);
            
            autoTable(doc, {
                head: [['Nombre', 'Descripción', 'URL']],
                body: tableData,
                startY: 30,
            });

            doc.save("webs_relacionadas_ateaco.pdf");
            toast({ title: '¡PDF generado!', description: 'La descarga ha comenzado.' });

        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos. Por favor, revisa la consola.</p></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Webs Relacionadas</CardTitle>
                <CardDescription>Añadir, editar o eliminar sitios web de la sección de relacionados.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isLoading || !websites || websites.length === 0}>
                        {isGeneratingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Webs (PDF)
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Web
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <PlusCircle className="h-5 w-5 text-primary" />
                                  Añadir Nueva Web
                                </DialogTitle>
                                <DialogDescription>Completa los detalles del nuevo sitio web a enlazar.</DialogDescription>
                            </DialogHeader>
                            <WebsiteForm onFinished={handleFormFinished} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                           Array.from({ length: 3 }).map((_, index) => (
                             <TableRow key={index}>
                               <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                               <TableCell className="text-right space-x-2">
                                 <Skeleton className="h-8 w-16 inline-block" />
                                 <Skeleton className="h-8 w-8 inline-block" />
                               </TableCell>
                             </TableRow>
                           ))
                        ) : websites && websites.map((site) => (
                            <TableRow key={site.id}>
                                <TableCell>
                                    <Avatar className="rounded-md">
                                        <AvatarImage src={site.imageUrl} alt={site.name} />
                                        <AvatarFallback className="rounded-md bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{site.name}</TableCell>
                                <TableCell><a href={site.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{site.url}</a></TableCell>
                                <TableCell className="text-right space-x-2">
                                     <Dialog open={isEditDialogOpen && editWebsite?.id === site.id} onOpenChange={(isOpen) => { if (!isOpen) setEditWebsite(undefined); setIsEditDialogOpen(isOpen); }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(site)}>Editar</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                  <Pencil className="h-5 w-5 text-primary" />
                                                  Editar Sitio Web
                                                </DialogTitle>
                                                <DialogDescription>Modifica los detalles del sitio web.</DialogDescription>
                                            </DialogHeader>
                                            <WebsiteForm website={editWebsite} onFinished={handleFormFinished} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el sitio web de tus datos.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(site.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {!isLoading && websites?.length === 0 && (
                    <p className="text-center text-muted-foreground mt-4">No hay sitios web relacionados todavía.</p>
                )}
            </CardContent>
        </Card>
    )
}

// SECTION: Home Page
const homePageFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  paragraph: z.string().min(20, "El párrafo debe tener al menos 20 caracteres."),
});

const HomePageForm = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const homeDocRef = React.useMemo(() => firestore ? doc(firestore, 'pages', 'home') : null, [firestore]);
    const { data: homeContent, isLoading } = useDoc<HomePageContent>(homeDocRef);

    const form = useForm<z.infer<typeof homePageFormSchema>>({
        resolver: zodResolver(homePageFormSchema),
        values: {
            title: homeContent?.title || '',
            paragraph: homeContent?.paragraph || '',
        }
    });

    async function onSubmit(values: z.infer<typeof homePageFormSchema>) {
        if (!firestore) return;
        try {
            await updateHomePageContent(firestore, values);
            toast({ title: "¡Éxito!", description: "El contenido de la página de inicio ha sido actualizado." });
        } catch (error) {
            console.error("Error updating home page content:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el contenido.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        }
    }
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                  <CardTitle>Contenido de Inicio</CardTitle>
                  <CardDescription>Edita el título principal y el texto de bienvenida de la página de inicio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-24" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contenido de Inicio</CardTitle>
                <CardDescription>Edita el título principal y el texto de bienvenida de la página de inicio.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título Principal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Bienvenidos a Ateaco" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="paragraph"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Texto de bienvenida</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ateaco nació en A Coruña..."
                                            className="min-h-[200px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

// SECTION: Cast
const castMemberFormSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    roles: z.array(z.string().min(1, "El rol no puede estar vacío")).min(1, "Debe haber al menos un rol."),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
    imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
    
    hasFacebook: z.boolean().default(false),
    facebookUrl: z.string().url("URL de Facebook no válida").optional().or(z.literal('')),
    hasInstagram: z.boolean().default(false),
    instagramUrl: z.string().url("URL de Instagram no válida").optional().or(z.literal('')),
    hasYoutube: z.boolean().default(false),
    youtubeUrl: z.string().url("URL de YouTube no válida").optional().or(z.literal('')),
    hasX: z.boolean().default(false),
    xUrl: z.string().url("URL de X no válida").optional().or(z.literal('')),
    hasTiktok: z.boolean().default(false),
    tiktokUrl: z.string().url("URL de TikTok no válida").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    const socialPlatforms = ['Facebook', 'Instagram', 'Youtube', 'X', 'Tiktok'];
    socialPlatforms.forEach(platform => {
        const hasUrlKey = `has${platform}` as keyof typeof data;
        const urlKey = `${platform.toLowerCase()}Url` as keyof typeof data;
        if (data[hasUrlKey] && !data[urlKey]) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `La URL de ${platform} es requerida si está activada.`,
                path: [urlKey],
            });
        }
    });
});


const CastForm = ({ member, onFinished }: { member?: CastMember, onFinished: () => void }) => {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [currentRole, setCurrentRole] = React.useState('');

    const form = useForm<z.infer<typeof castMemberFormSchema>>({
        resolver: zodResolver(castMemberFormSchema),
        defaultValues: member ? {
            ...member,
            roles: member.roles || [],
            imageUrl: member.imageUrl || '',
            hasFacebook: !!member.facebookUrl,
            hasInstagram: !!member.instagramUrl,
            hasYoutube: !!member.youtubeUrl,
            hasX: !!member.xUrl,
            hasTiktok: !!member.tiktokUrl,
        } : {
            name: "",
            roles: [],
            description: "",
            imageUrl: "",
            hasFacebook: false,
            facebookUrl: '',
            hasInstagram: false,
            instagramUrl: '',
            hasYoutube: false,
            youtubeUrl: '',
            hasX: false,
            xUrl: '',
            hasTiktok: false,
            tiktokUrl: '',
        },
    });

    React.useEffect(() => {
        if(member) {
            form.reset({
                name: member.name,
                roles: member.roles || [],
                description: member.description,
                imageUrl: member.imageUrl || '',
                hasFacebook: !!member.facebookUrl,
                facebookUrl: member.facebookUrl || '',
                hasInstagram: !!member.instagramUrl,
                instagramUrl: member.instagramUrl || '',
                hasYoutube: !!member.youtubeUrl,
                youtubeUrl: member.youtubeUrl || '',
                hasX: !!member.xUrl,
                xUrl: member.xUrl || '',
                hasTiktok: !!member.tiktokUrl,
                tiktokUrl: member.tiktokUrl || '',
            })
        }
    }, [member, form])

    const handleAddRole = () => {
        if (currentRole.trim() !== '') {
            const currentRoles = form.getValues('roles');
            if (!currentRoles.includes(currentRole.trim())) {
                form.setValue('roles', [...currentRoles, currentRole.trim()]);
                setCurrentRole('');
            }
        }
    };

    const handleRemoveRole = (roleToRemove: string) => {
        const currentRoles = form.getValues('roles');
        form.setValue('roles', currentRoles.filter(role => role !== roleToRemove));
    };


    const handleRemoveImage = async () => {
        const imageUrl = form.getValues('imageUrl');
        if (!imageUrl || !storage) {
            form.setValue('imageUrl', '');
            return;
        }

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({ title: "Imagen eliminada" });
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("No se pudo eliminar la imagen.", error);
                toast({ variant: "destructive", title: "Error al eliminar imagen", description: "No se pudo eliminar la imagen del almacenamiento." });
            }
        } finally {
            form.setValue('imageUrl', '');
        }
    };

    async function onSubmit(values: z.infer<typeof castMemberFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;
        
        const dataToSave: CastMemberDoc = {
            name: values.name,
            roles: values.roles || [],
            description: values.description,
            imageUrl: values.imageUrl || '',
            facebookUrl: values.hasFacebook ? values.facebookUrl : '',
            instagramUrl: values.hasInstagram ? values.instagramUrl : '',
            youtubeUrl: values.hasYoutube ? values.youtubeUrl : '',
            xUrl: values.hasX ? values.xUrl : '',
            tiktokUrl: values.hasTiktok ? values.tiktokUrl : '',
        };

        try {
            if (member?.id) {
                await updateCastMember(firestore, member.id, dataToSave);
                toast({ title: "¡Éxito!", description: "Miembro del elenco actualizado." });
            } else {
                await addCastMember(firestore, dataToSave);
                toast({ title: "¡Éxito!", description: "Nuevo miembro añadido al elenco." });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving cast member:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el miembro del elenco.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const { watch } = form;
    const watchSocialToggles = watch(['hasFacebook', 'hasInstagram', 'hasYoutube', 'hasX', 'hasTiktok']);
    const socialPlatforms = [
        { name: 'Facebook', formKey: 'facebookUrl', toggleKey: 'hasFacebook', icon: FacebookIcon, show: watchSocialToggles[0] },
        { name: 'Instagram', formKey: 'instagramUrl', toggleKey: 'hasInstagram', icon: InstagramIcon, show: watchSocialToggles[1] },
        { name: 'YouTube', formKey: 'youtubeUrl', toggleKey: 'hasYoutube', icon: YoutubeIcon, show: watchSocialToggles[2] },
        { name: 'X', formKey: 'xUrl', toggleKey: 'hasX', icon: XIcon, show: watchSocialToggles[3] },
        { name: 'TikTok', formKey: 'tiktokUrl', toggleKey: 'hasTiktok', icon: TikTokIcon, show: watchSocialToggles[4] },
    ] as const;


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <FormField
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Roles</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Actor, Director..."
                                    value={currentRole}
                                    onChange={(e) => setCurrentRole(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddRole();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddRole}>Añadir Rol</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {field.value.map((role, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                                        {role}
                                        <button type="button" onClick={() => handleRemoveRole(role)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl><Textarea className="min-h-24 max-h-48" placeholder="Breve descripción de la persona." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <Card>
                    <CardHeader>
                        <CardTitle>Redes Sociales</CardTitle>
                        <CardDescription>Añade los perfiles sociales del miembro del elenco.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {socialPlatforms.map(social => (
                            <div key={social.name}>
                                <FormField
                                    control={form.control}
                                    name={social.toggleKey}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel className="flex items-center gap-2"><social.icon className="h-5 w-5" />{social.name}</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                {social.show && (
                                    <div className="mt-2 pl-2">
                                        <FormField
                                            control={form.control}
                                            name={social.formKey}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder={`URL de ${social.name}`} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Foto</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value}
                                    onUploadSuccess={(urls) => field.onChange(urls[0])}
                                    onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                    folder="cast"
                                    multiple={false}
                                    onRemovePreview={handleRemoveImage}
                                />
                            </FormControl>
                            <FormDescription>
                                Sube una foto para el miembro del elenco.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const CastManagementForm = () => {
    const firestore = useFirestore();
    const castCollection = React.useMemo(() => firestore ? collection(firestore, 'cast') : null, [firestore]);
    const { data: cast, isLoading, error } = useCollection<CastMember>(castCollection);
    const [editingMember, setEditingMember] = React.useState<CastMember | undefined>(undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const { toast } = useToast();

    const handleEditClick = (member: CastMember) => {
        setEditingMember(member);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (memberId: string) => {
        if (!firestore) return;
        try {
            await deleteCastMember(firestore, memberId);
            toast({ title: 'Miembro eliminado', description: 'El miembro ha sido eliminado del elenco.' });
        } catch (error) {
            console.error('Error deleting member: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el miembro del elenco.' });
        }
    };

    const handleFormFinished = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingMember(undefined);
    };

     const getImageData = async (url: string): Promise<string | null> => {
        if (!url) return null;
        try {
            const formData = new FormData();
            formData.append('url', url);
            const result = await getImageAsBase64Action(formData);
            if (result.success && result.dataUrl) {
                return result.dataUrl;
            }
            throw new Error(result.error || 'Failed to get image data');
        } catch (error) {
            console.error("Error fetching image for PDF:", error);
            const errorMessage = error instanceof Error ? error.message : `No se pudo cargar la imagen: ${url}`;
            toast({ variant: 'destructive', title: 'Error de imagen', description: errorMessage });
            return null;
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!cast || cast.length === 0) {
            toast({ variant: "destructive", title: "No hay elenco", description: "No hay miembros en el elenco para exportar." });
            return;
        }
        setIsGeneratingPdf(true);
        
        try {
            const doc = new jsPDF('p', 'pt', 'a4');
            const { default: autoTable } = await import('jspdf-autotable');

            const docWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            let currentY = margin;

            doc.setFontSize(22).setFont('helvetica', 'bold');
            doc.text("Perfiles del Elenco de Ateaco", docWidth / 2, currentY, { align: 'center' });
            currentY += 20;
            doc.setFontSize(10).setFont('helvetica', 'normal');
            doc.text(`Total de miembros: ${cast.length}`, docWidth / 2, currentY, { align: 'center' });
            currentY += 30;

            for (const [index, member] of cast.entries()) {
                 const pageHeight = doc.internal.pageSize.getHeight();
                // Estimate needed space
                const textHeight = doc.getTextDimensions(member.description, { maxWidth: docWidth - margin * 2 - 120 }).h;
                const estimatedHeight = 120 + textHeight + 60; // Image + text + padding

                if (currentY + estimatedHeight > pageHeight - margin) {
                    doc.addPage();
                    currentY = margin;
                }
                
                const initialY = currentY;
                let imageBottom = currentY;

                if (member.imageUrl) {
                    try {
                        const imageData = await getImageData(member.imageUrl);
                        if (imageData) {
                            const imgProps = doc.getImageProperties(imageData);
                            const imgWidth = 100;
                            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                            doc.addImage(imageData, 'JPEG', margin, currentY, imgWidth, imgHeight);
                            imageBottom = currentY + imgHeight;
                        }
                    } catch (e) { /* Error logged in getImageData */ }
                }

                const textX = margin + 120;
                doc.setFontSize(16).setFont('helvetica', 'bold');
                doc.text(member.name, textX, currentY + 15);
                
                doc.setFontSize(10).setFont('helvetica', 'bold');
                doc.text('Roles:', textX, currentY + 30);
                doc.setFont('helvetica', 'normal');
                doc.text(member.roles.join(', '), textX + doc.getTextWidth('Roles:') + 5, currentY + 30);

                doc.setFontSize(10).setFont('helvetica', 'bold');
                doc.text('Descripción:', textX, currentY + 45);
                doc.setFont('helvetica', 'normal');
                const splitDescription = doc.splitTextToSize(member.description, docWidth - textX - margin);
                doc.text(splitDescription, textX, currentY + 57);

                const textBottom = currentY + 57 + (splitDescription.length * 12);
                currentY = Math.max(imageBottom, textBottom) + 20;

                if (index < cast.length - 1) {
                    doc.setDrawColor(220, 220, 220).setLineWidth(1).line(margin, currentY, docWidth - margin, currentY);
                    currentY += 20;
                }
            }

            doc.save("perfiles_elenco_ateaco.pdf");
            toast({ title: '¡PDF generado!', description: 'La descarga de los perfiles ha comenzado.' });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos. Por favor, revisa la consola.</p></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Elenco</CardTitle>
                <CardDescription>Añadir, editar o eliminar miembros del elenco de la compañía.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                     <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isLoading || !cast || cast.length === 0}>
                        {isGeneratingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Elenco (PDF)
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingMember(undefined)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Miembro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <ScrollArea className="max-h-[90vh] p-6">
                                <DialogHeader className="pb-4">
                                    <DialogTitle className="flex items-center gap-2">
                                        <PlusCircle className="h-5 w-5 text-primary" />
                                        Añadir Nuevo Miembro
                                    </DialogTitle>
                                    <DialogDescription>
                                        Completa los detalles de la nueva persona.
                                    </DialogDescription>
                                </DialogHeader>
                               <CastForm onFinished={handleFormFinished} />
                           </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Skeleton className="h-8 w-16 inline-block" />
                                        <Skeleton className="h-8 w-8 inline-block" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : cast && cast.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={member.imageUrl} alt={member.name} />
                                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.roles.join(', ')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog open={isEditDialogOpen && editingMember?.id === member.id} onOpenChange={(isOpen) => { if (!isOpen) setEditingMember(undefined); setIsEditDialogOpen(isOpen); }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(member)}>Editar</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                             <ScrollArea className="max-h-[90vh] p-6">
                                                <DialogHeader className="pb-4">
                                                    <DialogTitle className="flex items-center gap-2">
                                                        <Pencil className="h-5 w-5 text-primary" />
                                                        Editar Miembro del Elenco
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Modifica los detalles de esta persona.
                                                    </DialogDescription>
                                                </DialogHeader>
                                               <CastForm member={editingMember} onFinished={handleFormFinished} />
                                           </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente a la persona del elenco.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(member.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!isLoading && cast?.length === 0 && (
                    <p className="text-center text-muted-foreground mt-4">No hay miembros en el elenco todavía.</p>
                )}
            </CardContent>
        </Card>
    );
};

// SECTION: Plays
const genres = [
  "Comedia", "Drama", "Tragedia", "Tragicomedia", "Musical",
  "Teatro infantil / familiar", "Monólogo", "Comedia negra",
  "Teatro social", "Alternativo", "Clásico", "Otros"
];

const performanceSchema = z.object({
    date: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
});

const playFormSchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres."),
    genre: z.string({ required_error: "Por favor, selecciona un género." }),
    duration: z.string().min(1, "La duración es requerida."),
    author: z.string().min(2, "El autor es requerido."),
    director: z.string().min(2, "El director es requerido."),
    synopsis: z.string().min(10, "La sinopsis debe tener al menos 10 caracteres."),
    actors: z.array(z.string()).min(1, "Debes seleccionar al menos un actor."),
    posterUrl: z.string().url("Debes subir un cartel.").min(1, "Debes subir un cartel."),

    hasPremiere: z.boolean().default(false),
    premiereDate: performanceSchema.optional(),

    performanceDates: z.array(performanceSchema.partial()).optional(),

    onShow: z.boolean().default(false),
    nextShow: performanceSchema.optional(),
    ticketUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    if (data.hasPremiere) {
        if (!data.premiereDate?.date) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha es requerida.", path: ["premiereDate.date"] });
        }
        if (!data.premiereDate?.location) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El lugar es requerido.", path: ["premiereDate.location"] });
        }
        if (!data.premiereDate?.city) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La población es requerida.", path: ["premiereDate.city"] });
        }
        if (!data.premiereDate?.province) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La provincia es requerida.", path: ["premiereDate.province"] });
        }
    }
    if (data.onShow) {
        if (!data.nextShow?.date) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha es requerida.", path: ["nextShow.date"] });
        }
         if (!data.nextShow?.location) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El lugar es requerido.", path: ["nextShow.location"] });
        }
        if (!data.nextShow?.city) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La población es requerida.", path: ["nextShow.city"] });
        }
        if (!data.nextShow?.province) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La provincia es requerida.", path: ["nextShow.province"] });
        }
        if (!data.ticketUrl || data.ticketUrl.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La URL de entradas es requerida.", path: ["ticketUrl"] });
        }
    }
});


const PlayForm = ({ play, onFinished }: { play?: Play, onFinished: () => void }) => {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [newPerformance, setNewPerformance] = React.useState({ date: '', location: '', city: '', province: '' });
    const [newPerformanceError, setNewPerformanceError] = React.useState('');

    const castCollection = React.useMemo(() => firestore ? collection(firestore, 'cast') : null, [firestore]);
    const { data: allCast } = useCollection<CastMember>(castCollection);

    const form = useForm<z.infer<typeof playFormSchema>>({
        resolver: zodResolver(playFormSchema),
        defaultValues: play ? {
            ...play,
            actors: play.actors || [],
            performanceDates: play.performanceDates || [],
            hasPremiere: !!play.premiereDate?.date,
            premiereDate: play.premiereDate || { date: '', location: '', city: '', province: '' },
            nextShow: play.nextShow || { date: '', location: '', city: '', province: '' },
            posterUrl: play.posterUrl || ''
        } : {
            title: "",
            genre: undefined,
            duration: "",
            author: "",
            director: "",
            synopsis: "",
            actors: [],
            posterUrl: "",
            hasPremiere: false,
            premiereDate: { date: '', location: '', city: '', province: '' },
            performanceDates: [],
            onShow: false,
            nextShow: { date: '', location: '', city: '', province: '' },
            ticketUrl: "",
        },
    });
    
    const { reset } = form;
    React.useEffect(() => {
        if (play) {
            reset({
                ...play,
                actors: play.actors || [],
                performanceDates: play.performanceDates || [],
                hasPremiere: !!play.premiereDate?.date,
                premiereDate: play.premiereDate || { date: '', location: '', city: '', province: '' },
                nextShow: play.nextShow || { date: '', location: '', city: '', province: '' },
                posterUrl: play.posterUrl || ''
            });
        }
    }, [play, reset]);
    

    const handleRemoveImage = async () => {
        const imageUrl = form.getValues('posterUrl');
        if (!imageUrl || !storage) {
            form.setValue('posterUrl', '');
            return;
        }
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({ title: "Cartel eliminado" });
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                toast({ variant: "destructive", title: "Error al eliminar cartel" });
            }
        } finally {
            form.setValue('posterUrl', '');
        }
    };
    
    async function onSubmit(values: z.infer<typeof playFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;

        const dataToSave: Partial<PlayDoc> = { ...values };

        if (!values.hasPremiere) {
            dataToSave.premiereDate = { date: '', location: '', city: '', province: '' };
        }

        if (!values.onShow) {
            dataToSave.nextShow = { date: '', location: '', city: '', province: '' };
            dataToSave.ticketUrl = '';
        } else {
            if (dataToSave.ticketUrl && !/^https?:\/\//i.test(dataToSave.ticketUrl)) {
                dataToSave.ticketUrl = `https://${dataToSave.ticketUrl}`;
            }
        }
        
        try {
            if (play?.id) {
                await updatePlay(firestore, play.id, dataToSave);
                toast({ title: "¡Éxito!", description: "Obra actualizada correctamente." });
            } else {
                await addPlay(firestore, dataToSave as PlayDoc);
                toast({ title: "¡Éxito!", description: "Nueva obra añadida." });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving play:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la obra.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const onShowValue = form.watch('onShow');
    const hasPremiereValue = form.watch('hasPremiere');
    const performanceDates = form.watch('performanceDates') || [];

    const addPerformanceDate = () => {
        const { date, location, city, province } = newPerformance;
        if (!date || !location || !city || !province) {
            setNewPerformanceError("Por favor, completa todos los campos de la representación.");
            return;
        }

        const currentDates = form.getValues('performanceDates') || [];
        form.setValue('performanceDates', [...currentDates, { ...newPerformance }].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()));
        setNewPerformance({ date: '', location: '', city: '', province: '' });
        setNewPerformanceError('');
    };

    const selectedActors = form.watch('actors') || [];
    const availableCast = React.useMemo(() => {
        if (!allCast) return [];
        return allCast.filter(c => !selectedActors.includes(c.name));
    }, [selectedActors, allCast]);
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <ScrollArea className="h-[65vh] pr-6">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="genre" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Género</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un género" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="duration" render={({ field }) => (
                                        <FormItem><FormLabel>Duración (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="author" render={({ field }) => (
                                        <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="director" render={({ field }) => (
                                        <FormItem><FormLabel>Director</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="synopsis" render={({ field }) => (
                                    <FormItem><FormLabel>Sinopsis</FormLabel><FormControl><Textarea className="min-h-24 max-h-40" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="actors" render={() => (
                                    <FormItem>
                                        <FormLabel>Actores</FormLabel>
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2 min-h-8 rounded-md border p-2 bg-background">
                                                {selectedActors.length > 0 ? selectedActors.map((actorName) => (
                                                    <Badge key={actorName} variant="secondary" className="flex items-center gap-2 p-1 pr-2">
                                                        <span className="text-sm">{actorName}</span>
                                                        <button type="button" className="rounded-full hover:bg-muted-foreground/20 p-0.5" onClick={() => form.setValue('actors', selectedActors.filter(name => name !== actorName))}><X className="h-3 w-3" /></button>
                                                    </Badge>
                                                )) : <span className="text-sm text-muted-foreground px-1">Ningún actor seleccionado</span>}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Actores disponibles:</p>
                                                <ScrollArea className="h-40 w-full rounded-md border bg-background">
                                                    <div className="p-2 space-y-1">
                                                        {availableCast?.length > 0 ? availableCast.map(actor => (
                                                            <Button key={actor.id} type="button" variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => form.setValue('actors', [...selectedActors, actor.name])}>
                                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                                                {actor.name}
                                                            </Button>
                                                        )) : <p className="text-xs text-muted-foreground p-2">No hay más actores disponibles.</p>}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Fecha de estreno</CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="hasPremiere-switch">{hasPremiereValue ? 'Activado' : 'Desactivado'}</Label>
                                        <Switch
                                            id="hasPremiere-switch"
                                            checked={hasPremiereValue}
                                            onCheckedChange={(checked) => form.setValue('hasPremiere', checked)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            {hasPremiereValue && (
                                <CardContent className="space-y-4 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="premiereDate.date" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="premiereDate.location" render={({ field }) => (<FormItem><FormLabel>Lugar</FormLabel><FormControl><Input placeholder="Ej: Teatro Colón" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="premiereDate.city" render={({ field }) => (<FormItem><FormLabel>Población</FormLabel><FormControl><Input placeholder="Ej: A Coruña" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="premiereDate.province" render={({ field }) => (<FormItem><FormLabel>Provincia</FormLabel><FormControl><Input placeholder="Ej: A Coruña" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Fechas de representaciones</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="flex flex-col space-y-1"><Label className="text-xs text-muted-foreground">Fecha</Label><Input type="date" value={newPerformance.date} onChange={e => setNewPerformance({...newPerformance, date: e.target.value})} /></div>
                                    <div className="flex flex-col space-y-1"><Label className="text-xs text-muted-foreground">Lugar</Label><Input placeholder="Ej: Pazo da Cultura" value={newPerformance.location} onChange={e => setNewPerformance({...newPerformance, location: e.target.value})} /></div>
                                    <div className="flex flex-col space-y-1"><Label className="text-xs text-muted-foreground">Población</Label><Input placeholder="Ej: Narón" value={newPerformance.city} onChange={e => setNewPerformance({...newPerformance, city: e.target.value})} /></div>
                                    <div className="flex flex-col space-y-1"><Label className="text-xs text-muted-foreground">Provincia</Label><Input placeholder="Ej: A Coruña" value={newPerformance.province} onChange={e => setNewPerformance({...newPerformance, province: e.target.value})} /></div>
                                    <div className="md:col-span-2 lg:col-span-3 flex items-end"><Button type="button" onClick={addPerformanceDate} className="w-full">Añadir Fecha</Button></div>
                                </div>
                                {newPerformanceError && <p className="text-sm font-medium text-destructive">{newPerformanceError}</p>}
                                <div className="space-y-2 mt-4">
                                    {performanceDates.map((perf, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center justify-between p-2 h-auto text-left whitespace-normal">
                                            <span className="text-sm font-normal">{format(new Date(perf.date!), "dd/MM/yyyy")} - {perf.location}, {perf.city}</span>
                                            <button type="button" className="rounded-full hover:bg-muted-foreground/20 p-0.5 ml-2" onClick={() => form.setValue('performanceDates', performanceDates.filter((_, i) => i !== index))}><X className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                </div>
                                <FormMessage>{form.formState.errors.performanceDates?.message}</FormMessage>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>En cartelera</CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor="onShow-switch">{onShowValue ? 'Activado' : 'Desactivado'}</Label>
                                        <Switch id="onShow-switch" checked={onShowValue} onCheckedChange={(checked) => form.setValue('onShow', checked)} />
                                    </div>
                                </div>
                            </CardHeader>
                            {onShowValue && (
                                <CardContent className="space-y-4 pt-0">
                                    <div className="border p-4 rounded-lg space-y-4 bg-background/60">
                                        <p className="font-medium text-sm">Próxima representación</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <FormField control={form.control} name="nextShow.date" render={({ field }) => (<FormItem><FormLabel className="text-xs">Fecha</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="nextShow.location" render={({ field }) => (<FormItem><FormLabel className="text-xs">Lugar</FormLabel><FormControl><Input placeholder="Ej: Teatro Rosalía" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="nextShow.city" render={({ field }) => (<FormItem><FormLabel className="text-xs">Población</FormLabel><FormControl><Input placeholder="Ej: A Coruña" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="nextShow.province" render={({ field }) => (<FormItem><FormLabel className="text-xs">Provincia</FormLabel><FormControl><Input placeholder="Ej: A Coruña" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={form.control} name="ticketUrl" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL de entradas</FormLabel>
                                                <FormControl><Input placeholder='ejemplo.com/entradas' {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Cartel</CardTitle></CardHeader>
                            <CardContent>
                                <FormField control={form.control} name="posterUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <ImageUploader
                                                value={field.value}
                                                multiple={false}
                                                onUploadSuccess={(urls) => field.onChange(urls[0])}
                                                onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                                folder="plays"
                                                onRemovePreview={handleRemoveImage}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t">
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const PlaysManagementForm = () => {
    const firestore = useFirestore();
    const playsCollection = React.useMemo(() => firestore ? collection(firestore, 'plays') : null, [firestore]);
    const { data: plays, isLoading, error } = useCollection<Play>(playsCollection);
    const [editingPlay, setEditingPlay] = React.useState<Play | undefined>(undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const { toast } = useToast();

    const sortedPlays = React.useMemo(() => {
        if (!plays) return [];
        return [...plays].sort((a, b) => {
            const dateA = a.premiereDate?.date ? new Date(a.premiereDate.date).getTime() : 0;
            const dateB = b.premiereDate?.date ? new Date(b.premiereDate.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [plays]);


    const handleEditClick = (play: Play) => {
        setEditingPlay(play);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (playId: string) => {
        if (!firestore) return;
        try {
            await deletePlay(firestore, playId);
            toast({ title: 'Obra eliminada', description: 'La obra ha sido eliminada correctamente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la obra.' });
        }
    };

    const handleFormFinished = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingPlay(undefined);
    };
    
    const handleSeedPlays = async () => {
        if (!firestore) return;
        setIsSeeding(true);
        try {
            const playsToAdd = seedPlays();
            for (const playData of playsToAdd) {
                await addPlay(firestore, playData);
            }
            toast({
                title: '¡Obras añadidas!',
                description: `${playsToAdd.length} obras de ejemplo han sido añadidas a la base de datos.`,
            });
        } catch (error) {
            console.error("Error seeding plays:", error);
            toast({
                variant: 'destructive',
                title: 'Error al añadir datos',
                description: 'No se pudieron añadir las obras de ejemplo.',
            });
        } finally {
            setIsSeeding(false);
        }
    };

    const getImageData = async (url: string): Promise<string | null> => {
        if (!url) return null;
        try {
            const formData = new FormData();
            formData.append('url', url);
            const result = await getImageAsBase64Action(formData);
            if (result.success && result.dataUrl) {
                return result.dataUrl;
            }
            throw new Error(result.error || 'Failed to get image data');
        } catch (error) {
            console.error("Error fetching image for PDF:", error);
            const errorMessage = error instanceof Error ? error.message : `No se pudo cargar la imagen: ${url}`;
            toast({ variant: 'destructive', title: 'Error de imagen', description: errorMessage });
            return null;
        }
    };

    const handleDownloadPdf = async () => {
        if (!plays || plays.length === 0) {
            toast({ variant: "destructive", title: "No hay obras", description: "No hay obras para exportar." });
            return;
        }
        setIsGeneratingPdf(true);
        
        try {
            const doc = new jsPDF('p', 'pt', 'a4');
            // We need to dynamically load the autotable plugin
            const { default: autoTable } = await import('jspdf-autotable');

            const docWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            let currentY = margin;

            // Header
            doc.setFontSize(22).setFont('helvetica', 'bold');
            doc.text("Histórico de Obras de Ateaco", docWidth / 2, currentY, { align: 'center' });
            currentY += 20;
            doc.setFontSize(10).setFont('helvetica', 'normal');
            doc.text(`Total de obras: ${plays.length}`, docWidth / 2, currentY, { align: 'center' });
            currentY += 15;
            doc.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, docWidth / 2, currentY, { align: 'center' });
            currentY += 30;

            for (const [index, play] of plays.entries()) {
                if (index > 0 && currentY + 300 > doc.internal.pageSize.getHeight() - margin) { // Check if there's enough space
                    doc.addPage();
                    currentY = margin;
                }

                // Title
                doc.setFontSize(16).setFont('helvetica', 'bold');
                const splitTitle = doc.splitTextToSize(play.title, docWidth - margin * 2);
                doc.text(splitTitle, margin, currentY);
                currentY += splitTitle.length * 16 + 5;
                doc.setDrawColor(200).setLineWidth(0.5).line(margin, currentY - 10, docWidth - margin, currentY - 10);
                
                let imageBottom = currentY;

                // Poster Image
                if (play.posterUrl) {
                    try {
                        const imageData = await getImageData(play.posterUrl);
                        if(imageData) {
                            const imgProps = doc.getImageProperties(imageData);
                            const imgWidth = 120;
                            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                            
                            if (currentY + imgHeight > doc.internal.pageSize.getHeight() - margin) {
                                doc.addPage();
                                currentY = margin;
                            }
                            doc.addImage(imageData, 'JPEG', margin, currentY, imgWidth, imgHeight);
                            imageBottom = currentY + imgHeight;
                        } else {
                             doc.setFontSize(9).setFont('helvetica', 'italic').text('Cartel no disponible', margin, currentY);
                        }
                    } catch(e) {
                         doc.setFontSize(9).setFont('helvetica', 'italic').text('Error al cargar cartel', margin, currentY);
                    }
                } else {
                    doc.setFontSize(9).setFont('helvetica', 'italic').text('Sin cartel', margin, currentY);
                }

                // Details Text
                const textX = margin + 120 + 20;
                let textY = currentY;

                const addDetail = (label: string, value: string | undefined, options: { isSplit?: boolean } = {}) => {
                    if (!value) return;
                    const textWidth = docWidth - textX - margin;
                    doc.setFontSize(10).setFont('helvetica', 'bold');
                    doc.text(`${label}:`, textX, textY);
                    doc.setFont('helvetica', 'normal');
                    if (options.isSplit) {
                        const splitValue = doc.splitTextToSize(value, textWidth);
                        doc.text(splitValue, textX, textY + 12);
                        textY += (splitValue.length + 1) * 12;
                    } else {
                        const valueX = textX + doc.getTextWidth(label) + 5;
                        const splitValue = doc.splitTextToSize(value, docWidth - valueX - margin);
                        doc.text(splitValue, valueX, textY);
                        textY += splitValue.length * 12;
                    }
                };

                addDetail("Autor", play.author);
                addDetail("Director", play.director);
                addDetail("Género", play.genre);
                addDetail("Duración", `${play.duration} min`);
                
                const premiereDate = play.premiereDate && isValidDate(play.premiereDate.date)
                    ? `${format(new Date(play.premiereDate.date), "dd/MM/yyyy", { locale: es })} en ${play.premiereDate.location}, ${play.premiereDate.city}`
                    : 'N/A';
                addDetail("Estreno", premiereDate);

                const numPerformances = (play.performanceDates?.length || 0) + (play.premiereDate ? 1 : 0);
                addDetail("Nº de representaciones", numPerformances.toString());
                
                textY += 5; // Extra space before synopsis
                addDetail("Sinopsis", play.synopsis, { isSplit: true });

                currentY = Math.max(textY, imageBottom) + 30;

                if (index < plays.length - 1) {
                    doc.setDrawColor(220, 220, 220).setLineWidth(1).line(margin, currentY, docWidth - margin, currentY);
                    currentY += 20;
                }
            }


            doc.save("historico_obras_ateaco.pdf");
            toast({ title: '¡PDF generado!', description: 'La descarga de tu histórico de obras ha comenzado.' });
        } catch(error) {
            console.error("Error generating PDF:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    const isValidDate = (dateString: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos.</p></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Obras</CardTitle>
                <CardDescription>Añadir, editar o eliminar obras del repertorio.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isLoading || !plays || plays.length === 0}>
                        {isGeneratingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Obras (PDF)
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild><Button onClick={() => setEditingPlay(undefined)}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Obra</Button></DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <PlusCircle className="h-5 w-5 text-primary" />
                                Añadir Nueva Obra
                              </DialogTitle>
                              <DialogDescription>
                                Completa la información de la nueva obra.
                              </DialogDescription>
                            </DialogHeader>
                            <PlayForm onFinished={handleFormFinished} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader><TableRow><TableHead className="w-16"></TableHead><TableHead>Título</TableHead><TableHead>Género</TableHead><TableHead>Estreno</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-16 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedPlays && sortedPlays.map((play) => (
                            <TableRow key={play.id} className={cn(play.onShow && 'border-2 border-destructive')}>
                                <TableCell>
                                    <Avatar className="rounded-md">
                                        <AvatarImage src={play.posterUrl} alt={play.title} />
                                        <AvatarFallback className="rounded-md bg-muted"><Theater className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{play.title}</TableCell>
                                <TableCell>{play.genre}</TableCell>
                                <TableCell>{play.premiereDate && isValidDate(play.premiereDate.date) ? format(new Date(play.premiereDate.date), "dd/MM/yyyy") : 'N/A'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog open={isEditDialogOpen && editingPlay?.id === play.id} onOpenChange={(isOpen) => { if (!isOpen) setEditingPlay(undefined); setIsEditDialogOpen(isOpen); }}>
                                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => handleEditClick(play)}>Editar</Button></DialogTrigger>
                                         <DialogContent className="max-w-3xl max-h-[90vh]">
                                            <DialogHeader>
                                              <DialogTitle className="flex items-center gap-2">
                                                <Pencil className="h-5 w-5 text-primary" />
                                                Editar Obra
                                              </DialogTitle>
                                              <DialogDescription>
                                                Modifica los detalles de la obra.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <PlayForm play={editingPlay} onFinished={handleFormFinished} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Eliminará permanentemente la obra.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(play.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!isLoading && plays?.length === 0 && (
                     <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground">No hay obras en la base de datos.</p>
                        <Button onClick={handleSeedPlays} disabled={isSeeding}>
                            {isSeeding ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Añadir 13 obras de ejemplo
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


// SECTION: Posts
const postFormSchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres."),
    author: z.string({ required_error: "Por favor, selecciona un autor." }),
    publishDate: z.string().min(1, "La fecha es requerida."),
    article: z.string().min(10, "El artículo debe tener al menos 10 caracteres."),
    imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
});

const PostForm = ({ post, onFinished }: { post?: Post, onFinished: () => void }) => {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const castCollection = React.useMemo(() => firestore ? collection(firestore, 'cast') : null, [firestore]);
    const { data: allCast, isLoading: isLoadingCast } = useCollection<CastMember>(castCollection);

    const form = useForm<z.infer<typeof postFormSchema>>({
        resolver: zodResolver(postFormSchema),
        defaultValues: {
            title: post?.title || "",
            author: post?.author || "",
            publishDate: post?.publishDate || new Date().toISOString().split('T')[0],
            article: post?.article || "",
            imageUrl: post?.imageUrl || "",
        },
    });

    const handleRemoveImage = async () => {
        const imageUrl = form.getValues('imageUrl');
        if (!imageUrl || !storage) {
            form.setValue('imageUrl', '');
            return;
        }
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({ title: "Imagen eliminada" });
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                toast({ variant: "destructive", title: "Error al eliminar imagen" });
            }
        } finally {
            form.setValue('imageUrl', '');
        }
    };

    async function onSubmit(values: z.infer<typeof postFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;
        
        try {
            if (post?.id) {
                await updatePost(firestore, post.id, values);
                toast({ title: "¡Éxito!", description: "Post actualizado correctamente." });
            } else {
                await addPost(firestore, values);
                toast({ title: "¡Éxito!", description: "Nuevo post añadido." });
            }
            onFinished();
        } catch (error) {
            console.error("Error saving post:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el post.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col">
                 <div className="px-6 py-4 overflow-y-auto flex-grow space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Card className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="author"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Autor</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un autor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {allCast?.map((member) => (
                                                    <SelectItem key={member.id} value={member.name}>
                                                        {member.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control} name="publishDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Publicación</FormLabel>
                                    <FormControl><Input type="date" {...field} className="bg-background" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </Card>
                    <FormField control={form.control} name="article" render={({ field }) => (
                        <FormItem><FormLabel>Artículo</FormLabel><FormControl><Textarea className="min-h-48" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagen</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value}
                                    multiple={false}
                                    onUploadSuccess={(urls) => field.onChange(urls[0])}
                                    onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                    folder="posts"
                                    onRemovePreview={handleRemoveImage}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                <DialogFooter className="p-6 pt-0 border-t mt-4">
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const PostsManagementForm = () => {
    const firestore = useFirestore();
    const postsCollection = React.useMemo(() => firestore ? collection(firestore, 'posts') : null, [firestore]);
    const { data: posts, isLoading, error } = useCollection<Post>(postsCollection);
    const [editingPost, setEditingPost] = React.useState<Post | undefined>(undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const { toast } = useToast();

    const handleEditClick = (post: Post) => {
        setEditingPost(post);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (postId: string) => {
        if (!firestore) return;
        try {
            await deletePost(firestore, postId);
            toast({ title: 'Post eliminado', description: 'El post ha sido eliminado correctamente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el post.' });
        }
    };

    const handleFormFinished = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingPost(undefined);
    };

    const handleSeedPosts = async () => {
        if (!firestore) return;
        setIsSeeding(true);
        try {
            const postsToAdd = seedPosts();
            for (const postData of postsToAdd) {
                await addPost(firestore, postData);
            }
            toast({
                title: '¡Posts añadidos!',
                description: `${postsToAdd.length} posts de ejemplo han sido añadidas a la base de datos.`,
            });
        } catch (error) {
            console.error("Error seeding posts:", error);
            toast({
                variant: 'destructive',
                title: 'Error al añadir datos',
                description: 'No se pudieron añadir los posts de ejemplo.',
            });
        } finally {
            setIsSeeding(false);
        }
    };

    const getImageData = async (url: string): Promise<string | null> => {
        if (!url) return null;
        try {
            const formData = new FormData();
            formData.append('url', url);
            const result = await getImageAsBase64Action(formData);
            if (result.success && result.dataUrl) {
                return result.dataUrl;
            }
            throw new Error(result.error || 'Failed to get image data');
        } catch (error) {
            console.error("Error fetching image for PDF:", error);
            const errorMessage = error instanceof Error ? error.message : `No se pudo cargar la imagen: ${url}`;
            toast({ variant: 'destructive', title: 'Error de imagen', description: errorMessage });
            return null;
        }
    };

    const handleDownloadPdf = async () => {
        if (!posts || posts.length === 0) {
            toast({ variant: "destructive", title: "No hay posts", description: "No hay posts para exportar." });
            return;
        }
        setIsGeneratingPdf(true);
        toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });

        try {
            const doc = new jsPDF('p', 'pt', 'a4');
            const docWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            let currentY = margin;

            for (const [index, post] of posts.entries()) {
                // Check for new page
                if (index > 0) {
                   doc.addPage();
                   currentY = margin;
                }

                // Title
                doc.setFontSize(18).setFont('helvetica', 'bold');
                const splitTitle = doc.splitTextToSize(post.title, docWidth - margin * 2);
                doc.text(splitTitle, docWidth / 2, currentY, { align: 'center' });
                currentY += splitTitle.length * 18 + 10;

                // Author and Date
                doc.setFontSize(10).setFont('helvetica', 'normal');
                const authorAndDate = `Por ${post.author} | ${format(new Date(post.publishDate), "dd 'de' MMMM, yyyy", { locale: es })}`;
                doc.text(authorAndDate, docWidth / 2, currentY, { align: 'center' });
                currentY += 20;

                // Image
                if (post.imageUrl) {
                    try {
                        const imageData = await getImageData(post.imageUrl);
                        if (imageData) {
                            const imgProps = doc.getImageProperties(imageData);
                            const imgWidth = docWidth - margin * 2;
                            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                            if (currentY + imgHeight > doc.internal.pageSize.getHeight() - margin) {
                                doc.addPage();
                                currentY = margin;
                            }
                            doc.addImage(imageData, 'JPEG', margin, currentY, imgWidth, imgHeight);
                            currentY += imgHeight + 20;
                        }
                    } catch (e) {
                         console.error("Error adding image to PDF for post:", post.title, e);
                    }
                }

                // Article
                doc.setFontSize(12).setFont('helvetica', 'normal');
                const splitArticle = doc.splitTextToSize(post.article, docWidth - margin * 2);
                 if (currentY + (splitArticle.length * 12) > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    currentY = margin;
                }
                doc.text(splitArticle, margin, currentY);
            }
            
            doc.save("blog_ateaco.pdf");
            toast({ title: '¡PDF generado!', description: 'La descarga del blog ha comenzado.' });

        } catch (error) {
             console.error("Error generating posts PDF:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF de posts.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    
    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos.</p></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Posts</CardTitle>
                <CardDescription>Añadir, editar o eliminar entradas del blog.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isLoading || !posts || posts.length === 0}>
                        {isGeneratingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Posts (PDF)
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Post</Button></DialogTrigger>
                        <DialogContent className="max-w-3xl p-0 max-h-[80vh] flex flex-col">
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="flex items-center gap-2">
                                    <PlusCircle className="h-5 w-5 text-primary" />
                                    Añadir Nuevo Post
                                </DialogTitle>
                                <DialogDescription>Crea una nueva entrada para el blog.</DialogDescription>
                            </DialogHeader>
                            <PostForm onFinished={handleFormFinished} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Autor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-16 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : posts && posts.map((post) => (
                            <TableRow key={post.id}>
                                 <TableCell>
                                    <Avatar className="rounded-md">
                                        <AvatarImage src={post.imageUrl} alt={post.title} />
                                        <AvatarFallback className="rounded-md bg-muted"><Newspaper className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{post.title}</TableCell>
                                <TableCell>{post.author}</TableCell>
                                <TableCell>{format(new Date(post.publishDate), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog open={isEditDialogOpen && editingPost?.id === post.id} onOpenChange={(isOpen) => { if (!isOpen) setEditingPost(undefined); setIsEditDialogOpen(isOpen); }}>
                                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => handleEditClick(post)}>Editar</Button></DialogTrigger>
                                        <DialogContent className="max-w-3xl p-0 max-h-[80vh] flex flex-col">
                                            <DialogHeader className="p-6 pb-0">
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Pencil className="h-5 w-5 text-primary" />
                                                    Editar Post
                                                </DialogTitle>
                                                <DialogDescription>Modifica los detalles de la entrada del blog.</DialogDescription>
                                            </DialogHeader>
                                            <PostForm post={editingPost} onFinished={handleFormFinished} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Eliminará permanentemente el post.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(post.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!isLoading && posts?.length === 0 && (
                    <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground">No hay posts en la base de datos.</p>
                        <Button onClick={handleSeedPosts} disabled={isSeeding}>
                            {isSeeding ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Añadir 6 posts de ejemplo
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


// SECTION: Social Links
const socialLinkNames = ["Facebook", "YouTube", "Instagram", "X"] as const;
const socialLinkFormSchema = z.object({
    name: z.enum(socialLinkNames, { required_error: "Selecciona una red social." }),
    url: z.string().refine((val) => val === '' || /^(https?:\/\/)?([\w.-@]+)\.([a-z.]{2,6})([\/\w_.-@]*)*\/?$/.test(val), {
        message: "Debe ser una URL válida.",
    }),
});

const SocialLinkForm = ({ socialLink, onFinished }: { socialLink?: SocialLink, onFinished: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<z.infer<typeof socialLinkFormSchema>>({
        resolver: zodResolver(socialLinkFormSchema),
        defaultValues: {
            name: socialLink?.name || undefined,
            url: socialLink?.url || "",
        },
    });
    
    async function onSubmit(values: z.infer<typeof socialLinkFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;

        let fullUrl = values.url;
        if (fullUrl && !/^https?:\/\//i.test(fullUrl)) {
            fullUrl = `https://${fullUrl}`;
        }
        
        const dataToSave = {
            name: values.name,
            url: fullUrl,
        }

        try {
            if (socialLink?.id) {
                await updateSocialLink(firestore, socialLink.id, dataToSave);
                toast({ title: "¡Éxito!", description: "Enlace social actualizado." });
            } else {
                await addSocialLink(firestore, dataToSave);
                toast({ title: "¡Éxito!", description: "Nueva red social añadida." });
            }
            onFinished();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el enlace.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Red Social</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!socialLink}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Selecciona una red social" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {socialLinkNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl><Input placeholder="https://www.facebook.com/ateaco" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};


const SocialLinksManagementForm = () => {
    const firestore = useFirestore();
    const socialLinksCollection = React.useMemo(() => firestore ? collection(firestore, 'social-links') : null, [firestore]);
    const { data: socialLinks, isLoading, error } = useCollection<SocialLink>(socialLinksCollection);
    const [editingLink, setEditingLink] = React.useState<SocialLink | undefined>(undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const { toast } = useToast();

    const socialIcons: { [key in SocialLink['name']]: React.ElementType } = {
        Facebook: FacebookIcon,
        YouTube: YoutubeIcon,
        Instagram: InstagramIcon,
        X: XIcon,
    };

    const handleEditClick = (link: SocialLink) => {
        setEditingLink(link);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (linkId: string) => {
        if (!firestore) return;
        try {
            await deleteSocialLink(firestore, linkId);
            toast({ title: 'Red social eliminada', description: 'El enlace ha sido eliminado correctamente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el enlace.' });
        }
    };

    const handleFormFinished = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingLink(undefined);
    };

    const handleDownloadPdf = async () => {
        if (!socialLinks || socialLinks.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos', description: 'No hay redes sociales para exportar.' });
            return;
        }
        setIsGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const { default: autoTable } = await import('jspdf-autotable');
            
            doc.setFontSize(18);
            doc.text("Listado de Redes Sociales", 14, 22);
            
            const tableData = socialLinks.map(link => [link.name, link.url]);
            
            autoTable(doc, {
                head: [['Red Social', 'URL']],
                body: tableData,
                startY: 30,
            });

            doc.save("redes_sociales_ateaco.pdf");
            toast({ title: '¡PDF generado!', description: 'La descarga ha comenzado.' });

        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos.</p></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Redes Sociales</CardTitle>
                <CardDescription>Añadir, editar o eliminar las URLs de los perfiles sociales.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isLoading || !socialLinks || socialLinks.length === 0}>
                        {isGeneratingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Redes (PDF)
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Red Social</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <PlusCircle className="h-5 w-5 text-primary" />
                                  Añadir Nueva Red Social
                                </DialogTitle>
                                <DialogDescription>Selecciona la red e introduce la URL de tu perfil.</DialogDescription>
                            </DialogHeader>
                            <SocialLinkForm onFinished={handleFormFinished} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Red Social</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 2 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Skeleton className="h-8 w-16 inline-block" />
                                        <Skeleton className="h-8 w-8 inline-block" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : socialLinks && socialLinks.map((link) => {
                            const Icon = socialIcons[link.name] || User;
                            return (
                                <TableRow key={link.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Icon className="h-5 w-5" />
                                        {link.name}
                                    </TableCell>
                                    <TableCell>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link.url}</a>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Dialog open={isEditDialogOpen && editingLink?.id === link.id} onOpenChange={(isOpen) => { if (!isOpen) setEditingLink(undefined); setIsEditDialogOpen(isOpen); }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(link)}>Editar</Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                      <Pencil className="h-5 w-5 text-primary" />
                                                      Editar Red Social
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <SocialLinkForm socialLink={editingLink} onFinished={handleFormFinished} />
                                            </DialogContent>
                                        </Dialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Eliminará permanentemente el enlace a esta red social.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(link.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {!isLoading && socialLinks?.length === 0 && <p className="text-center text-muted-foreground mt-4">No hay redes sociales configuradas.</p>}
            </CardContent>
        </Card>
    );
};

// SECTION: Gallery
const GalleryManagementForm = () => {
    const firestore = useFirestore();
    const storage = useStorage();
    const galleryCollection = React.useMemo(() => firestore ? collection(firestore, 'gallery') : null, [firestore]);
    const { data: images, isLoading, error } = useCollection<GalleryImage>(galleryCollection);
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = React.useState<string | null>(null);
    const [isDownloadingAll, setIsDownloadingAll] = React.useState(false);

    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

    const handleUploadSuccess = async (urls: string[]) => {
        if (!firestore) return;

        try {
            for (const url of urls) {
                await addGalleryImage(firestore, { imageUrl: url });
            }
            toast({ title: "¡Éxito!", description: `${urls.length} imagen(es) añadida(s) a la galería.` });
            setIsAddDialogOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar una o más imágenes.";
            toast({ variant: "destructive", title: "Error al guardar", description: errorMessage });
        }
    };
    
    const handleDelete = async (image: GalleryImage) => {
        if (!firestore || !storage) return;
        try {
            const imageRef = ref(storage, image.imageUrl);
            await deleteObject(imageRef);
            await deleteGalleryImage(firestore, image.id);
            toast({ title: 'Imagen eliminada', description: 'La imagen ha sido eliminada de la galería.' });
        } catch (error: any) {
             if (error.code === 'storage/object-not-found') {
                try {
                    await deleteGalleryImage(firestore, image.id);
                    toast({ title: 'Referencia eliminada', description: 'La referencia de la imagen ha sido eliminada.' });
                } catch (dbError) {
                    toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la imagen de la base de datos.' });
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la imagen.' });
            }
        }
    };
    
    const handleDownload = async (url: string, id: string) => {
        setIsDownloading(id);
        const formData = new FormData();
        formData.append('url', url);

        try {
            const result = await downloadImageAction(formData);
            
            if (result.success && result.fileData) {
                const { base64, contentType, filename } = result.fileData;
                const link = document.createElement('a');
                link.href = `data:${contentType};base64,${base64}`;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                 throw new Error(result.error || 'Error desconocido al procesar la descarga.');
            }
        } catch (error) {
            console.error("Error al descargar la imagen:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo iniciar la descarga.";
            toast({ variant: 'destructive', title: 'Error de descarga', description: errorMessage });
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDownloadAll = async () => {
      if (!images || images.length === 0) {
        toast({ variant: 'destructive', title: 'No hay imágenes', description: 'No hay imágenes en la galería para descargar.' });
        return;
      }
      setIsDownloadingAll(true);
      toast({ title: 'Preparando descarga...', description: 'Comprimiendo todas las imágenes. Esto puede tardar un momento.' });

      const formData = new FormData();
      images.forEach(image => formData.append('urls', image.imageUrl));

      try {
        const result = await downloadAllImagesAsZipAction(formData);
        
        if (result.success && result.fileData) {
            const { base64, filename } = result.fileData;
            const link = document.createElement('a');
            link.href = `data:application/zip;base64,${base64}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: '¡Descarga iniciada!', description: 'Tu archivo ZIP con todas las imágenes se está descargando.' });
        } else {
             throw new Error(result.error || 'Error desconocido al procesar el ZIP.');
        }
      } catch (error) {
        console.error("Error al descargar el ZIP:", error);
        const errorMessage = error instanceof Error ? error.message : "No se pudo iniciar la descarga del ZIP.";
        toast({ variant: 'destructive', title: 'Error de descarga', description: errorMessage });
      } finally {
        setIsDownloadingAll(false);
      }
    };


    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos.</p></CardContent></Card>;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Galería</CardTitle>
                <CardDescription>Añadir o eliminar imágenes de la galería. Puedes seleccionar varias a la vez.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                     <Button variant="outline" onClick={handleDownloadAll} disabled={isDownloadingAll || isLoading || !images || images.length === 0}>
                        {isDownloadingAll ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Galería (.zip)
                    </Button>
                     <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Imágenes</Button></DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <PlusCircle className="h-5 w-5 text-primary" />
                                Añadir Nuevas Imágenes
                            </DialogTitle>
                            <DialogDescription>Arrastra o selecciona los archivos que quieres subir a la galería.</DialogDescription>
                          </DialogHeader>
                           <ImageUploader
                                onUploadSuccess={handleUploadSuccess}
                                onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                folder="gallery"
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {isLoading ? (
                        Array.from({ length: 10 }).map((_, index) => (
                           <Skeleton key={index} className="aspect-square w-full" />
                        ))
                    ) : images && images.map((image) => (
                        <Card key={image.id} className="group relative overflow-hidden">
                           <Image
                                src={image.imageUrl}
                                alt="Imagen de la galería"
                                width={300}
                                height={300}
                                className="object-cover w-full aspect-square"
                            />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <div className="absolute top-2 right-2 flex flex-col gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="w-4 h-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Eliminará permanentemente la imagen.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(image)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="absolute bottom-2 right-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDownload(image.imageUrl, image.id)} disabled={isDownloading === image.id}>
                                        {isDownloading === image.id ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                 {!isLoading && images?.length === 0 && (
                    <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
                        <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No hay imágenes en la galería todavía.</p>
                         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir las primeras imágenes</Button></DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <PlusCircle className="h-5 w-5 text-primary" />
                                        Añadir Nuevas Imágenes
                                    </DialogTitle>
                                </DialogHeader>
                                <ImageUploader
                                    onUploadSuccess={handleUploadSuccess}
                                    onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                    folder="gallery"
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
};

// SECTION: Mentions
const mentionFormSchema = z.object({
  source: z.string().min(2, "La fuente debe tener al menos 2 caracteres."),
  date: z.string().min(1, "La fecha es requerida."),
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  type: z.enum(['digital', 'traditional'], { required_error: 'Debes seleccionar un tipo de medio.' }),
  url: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
}).refine(data => {
    if (data.type === 'digital') {
        return !!data.url && /^(https?:\/\/)?([\w.-@]+)\.([a-z.]{2,6})([\/\w_.-@]*)*\/?$/.test(data.url);
    }
    return true;
}, {
    message: "Debe ser una URL válida para un medio digital.",
    path: ["url"],
}).refine(data => {
    if (data.type === 'traditional') {
        return !!data.content && data.content.length >= 10;
    }
    return true;
}, {
    message: "El contenido debe tener al menos 10 caracteres para un medio tradicional.",
    path: ["content"],
});

const MentionForm = ({ mention, onFinished }: { mention?: Mention, onFinished: () => void }) => {
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<z.infer<typeof mentionFormSchema>>({
        resolver: zodResolver(mentionFormSchema),
        defaultValues: {
            source: mention?.source || "",
            date: mention?.date || new Date().toISOString().split('T')[0],
            title: mention?.title || "",
            type: mention?.type, // Default to undefined
            url: mention?.url || "",
            content: mention?.content || "",
            imageUrl: mention?.imageUrl || "",
        },
    });

    const mentionType = form.watch('type');

    const handleRemoveImage = async () => {
        const imageUrl = form.getValues('imageUrl');
        if (!imageUrl || !storage) {
            form.setValue('imageUrl', '');
            return;
        }

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
            toast({ title: "Imagen eliminada" });
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                toast({ variant: "destructive", title: "Error al eliminar imagen" });
            }
        } finally {
            form.setValue('imageUrl', '');
        }
    };

    async function onSubmit(values: z.infer<typeof mentionFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;
        
        const dataToSave: Partial<MentionDoc> = {
            ...values,
        };

        if (values.type === 'digital') {
            delete (dataToSave as Partial<MentionDoc>).content;
            if (values.url && !values.url.startsWith('http')) {
                dataToSave.url = `https://${values.url}`;
            }
        } else {
            delete (dataToSave as Partial<MentionDoc>).url;
        }

        try {
            if (mention?.id) {
                await updateMention(firestore, mention.id, dataToSave);
                toast({ title: "¡Éxito!", description: "Mención actualizada correctamente." });
            } else {
                await addMention(firestore, dataToSave as MentionDoc);
                toast({ title: "¡Éxito!", description: "Nueva mención añadida." });
            }
            onFinished();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "No se pudo guardar la mención.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ej: Ateaco deslumbra con su nueva obra" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="source" render={({ field }) => (
                      <FormItem><FormLabel>Medio / Fuente</FormLabel><FormControl><Input placeholder="Ej: La Voz de Galicia" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel>Fecha de publicación</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Tipo de medio</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="digital" id="digital" /></FormControl>
                                        <Label htmlFor="digital" className="font-normal">Digital</Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="traditional" id="traditional" /></FormControl>
                                        <Label htmlFor="traditional" className="font-normal">Tradicional</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {mentionType === 'digital' && (
                    <FormField control={form.control} name="url" render={({ field }) => (
                        <FormItem><FormLabel>URL del artículo</FormLabel><FormControl><Input placeholder="www.ejemplo.com/noticia" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}

                {mentionType === 'traditional' && (
                    <FormField control={form.control} name="content" render={({ field }) => (
                        <FormItem><FormLabel>Contenido de la noticia</FormLabel><FormControl><Textarea className="min-h-40" placeholder="Escribe aquí el contenido de la noticia..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                )}
                
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagen (Logo del medio, etc.)</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value}
                                    multiple={false}
                                    onUploadSuccess={(urls) => field.onChange(urls[0])}
                                    onUploadError={(error) => toast({ variant: 'destructive', title: 'Error al subir', description: error })}
                                    folder="mentions"
                                    onRemovePreview={handleRemoveImage}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const MencionesManagementForm = () => {
    const firestore = useFirestore();
    const mentionsCollection = React.useMemo(() => firestore ? collection(firestore, 'mentions') : null, [firestore]);
    const { data: mentions, isLoading, error } = useCollection<Mention>(mentionsCollection);
    const [editingMention, setEditingMention] = React.useState<Mention | undefined>(undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const { toast } = useToast();

    const handleEditClick = (mention: Mention) => {
        setEditingMention(mention);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (mentionId: string) => {
        if (!firestore) return;
        try {
            await deleteMention(firestore, mentionId);
            toast({ title: 'Mención eliminada', description: 'La mención ha sido eliminada correctamente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la mención.' });
        }
    };
    
    const handleFormFinished = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingMention(undefined);
    };

    const handleSeedMentions = async () => {
        if (!firestore) return;
        setIsSeeding(true);
        try {
            const mentionsToAdd = seedMentions();
            for (const mentionData of mentionsToAdd) {
                await addMention(firestore, mentionData);
            }
            toast({
                title: '¡Menciones añadidas!',
                description: `${mentionsToAdd.length} menciones de ejemplo han sido añadidas.`,
            });
        } catch (error) {
            console.error("Error seeding mentions:", error);
            toast({
                variant: 'destructive',
                title: 'Error al añadir datos',
                description: 'No se pudieron añadir las menciones de ejemplo.',
            });
        } finally {
            setIsSeeding(false);
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!mentions || mentions.length === 0) {
            toast({ variant: 'destructive', title: 'No hay datos', description: 'No hay menciones para exportar.' });
            return;
        }
        setIsGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const { default: autoTable } = await import('jspdf-autotable');
            
            doc.setFontSize(18);
            doc.text("Listado de Menciones en Medios", 14, 22);
            
            const tableData = mentions.map(m => [
                m.title,
                m.source,
                format(new Date(m.date), "dd/MM/yyyy"),
                m.type === 'digital' ? 'Digital' : 'Tradicional',
                m.url || 'N/A'
            ]);
            
            autoTable(doc, {
                head: [['Título', 'Medio', 'Fecha', 'Tipo', 'URL']],
                body: tableData,
                startY: 30,
            });

            doc.save("menciones_ateaco.pdf");
            toast({ title: '¡PDF generado!', description: 'La descarga ha comenzado.' });

        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los datos.</p></CardContent></Card>;
    }
    
    const isValidDate = (dateString: string) => dateString && !isNaN(new Date(dateString).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Menciones</CardTitle>
                <CardDescription>Añadir, editar o eliminar menciones en prensa y otros medios.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4 gap-2">
                     <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf || isLoading || !mentions || mentions.length === 0}>
                        {isGeneratingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Menciones (PDF)
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Añadir Mención</Button></DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <PlusCircle className="h-5 w-5 text-primary" />
                                  Añadir Nueva Mención
                                </DialogTitle>
                                <DialogDescription>Completa la información sobre el artículo o noticia.</DialogDescription>
                            </DialogHeader>
                            <MentionForm onFinished={handleFormFinished} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16"></TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Medio</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-16 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : mentions && mentions.map((mention) => (
                            <TableRow key={mention.id}>
                                <TableCell>
                                    <Avatar className="rounded-md">
                                        <AvatarImage src={mention.imageUrl} alt={mention.source} />
                                        <AvatarFallback className="rounded-md bg-muted"><Newspaper className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium max-w-sm truncate">
                                  {mention.type === 'digital' && mention.url ? (
                                    <Link href={mention.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                                        {mention.title} <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                  ) : (
                                    <span>{mention.title}</span>
                                  )}
                                </TableCell>
                                <TableCell>{mention.source}</TableCell>
                                <TableCell>{isValidDate(mention.date) ? format(new Date(mention.date), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog open={isEditDialogOpen && editingMention?.id === mention.id} onOpenChange={(isOpen) => { if (!isOpen) setEditingMention(undefined); setIsEditDialogOpen(isOpen); }}>
                                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => handleEditClick(mention)}>Editar</Button></DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                  <Pencil className="h-5 w-5 text-primary" />
                                                  Editar Mención
                                                </DialogTitle>
                                            </DialogHeader>
                                            <MentionForm mention={editingMention} onFinished={handleFormFinished} />
                                        </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Eliminará permanentemente la mención.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(mention.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!isLoading && mentions?.length === 0 && (
                     <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
                        <Newspaper className="w-16 h-16 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No hay menciones en la base de datos.</p>
                        <Button onClick={handleSeedMentions} disabled={isSeeding}>
                            {isSeeding ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Añadir 7 menciones de ejemplo
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// SECTION: Admin
const adminFormSchema = z.object({
  uid: z.string().min(1, "El UID es requerido."),
  email: z.string().email("El email no es válido."),
});

const AdminForm = ({ onFinished }: { onFinished: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<z.infer<typeof adminFormSchema>>({
        resolver: zodResolver(adminFormSchema),
        defaultValues: { uid: "", email: "" },
    });

    async function onSubmit(values: z.infer<typeof adminFormSchema>) {
        setIsSubmitting(true);
        if (!firestore) return;

        try {
            await addAdmin(firestore, values);
            toast({ title: "¡Éxito!", description: "Nuevo administrador añadido." });
            onFinished();
        } catch (error) {
            console.error("Error adding admin:", error);
            const errorMessage = error instanceof Error ? error.message : "No se pudo añadir el administrador.";
            toast({ variant: "destructive", title: "Error", description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="uid" render={({ field }) => (
                    <FormItem>
                        <FormLabel>UID del Usuario</FormLabel>
                        <FormControl><Input placeholder="UID de Firebase Auth" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email del Usuario</FormLabel>
                        <FormControl><Input placeholder="usuario@ejemplo.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Añadir
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};


const AdminManagementForm = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const adminsCollection = React.useMemo(() => firestore ? collection(firestore, 'admins') : null, [firestore]);
    const { data: admins, isLoading, error } = useCollection<AdminUser>(adminsCollection);
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

    const handleDelete = async (adminId: string) => {
        if (!firestore) return;
        try {
            await deleteAdmin(firestore, adminId);
            toast({ title: "Administrador eliminado" });
        } catch (error) {
            console.error("Error deleting admin:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar al administrador.' });
        }
    };
    
    if (error) {
        return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-destructive">No se pudieron cargar los administradores.</p></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin</CardTitle>
                <CardDescription>Añadir o eliminar usuarios con permisos de administración.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Administrador
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-primary" />
                                  Añadir Administrador
                                </DialogTitle>
                                <DialogDescription>
                                    Introduce el UID y el email del usuario de Firebase Authentication que quieres hacer administrador. El documento se creará usando el UID como ID.
                                </DialogDescription>
                            </DialogHeader>
                            <AdminForm onFinished={() => setIsAddDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>UID</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 1 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : admins && admins.map((admin) => (
                            <TableRow key={admin.uid}>
                                <TableCell className="font-medium">{admin.email}</TableCell>
                                <TableCell className="font-mono text-xs">{admin.uid}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={admin.uid === user?.uid}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al administrador y revocará su acceso. No puedes eliminarte a ti mismo.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(admin.uid)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {!isLoading && admins?.length === 0 && <p className="text-center text-muted-foreground mt-4">No hay administradores configurados.</p>}
                 {error && <p className="text-center text-destructive mt-4">Error al cargar administradores. Es posible que no tengas permisos.</p>}
            </CardContent>
        </Card>
    );
}


export default function AdminPage() {
    const { user, isLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (!firestore) return;

        const checkAdminStatus = async () => {
            const adminDocRef = doc(firestore, 'admins', user.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
                toast({
                    variant: 'destructive',
                    title: 'Acceso denegado',
                    description: 'No tienes permisos de administrador.',
                });
                router.push('/login');
            }
        };

        checkAdminStatus();
    }, [user, isLoading, router, firestore, toast]);

    if (isLoading || isAdmin === null) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
  
    const sections = [
    { value: "inicio", title: "Inicio", component: <HomePageForm /> },
    { value: "marca", title: "Marca", component: <BrandingForm /> },
    { value: "elenco", title: "Elenco", component: <CastManagementForm /> },
    { value: "obras", title: "Obras", component: <PlaysManagementForm /> },
    { value: "posts", title: "Posts", component: <PostsManagementForm /> },
    { value: "galeria", title: "Galería", component: <GalleryManagementForm /> },
    { value: "redes", title: "Redes", component: <SocialLinksManagementForm /> },
    { value: "menciones", title: "Menciones", component: <MencionesManagementForm /> },
    { value: "relacionados", title: "Webs", component: <RelatedWebsitesForm /> },
    { value: "admin", title: "Admin", component: <AdminManagementForm /> },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">Panel de Administración</h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          Gestiona el contenido de la web de Ateaco.
        </p>
      </div>

      <Tabs defaultValue="inicio" className="w-full">
        <div className="flex justify-center">
          <TabsList className="h-auto flex-wrap justify-center">
            {sections.map(section => (
              <TabsTrigger key={section.value} value={section.value}>{section.title}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {sections.map(section => (
          <TabsContent key={section.value} value={section.value} className="mt-4">
             {section.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
