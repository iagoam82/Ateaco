'use client';

import type { PlayDoc, Performance, PostDoc, MentionDoc } from './definitions';
import { cast as allCast } from './data';

const actors = allCast.filter(c => c.roles.includes('Actor') || c.roles.includes('Actriz')).map(c => c.name);

const getRandomItems = <T>(arr: T[], num: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

const createRandomDate = (startYear: number, endYear: number): string => {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const locations = [
  { location: 'Teatro Colón', city: 'A Coruña', province: 'A Coruña' },
  { location: 'Pazo da Cultura', city: 'Narón', province: 'A Coruña' },
  { location: 'Auditorio de Galicia', city: 'Santiago de Compostela', province: 'A Coruña' },
  { location: 'Teatro Rosalía de Castro', city: 'A Coruña', province: 'A Coruña' },
  { location: 'Auditorio Municipal', city: 'Vigo', province: 'Pontevedra' },
  { location: 'Teatro Principal', city: 'Ourense', province: 'Ourense' },
  { location: 'Pazo da Cultura', city: 'Pontevedra', province: 'Pontevedra' },
];

const createPerformance = (date: string): Performance => {
  const loc = locations[Math.floor(Math.random() * locations.length)];
  return { date, ...loc };
};

const createMultiplePerformances = (startDate: string, count: number): Performance[] => {
    const performances: Performance[] = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < count; i++) {
        currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 30) + 7);
        performances.push(createPerformance(currentDate.toISOString().split('T')[0]));
    }
    return performances;
};


const playsData: Omit<PlayDoc, 'id'>[] = [
  {
    title: 'O home que perdeu a inmortalidade',
    genre: 'Drama',
    premiereDate: createPerformance('2018-05-12'),
    duration: '90',
    author: 'Andrés Pociña',
    director: 'Carlos López',
    synopsis: 'Unha reflexión sobre a vida, a morte e o prezo da eternidade. Un home que non pode morrer busca desesperadamente o fin da súa existencia.',
    actors: getRandomItems(actors, 5),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Farsa das zocas',
    genre: 'Comedia',
    premiereDate: createPerformance('2019-02-20'),
    duration: '75',
    author: 'Ricardo Carballo Calero',
    director: 'Carlos López',
    synopsis: 'Unha divertida comedia de enredo no rural galego, onde unhas zocas perdidas desencadean unha serie de situacións disparatadas.',
    actors: getRandomItems(actors, 6),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Historia de un secuestro',
    genre: 'Tragicomedia',
    premiereDate: createPerformance('2021-11-05'),
    duration: '85',
    author: 'Creación colectiva',
    director: 'Carlos López',
    synopsis: 'O que comeza como un secuestro convértese nunha extraña convivencia chea de humor negro e momentos inesperados de tenrura.',
    actors: getRandomItems(actors, 4),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Comedia bífida',
    genre: 'Comedia negra',
    premiereDate: createPerformance('2022-04-23'),
    duration: '80',
    author: 'Manuel Núñez Singala',
    director: 'Carlos López',
    synopsis: 'Dous personaxes, dúas realidades, un só escenario. Unha obra que explora a dualidade do ser humano con moito humor e ironía.',
    actors: getRandomItems(actors, 2),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'La revuelta',
    genre: 'Teatro social',
    premiereDate: createPerformance('2020-09-15'),
    duration: '100',
    author: 'Santiago Moncada',
    director: 'Juan Pérez',
    synopsis: 'Un grupo de veciños dun barrio obreiro organízase para loitar contra a inxustiza social. Unha obra de gran carga política e emocional.',
    actors: getRandomItems(actors, 8),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Cóncavo convexo',
    genre: 'Alternativo',
    premiereDate: createPerformance('2023-01-20'),
    duration: '60',
    author: 'Laila Ripoll',
    director: 'Ana Martínez',
    synopsis: 'Unha exploración visual e sonora sobre as formas e os espazos que nos rodean e como nos definen. Unha peza experimental e suxestiva.',
    actors: getRandomItems(actors, 3),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Abnegación',
    genre: 'Drama',
    premiereDate: createPerformance('2017-06-10'),
    duration: '95',
    author: 'Jacinto Benavente',
    director: 'Carlos López',
    synopsis: 'A historia dun sacrificio persoal por un ben maior. Un drama intenso sobre o deber, o amor e a renuncia.',
    actors: getRandomItems(actors, 5),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Refacho',
    genre: 'Drama',
    premiereDate: createPerformance('2019-10-01'),
    duration: '80',
    author: 'Lourdes de Abajo',
    director: 'Juan Pérez',
    synopsis: 'Unha treboada inesperada deixa a un grupo de persoas illadas nunha casa. As tensións e os segredos non tardarán en aflorar.',
    actors: getRandomItems(actors, 6),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Final de película',
    genre: 'Comedia negra',
    premiereDate: createPerformance('2022-09-30'),
    duration: '70',
    author: 'Francisco Taxes',
    director: 'Carlos López',
    synopsis: 'A vida dun director de cine fracasado dá un xiro cando a realidade comeza a imitar as súas películas. Unha comedia aceda sobre o éxito e o fracaso.',
    actors: getRandomItems(actors, 4),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Mátame que eu non podo',
    genre: 'Comedia',
    premiereDate: createPerformance('2021-03-12'),
    duration: '85',
    author: 'Creación colectiva',
    director: 'María García',
    synopsis: 'Un home contrata a un asasino a soldo para acabar coa súa propia vida, pero o asasino non é o que parece. Unha comedia de situacións hilarantes.',
    actors: getRandomItems(actors, 3),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Eirugas',
    genre: 'Teatro infantil / familiar',
    premiereDate: createPerformance('2023-05-17'),
    duration: '50',
    author: 'Ana Martínez',
    director: 'Ana Martínez',
    synopsis: 'Unha divertida e tenra historia sobre a transformación e a amizade, protagonizada por unhas eirugas moi curiosas. Ideal para toda a familia.',
    actors: getRandomItems(actors, 4),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Nise te ocurra abrir la puerta',
    genre: 'Comedia',
    premiereDate: createPerformance('2018-11-16'),
    duration: '90',
    author: 'Carlos Casares',
    director: 'Juan Pérez',
    synopsis: 'Unha noite de treboada, un timbre soa. Quen será? A partir de aí, una sucesión de personaxes estrafalarios e situacións cómicas.',
    actors: getRandomItems(actors, 7),
    performanceDates: [],
    onShow: false,
  },
  {
    title: 'Cena de 5 crímenes',
    genre: 'Tragicomedia',
    premiereDate: createPerformance('2024-02-09'),
    duration: '120',
    author: 'Javier Veiga',
    director: 'Carlos López',
    synopsis: 'Unha cea de amigos convértese nunha investigación cando se descobre un crime. Todos son sospeitosos. Quen será o culpable?',
    actors: getRandomItems(actors, 5),
    performanceDates: [],
    onShow: true,
    ticketUrl: 'https://www.ataquilla.com/',
  },
];

export const seedPlays = (): PlayDoc[] => {
    return playsData.map(play => {
        const perfDateCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 dates
        const performances = createMultiplePerformances(play.premiereDate.date, perfDateCount);
        
        const playDoc: Partial<PlayDoc> = {
            ...play,
            performanceDates: performances,
        };
        
        if (play.onShow) {
            const futurePerformances = performances.filter(p => new Date(p.date) > new Date());
            let nextShow: Performance | undefined;
            if(futurePerformances.length > 0){
                nextShow = futurePerformances[0];
            } else {
                nextShow = createPerformance(createRandomDate(2024, 2024));
                performances.push(nextShow);
                performances.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                playDoc.performanceDates = performances;
            }
            playDoc.nextShow = nextShow;
        } else {
            delete playDoc.nextShow;
        }

        return playDoc as PlayDoc;
    });
};


export const seedPosts = (): PostDoc[] => {
  const posts: PostDoc[] = [];
  const castForPosts = allCast.slice(0, 6);
  let date = new Date();

  for (let i = 0; i < castForPosts.length; i++) {
    const member = castForPosts[i];
    date.setDate(date.getDate() - (Math.floor(Math.random() * 10) + 5)); // Go back 5-15 days for each post
    
    let post: PostDoc;

    switch (i) {
        case 0: // Juan Pérez
            post = {
                title: "Desde la fundación: La visión de Juan Pérez",
                author: member.name,
                publishDate: date.toISOString().split('T')[0],
                article: `Cuando un grupo de amigos nos juntamos allá por 2002, nunca imaginamos que Ateaco llegaría tan lejos. La idea era simple: compartir nuestra pasión por el teatro. Cada ensayo, cada función, es un recordatorio de por qué empezamos. Mi amor por los clásicos siempre ha sido el motor, pero es la energía de las nuevas generaciones lo que mantiene viva la llama. Ver cómo una idea en un texto se transforma en emoción en el escenario es una magia que nunca envejece. Ateaco es más que una compañía, es una familia que sigue creciendo, y no podría estar más orgulloso de cada persona que ha formado parte de este viaje.`,
                imageUrl: 'https://picsum.photos/seed/post1/1200/800'
            };
            break;
        case 1: // María García
            post = {
                title: "La comedia como refugio, por María García",
                author: member.name,
                publishDate: date.toISOString().split('T')[0],
                article: `Siempre he creído en el poder curativo de la risa. En un mundo a menudo demasiado serio, la comedia es un soplo de aire fresco, un espacio donde podemos reírnos de nosotros mismos y de nuestras desgracias. Para mí, no hay nada más gratificante que escuchar la carcajada del público. Es una conexión instantánea y sincera. Preparar un personaje cómico es un desafío de precisión y ritmo, pero cuando las piezas encajan y la gente disfruta, todo el esfuerzo cobra sentido. El teatro nos da la oportunidad de ser otros, pero también de ser más nosotros mismos, y la comedia es mi forma favorita de explorar esa paradoja.`,
                imageUrl: 'https://picsum.photos/seed/post2/1200/800'
            };
            break;
        case 2: // Carlos López
            post = {
                title: "Rompiendo la cuarta pared: La dirección escénica según Carlos López",
                author: member.name,
                publishDate: date.toISOString().split('T')[0],
                article: `Mi objetivo como director es nunca dar nada por sentado. El escenario es un lienzo en blanco donde las reglas se pueden reescribir. Me fascina explorar nuevos lenguajes, mezclar lo visual con lo sonoro, llevar el teatro a lugares inesperados. No se trata de innovar por innovar, sino de encontrar la forma más potente de contar una historia hoy. El proceso creativo es un diálogo constante con los actores, los técnicos, con el texto... y con el silencio. Cada obra es una pregunta que lanzamos al público, una invitación a ver el mundo desde otra perspectiva, aunque solo sea por un par de horas.`,
                imageUrl: 'https://picsum.photos/seed/post3/1200/800'
            };
            break;
        case 3: // Ana Martínez
            post = {
                title: "La verdad en el personaje, una reflexión de Ana Martínez",
                author: member.name,
                publishDate: date.toISOString().split('T')[0],
                article: `La actuación, para mí, es un ejercicio de empatía radical. Se trata de despojarse de una misma para poder albergar a otra persona dentro de ti. No busco interpretar, busco ser. Es un proceso de investigación profunda, de entender las motivaciones, los miedos y los anhelos del personaje hasta que su voz se sienta como propia. A veces es doloroso, otras es liberador, pero siempre es un viaje de autodescubrimiento. La mayor recompensa es sentir que el público no ve a una actriz, sino a una persona real viviendo una verdad en el escenario. Esa conexión es el verdadero corazón del teatro.`,
                imageUrl: 'https://picsum.photos/seed/post4/1200/800'
            };
            break;
        case 4: // David Sánchez
            post = {
                title: "El placer del absurdo: David Sánchez y la improvisación",
                author: member.name,
                publishDate: date.toISOString().split('T')[0],
                article: `Lo que más me atrae del teatro es su capacidad para desafiar la lógica. El teatro del absurdo nos muestra un espejo deformado de nuestra propia realidad, y en esa deformidad, a menudo, encontramos una verdad más profunda. La improvisación es la herramienta perfecta para explorar este territorio. Te obliga a estar presente, a escuchar, a reaccionar desde el instinto. No hay red de seguridad, y eso es aterrador y emocionante a la vez. Cada función es única, un momento irrepetible creado en comunión con los compañeros y el público. Es el teatro en su estado más puro: vivo.`,
                imageUrl: 'https://picsum.photos/seed/post5/1200/800'
            };
            break;
        case 5: // Laura Rodríguez
            post = {
                title: "Construyendo mundos: El arte de la escenografía por Laura Rodríguez",
                author: member.name,
                publishDate: date.toISOString().split('T')[0],
                article: `Mi trabajo empieza mucho antes de que se levante el telón. Empieza con una lectura, con una conversación, con una mancha de color en un papel. La escenografía no es solo un decorado; es un personaje más de la obra. Define el espacio, crea la atmósfera y cuenta una parte de la historia que las palabras no pueden expresar. Cada objeto, cada textura, cada luz tiene un propósito. Es un puzzle complejo donde la funcionalidad y la estética deben ir de la mano. Ver cómo los actores habitan el espacio que has imaginado y lo hacen suyo es el momento en que el diseño cobra vida y se convierte, verdaderamente, en teatro.`,
                imageUrl: 'https://picsum.photos/seed/post6/1200/800'
            };
            break;
    }
    posts.push(post);
  }

  return posts;
};


export const seedMentions = (): MentionDoc[] => {
    const mentions: MentionDoc[] = [
        {
            source: "La Voz de Galicia",
            date: "2024-03-15",
            title: "Ateaco deslumbra con el estreno de 'Cena de 5 crímenes'",
            type: "digital",
            url: "https://www.lavozdegalicia.es",
            imageUrl: 'https://picsum.photos/seed/mention1/400/300'
        },
        {
            source: "El Ideal Gallego",
            date: "2024-02-10",
            title: "El teatro aficionado de A Coruña vive una edad de oro gracias a grupos como Ateaco",
            type: "digital",
            url: "https://www.elidealgallego.com",
            imageUrl: 'https://picsum.photos/seed/mention2/400/300'
        },
        {
            source: "Revista Cultural 'El Telón'",
            date: "2023-11-20",
            title: "Análisis de 'Comedia Bífida': La dualidad del ser en clave de humor",
            type: "traditional",
            content: "La última propuesta de Ateaco, 'Comedia Bífida', es una inteligente reflexión sobre la naturaleza humana. Con una puesta en escena minimalista, la compañía logra transmitir la complejidad de sus personajes a través de diálogos ágiles y un humor que roza el absurdo. La interpretación de sus dos protagonistas es magistral, llevando al espectador de la carcajada a la reflexión en cuestión de segundos.",
            imageUrl: 'https://picsum.photos/seed/mention3/400/300'
        },
        {
            source: "Blog 'EscenaGZ'",
            date: "2023-09-05",
            title: "Entrevista con Carlos López, director de Ateaco: 'El teatro debe ser un espejo incómodo'",
            type: "digital",
            url: "https://www.escenagz.com/blog",
            imageUrl: 'https://picsum.photos/seed/mention4/400/300'
        },
        {
            source: "Radio Galega (Diario Cultural)",
            date: "2023-05-18",
            title: "A compañía Ateaco estrea 'Eirugas', unha proposta para toda a familia",
            type: "digital",
            url: "https://www.crtvg.es/radio/a-carta/diario-cultural",
            imageUrl: 'https://picsum.photos/seed/mention5/400/300'
        },
        {
            source: "DXT Campeón",
            date: "2022-10-10",
            title: "El teatro también es deporte: la entrega física del elenco de 'La Revuelta'",
            type: "traditional",
            content: "Pocos espectáculos demandan una entrega física tan notable como 'La Revuelta'. El elenco de Ateaco demuestra una preparación atlética envidiable en una coreografía escénica que no da tregua. Cada movimiento está medido para transmitir la tensión de la historia, convirtiendo el escenario en un campo de batalla emocional y físico. Un trabajo admirable que demuestra que el teatro, a veces, es un deporte de alta competición.",
            imageUrl: 'https://picsum.photos/seed/mention6/400/300'
        },
        {
            source: "Quincemil (El Español)",
            date: "2022-01-15",
            title: "Ateaco, 20 años sobre las tablas coruñesas: 'Somos una familia'",
            type: "digital",
            url: "https://www.elespanol.com/quincemil/",
            imageUrl: 'https://picsum.photos/seed/mention7/400/300'
        }
    ];
    return mentions;
};
