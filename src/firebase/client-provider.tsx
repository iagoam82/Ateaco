'use client';

import { ReactNode } from 'react';
import { initializeFirebase, FirebaseProvider, type FirebaseContextValue } from '.';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

// Initialize Firebase once outside of the component render cycle.
const services = initializeFirebase();

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  return <FirebaseProvider value={services}>{children}</FirebaseProvider>;
}
