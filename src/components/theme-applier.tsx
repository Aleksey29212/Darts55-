
'use client';

import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ThemeSettings } from '@/lib/types';
import { DEFAULT_THEME } from '@/lib/settings';

/**
 * Client component that applies CSS theme variables from Firestore to the document root.
 * This enables real-time theme changes across all production clients.
 */
export function ThemeApplier({ initialTheme }: { initialTheme: ThemeSettings }) {
  const db = useFirestore();
  const themeDocRef = useMemoFirebase(() => db ? doc(db, 'app_settings', 'theme') : null, [db]);
  const { data: themeData } = useDoc<ThemeSettings>(themeDocRef);

  const activeTheme = themeData || initialTheme || DEFAULT_THEME;

  useEffect(() => {
    if (!activeTheme) return;

    const root = document.documentElement;
    const variables = {
      '--background': activeTheme.background,
      '--foreground': activeTheme.foreground,
      '--primary': activeTheme.primary,
      '--accent': activeTheme.accent,
      '--gold': activeTheme.gold,
      '--silver': activeTheme.silver,
      '--bronze': activeTheme.bronze,
      // Also update some derivative variables for best look
      '--card': activeTheme.background,
      '--popover': activeTheme.background,
      '--ring': activeTheme.primary,
    };

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [activeTheme]);

  return null;
}
