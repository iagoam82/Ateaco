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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useStorage, useUser } from '@/firebase';
import { addRelatedWebsite, updateHomePageContent, updateRelatedWebsite, addCastMember, updateCastMember, deleteCastMember, addPlay, updatePlay, deletePlay, addPost, updatePost, deletePost, updateSocialLink, addSocialLink, deleteSocialLink, addGalleryImage, deleteGalleryImage, addMention, updateMention, deleteMention, addAdmin, deleteAdmin, updateBranding } from '@/firebase/firestore/writes';
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

// ... (Resto de los componentes como Play, Post, etc. irían aquí, pero se omiten por brevedad) ...

export default function AdminPage() {
    // ... (El código de la página principal de admin va aquí) ...
}
