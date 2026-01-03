'use client';

import { collection, addDoc, doc, updateDoc, Firestore, setDoc, deleteDoc } from "firebase/firestore";
import type { HomePageContent, RelatedWebsiteDoc, CastMemberDoc, PlayDoc, PostDoc, SocialLinkDoc, GalleryImageDoc, MentionDoc, AdminUserDoc, BrandingDoc } from "@/lib/definitions";
import { errorEmitter } from "../error-emitter";
import { FirestorePermissionError } from "../errors";

// Branding
export function updateBranding(firestore: Firestore, data: BrandingDoc) {
  const docRef = doc(firestore, "branding", "main");
  return setDoc(docRef, data, { merge: true }).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}


// Posts
export function addPost(firestore: Firestore, data: PostDoc) {
  const collectionRef = collection(firestore, "posts");
  return addDoc(collectionRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: collectionRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function updatePost(firestore: Firestore, id: string, data: Partial<PostDoc>) {
  const docRef = doc(firestore, "posts", id);
  return updateDoc(docRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function deletePost(firestore: Firestore, id: string) {
    const docRef = doc(firestore, "posts", id);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}


// Obras
export function addPlay(firestore: Firestore, data: PlayDoc) {
  const collectionRef = collection(firestore, "plays");
  return addDoc(collectionRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: collectionRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function updatePlay(firestore: Firestore, id: string, data: Partial<PlayDoc>) {
  const docRef = doc(firestore, "plays", id);
  return updateDoc(docRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function deletePlay(firestore: Firestore, id: string) {
    const docRef = doc(firestore, "plays", id);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}


// Webs Relacionadas
export function addRelatedWebsite(firestore: Firestore, data: RelatedWebsiteDoc) {
  const collectionRef = collection(firestore, "related-web");
  const dataToAdd: RelatedWebsiteDoc = {
    name: data.name,
    url: data.url,
    description: data.description,
    imageUrl: data.imageUrl || '',
  };
  return addDoc(collectionRef, dataToAdd).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: collectionRef.path,
      operation: 'create',
      requestResourceData: dataToAdd,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the original error to be caught by the calling function's try/catch block
    throw serverError;
  });
}

export function updateRelatedWebsite(firestore: Firestore, id: string, data: Partial<RelatedWebsiteDoc>) {
  const docRef = doc(firestore, "related-web", id);
  const dataToUpdate: Partial<RelatedWebsiteDoc> = {
    name: data.name,
    url: data.url,
    description: data.description,
    imageUrl: data.imageUrl,
  };

  return updateDoc(docRef, dataToUpdate).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the original error to be caught by the calling function's try/catch block
    throw serverError;
  });
}

// Contenido de Inicio
export function updateHomePageContent(firestore: Firestore, data: HomePageContent) {
  const docRef = doc(firestore, "pages", "home");
  const dataToUpdate: HomePageContent = {
    title: data.title,
    paragraph: data.paragraph,
  };

  return setDoc(docRef, dataToUpdate, { merge: true }).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

// Miembros del Elenco
export function addCastMember(firestore: Firestore, data: CastMemberDoc) {
  const collectionRef = collection(firestore, "cast");
  return addDoc(collectionRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: collectionRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function updateCastMember(firestore: Firestore, id: string, data: Partial<CastMemberDoc>) {
  const docRef = doc(firestore, "cast", id);
  return updateDoc(docRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function deleteCastMember(firestore: Firestore, id: string) {
    const docRef = doc(firestore, "cast", id);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Social Links
export function updateSocialLink(firestore: Firestore, id: string, data: Partial<SocialLinkDoc>) {
    const docRef = doc(firestore, "social-links", id);
    return updateDoc(docRef, data).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export function addSocialLink(firestore: Firestore, data: SocialLinkDoc) {
    const collectionRef = collection(firestore, "social-links");
    return addDoc(collectionRef, data).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export function deleteSocialLink(firestore: Firestore, id: string) {
    const docRef = doc(firestore, "social-links", id);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Gallery
export function addGalleryImage(firestore: Firestore, data: GalleryImageDoc) {
    const collectionRef = collection(firestore, "gallery");
    return addDoc(collectionRef, data).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export function updateGalleryImage(firestore: Firestore, id: string, data: Partial<GalleryImageDoc>) {
    const docRef = doc(firestore, "gallery", id);
    return updateDoc(docRef, data).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export function deleteGalleryImage(firestore: Firestore, id: string) {
    const docRef = doc(firestore, "gallery", id);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Mentions
export function addMention(firestore: Firestore, data: MentionDoc) {
  const collectionRef = collection(firestore, "mentions");
  const dataToSave = { ...data };
  if (data.type === 'digital') {
    delete (dataToSave as Partial<MentionDoc>).content;
  } else {
    delete (dataToSave as Partial<MentionDoc>).url;
  }
  return addDoc(collectionRef, dataToSave).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: collectionRef.path,
      operation: 'create',
      requestResourceData: dataToSave,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function updateMention(firestore: Firestore, id: string, data: Partial<MentionDoc>) {
  const docRef = doc(firestore, "mentions", id);
  const dataToUpdate: { [key: string]: any } = { ...data };

  if (dataToUpdate.type === 'digital') {
      dataToUpdate.content = undefined; 
  } else if (dataToUpdate.type === 'traditional') {
      dataToUpdate.url = undefined;
  }
  
  // Clean object from undefined values before sending to Firestore
  Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

  return updateDoc(docRef, dataToUpdate).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function deleteMention(firestore: Firestore, id: string) {
    const docRef = doc(firestore, "mentions", id);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

// Admins
export function addAdmin(firestore: Firestore, data: AdminUserDoc) {
  const docRef = doc(firestore, "admins", data.uid);
  return setDoc(docRef, data).catch((serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export function deleteAdmin(firestore: Firestore, uid: string) {
    const docRef = doc(firestore, "admins", uid);
    return deleteDoc(docRef).catch((serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}
