'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const useCollection = <T extends DocumentData>(
  q: Query<DocumentData> | null
) => {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const memoizedQuery = useMemo(() => q, [q?.path, q?.converter]);

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(documents);
        setIsLoading(false);
        setError(null);
      },
      (serverError: FirestoreError) => {
        console.error('Error fetching collection:', serverError);
        setError(serverError);
        setIsLoading(false);

        const permissionError = new FirestorePermissionError({
          path: memoizedQuery.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, isLoading, error };
};
