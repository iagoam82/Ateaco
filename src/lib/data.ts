import type { NavLink, CastMember } from './definitions';

export const navLinks: NavLink[] = [
  { href: '/', label: 'Inicio' },
  { href: '/elenco', label: 'Elenco' },
  { href: '/obras', label: 'Obras' },
  { href: '/posts', label: 'Posts' },
  { href: '/galeria', label: 'Galería' },
  { href: '/menciones', label: 'Menciones' },
  { href: '/relacionados', label: 'Webs Relacionadas' },
  { href: '/contacto', label: 'Contacto' },
];


export const cast: Omit<CastMember, 'id'>[] = [
    {
        name: 'Juan Pérez',
        roles: ['Actor', 'Director'],
        description: 'Fundador de Ateaco con más de 20 años de experiencia en los escenarios. Apasionado del teatro clásico y la dirección de actores.',
        imageUrl: 'https://images.unsplash.com/photo-1615484800095-7f6bbb859637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxwb3J0cmFpdCUyMGFjdG9yfGVufDB8fHx8MTc2NTExMjMxM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        name: 'María García',
        roles: ['Actriz'],
        description: 'Actriz versátil con un talento especial para la comedia. Su energía en el escenario es contagiosa.',
        imageUrl: 'https://images.unsplash.com/photo-1706824265660-5ca5effaf122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxwb3J0cmFpdCUyMGFjdHJlc3N8ZW58MHx8fHwxNzY1MTEyMzEzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        instagramUrl: 'https://instagram.com',
        xUrl: 'https://x.com'
    },
    {
        name: 'Carlos López',
        roles: ['Director', 'Dramaturgo'],
        description: 'La mente creativa detrás de muchas de nuestras obras. Siempre buscando nuevas formas de narrar historias y sorprender al público.',
        imageUrl: 'https://images.unsplash.com/photo-1597466372553-872e25a63b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxoZWFkc2hvdCUyMHBlcnNvbnxlbnwwfHx8fDE3NjUxMDA1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        name: 'Ana Martínez',
        roles: ['Actriz', 'Técnica de vestuario'],
        description: 'Desde la interpretación hasta el último detalle del vestuario, Ana es una pieza fundamental en la compañía.',
        imageUrl: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxoZWFkc2hvdCUyMHNtaWxpbmd8ZW58MHx8fHwxNzY1MTEyMzEzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        facebookUrl: 'https://facebook.com',
    },
    {
        name: 'David Sánchez',
        roles: ['Actor'],
        description: 'Especialista en teatro del absurdo y la improvisación. Su capacidad para crear personajes únicos es asombrosa.',
        imageUrl: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjUwMjYxNTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        name: 'Laura Rodríguez',
        roles: ['Actriz', 'Escenógrafa'],
        description: 'Crea mundos mágicos en el escenario con su visión para la escenografía y el atrezo. Como actriz, destaca por su intensidad dramática.',
        imageUrl: 'https://images.unsplash.com/photo-1633003678751-d5eb96dbd5d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxhY3RvciUyMGhlYWRzaG90fGVufDB8fHx8MTc2NTAxNTczOXww&ixlib=rb-4.1.0&q=80&w=1080',
        instagramUrl: 'https://instagram.com',
    },
    {
        name: 'Javier Fernández',
        roles: ['Actor'],
        description: 'Actor con gran presencia escénica, domina tanto el drama como la comedia. Un pilar en nuestras producciones.',
        imageUrl: 'https://images.unsplash.com/photo-1655369767783-240c30ba4bbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxhY3RyZXNzJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzY1MTEyMzEzfDA&ixlib=rb-4.1.0&q=80&w=1080',
        xUrl: 'https://x.com',
    },
    {
        name: 'Sofía Gómez',
        roles: ['Actriz'],
        description: 'La incorporación más reciente al elenco, aportando frescura y un talento natural para la interpretación.',
        imageUrl: 'https://images.unsplash.com/photo-1635131902146-6957477a4ff4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwZXJzb24lMjBzbWlsaW5nfGVufDB8fHx8MTc2NTAyODExMXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        name: 'Alberto Núñez',
        roles: ['Técnico de sonido y luces'],
        description: 'El mago detrás de la consola. Crea las atmósferas que envuelven nuestras obras y se asegura de que todo se vea y se oiga a la perfección.',
        imageUrl: 'https://images.unsplash.com/photo-1583195763986-0231686dcd43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjUwOTc0OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
];
