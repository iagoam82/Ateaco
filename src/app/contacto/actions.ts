'use server';

import * as z from 'zod';
import { Resend } from 'resend';
import ContactEmail from '@/emails/contact-email';
import * as React from 'react';

const formSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_DESTINO = 'iagoam@hotmail.es';

export async function sendContactMessage(formData: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Datos del formulario no válidos.'
    };
  }

  const { email, subject, message } = validatedFields.data;

  // Enviar email con Resend
  if (!process.env.RESEND_API_KEY) {
    console.error("La variable de entorno RESEND_API_KEY no está configurada.");
    return {
      success: false,
      error: 'El servicio de correo no está configurado en el servidor.'
    };
  }
  
  if (EMAIL_DESTINO === 'tu-email@ejemplo.com') {
    console.error("Por favor, cambia la dirección de correo de destino en src/app/contacto/actions.ts");
     return {
      success: false,
      error: 'El servidor necesita configurar la dirección de email de destino.'
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Ateaco Web <onboarding@resend.dev>', // Este remitente es requerido por Resend en el plan gratuito
      to: [EMAIL_DESTINO],
      subject: `Nuevo Mensaje: ${subject}`,
      reply_to: email,
      react: React.createElement(ContactEmail, { email, subject, message }),
    });

    if (error) {
      console.error("Error al enviar email con Resend:", error);
      return { 
        success: false, 
        error: 'No se pudo enviar el correo.' 
      };
    }

    return { success: true };

  } catch (error) {
    console.error("Error inesperado al enviar email:", error);
    return { 
      success: false, 
      error: 'Ha ocurrido un error inesperado en el servidor.' 
    };
  }
}
