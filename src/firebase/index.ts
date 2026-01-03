import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from "firebase/storage";

import { firebaseConfig } from '../firebase/config';

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

let services: FirebaseServices | null = null;

function initializeFirebase(): FirebaseServices {
  if (services) {
    return services;
  }

  let app: FirebaseApp;
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase initialization failed', e);
      throw new Error('Firebase initialization failed');
    }
  } else {
    app = getApp();
  }
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  services = { app, auth, firestore, storage };
  return services;
}

export { initializeFirebase };
export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './error-emitter';
export * from './errors';
