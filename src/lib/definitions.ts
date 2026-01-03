export type NavLink = {
  href: string;
  label: string;
};

export type CastMember = {
  id: string;
  name: string;
  roles: string[];
  description: string;
  imageUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
};

export type Performance = {
  date: string; // yyyy-MM-dd
  location: string;
  city: string;
  province: string;
};

export type Play = {
  id: string;
  title: string;
  genre: string;
  premiereDate: Performance;
  duration: string;
  author: string;
  director: string;
  actors: string[];
  synopsis: string;
  performanceDates: Performance[];
  onShow?: boolean;
  nextShow?: Performance;
  ticketUrl?: string;
  posterUrl?: string;
};

export type Post = {
  id: string;
  title: string;
  author: string;
  publishDate: string; // yyyy-MM-dd
  article: string;
  imageUrl?: string;
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
};

export type Mention = {
  id: string;
  source: string;
  date: string;
  title: string;
  type: 'digital' | 'traditional';
  url?: string;
  content?: string;
  imageUrl?: string;
};

export type RelatedWebsite = {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
};

export type SocialLink = {
  id: string;
  name: 'Facebook' | 'YouTube' | 'Instagram' | 'X';
  url: string;
};

export type AdminUser = {
    id: string;
    uid: string;
    email: string;
}

export type Branding = {
    logoUrl?: string;
}

// Firestore document types
export interface PlayDoc {
    title: string;
    genre: string;
    premiereDate: Performance;
    duration: string;
    author: string;
    director: string;
    synopsis: string;
    actors: string[];
    performanceDates: Performance[];
    onShow?: boolean;
    nextShow?: Performance;
    ticketUrl?: string;
    posterUrl?: string;
}

export interface RelatedWebsiteDoc {
  name: string;
  url: string;
  description: string;
  imageUrl?: string;
}

export interface HomePageContent {
  title: string;
  paragraph: string;
}

export interface BrandingDoc {
    logoUrl?: string;
}


export interface CastMemberDoc {
    name: string;
    roles: string[];
    description: string;
    imageUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    xUrl?: string;
    tiktokUrl?: string;
}

export interface PostDoc {
  title: string;
  author: string;
  publishDate: string; // yyyy-MM-dd
  article: string;
  imageUrl?: string;
}

export interface SocialLinkDoc {
    name: 'Facebook' | 'YouTube' | 'Instagram' | 'X';
    url: string;
}

export interface GalleryImageDoc {
  imageUrl: string;
}

export interface MentionDoc {
  source: string;
  date: string;
  title: string;
  type: 'digital' | 'traditional';
  url?: string;
  content?: string;
  imageUrl?: string;
}

export interface AdminUserDoc {
    uid: string;
    email: string;
}
