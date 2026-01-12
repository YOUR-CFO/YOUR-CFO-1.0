'use client';

import { AuthProvider as JWTAuthProvider } from '@/lib/auth/auth-context';
import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <JWTAuthProvider>{children}</JWTAuthProvider>;
}