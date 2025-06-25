'use client';

import type React from 'react';

import { ExtensionProxyProofsProvider } from '@/context/reclaim';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='light'
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ExtensionProxyProofsProvider>
          {children}
        </ExtensionProxyProofsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
