'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const useDoc = <T extends DocumentData>(
  ref: DocumentReference<DocumentData> | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const memoizedRef = useMemo(() => ref, [ref?.path, ref?.converter]);

  useEffect(() => {
    if (!memoizedRef) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const documentData = {
            id: snapshot.id,
            ...snapshot.data(),
          } as T;
          setData(documentData);
        } else {
          setData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (serverError: FirestoreError) => {
        console.error('Error fetching document:', serverError);
        setError(serverError);
        setIsLoading(false);

        const permissionError = new FirestorePermissionError({
            path: memoizedRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedRef]);

  return { data, isLoading, error };
};
