'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import FacebookIcon from '@/components/icons/facebook-logo';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.556,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de email válida." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type FormValues = z.infer<typeof formSchema>;

const AuthForm = ({ action, buttonText, onSubmit }: { action: 'login' | 'signup', buttonText: string, onSubmit: (values: FormValues) => Promise<void> }) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

    const handleSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        await onSubmit(values);
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {buttonText}
                </Button>
            </form>
        </Form>
    );
};

export default function LoginPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const checkAdminAndRedirect = async (user: User) => {
        if (!firestore || !auth) return;
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
            toast({
                title: '¡Sesión iniciada!',
                description: "Redirigiendo al panel de administración...",
            });
            router.push('/admin');
        } else {
            await signOut(auth);
            toast({
                variant: 'destructive',
                title: 'Acceso denegado',
                description: 'No tienes permisos de administrador.',
            });
        }
    };


    const handleAuthError = (error: any, action: 'login' | 'signup' | 'google' | 'facebook') => {
        let title = 'Error';
        let description = 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';

        switch (error.code) {
            case 'auth/invalid-email':
                title = 'Email no válido';
                description = 'Por favor, introduce una dirección de email correcta.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                title = 'Usuario no encontrado';
                description = 'El email o la contraseña no son correctos. Por favor, inténtalo de nuevo.';
                break;
            case 'auth/email-already-in-use':
                title = 'El email ya existe';
                description = 'Ya existe una cuenta con este correo. Prueba a iniciar sesión.';
                break;
            case 'auth/weak-password':
                title = 'Contraseña débil';
                description = 'La contraseña debe tener al menos 6 caracteres.';
                break;
            case 'auth/operation-not-allowed':
                title = 'Operación no permitida';
                description = 'El inicio de sesión con este método no está habilitado. Contacta al administrador.';
                break;
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                title = 'Petición cancelada';
                description = 'Has cancelado o cerrado la ventana de inicio de sesión.';
                break;
            case 'auth/account-exists-with-different-credential':
                title = 'Cuenta ya existe';
                description = 'Ya existe una cuenta con el mismo email pero con un método de inicio de sesión diferente.';
                break;
            default:
                 console.error(`${action} error:`, error);
        }
        toast({ variant: 'destructive', title, description });
    };

    const handleEmailAuth = async (action: 'login' | 'signup', values: FormValues) => {
        if (!auth) {
            toast({ variant: 'destructive', title: 'Error de configuración', description: 'El servicio de autenticación no está disponible.' });
            return;
        }

        try {
            let userCredential;
            if (action === 'login') {
                userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            }
            await checkAdminAndRedirect(userCredential.user);
        } catch (error: any) {
            handleAuthError(error, action);
        }
    };
    
    const handleGoogleSignIn = async () => {
        if (!auth) {
            toast({ variant: 'destructive', title: 'Error de configuración', description: 'El servicio de autenticación no está disponible.' });
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            await checkAdminAndRedirect(userCredential.user);
        } catch (error) {
            handleAuthError(error, 'google');
        }
    };

    const handleFacebookSignIn = async () => {
        if (!auth) {
            toast({ variant: 'destructive', title: 'Error de configuración', description: 'El servicio de autenticación no está disponible.' });
            return;
        }
        const provider = new FacebookAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await checkAdminAndRedirect(result.user);
        } catch (error) {
            handleAuthError(error, 'facebook');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                 <CardHeader className="text-center">
                    <CardTitle>Acceso de Administrador</CardTitle>
                    <CardDescription>Inicia sesión para gestionar el contenido de la web.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Iniciar sesión con Google
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleFacebookSignIn}>
                        <FacebookIcon className="mr-2 h-5 w-5" />
                        Iniciar sesión con Facebook
                    </Button>
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                           <Button variant="outline" className="w-full">
                                <Mail className="mr-2 h-5 w-5" />
                                Iniciar sesión con Email
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4">
                           <AuthForm action="login" buttonText="Iniciar sesión" onSubmit={(values) => handleEmailAuth('login', values)} />
                        </CollapsibleContent>
                    </Collapsible>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad (imaginarios).</p>
                </CardFooter>
            </Card>
        </div>
    );
}

    
