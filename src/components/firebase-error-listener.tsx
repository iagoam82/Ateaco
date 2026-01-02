'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client component that listens for permission errors
// and throws them to be caught by the Next.js error overlay.
// This provides a better debugging experience than just logging to the console.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: any) => {
      // We throw the error here to make it visible in the Next.js error overlay.
      // This is only for development and should be handled gracefully in production.
      setTimeout(() => {
        throw error;
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
