'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

interface MobileContextType {
  isMobile: boolean;
  isForcedMobile: boolean;
  setIsForcedMobile: (val: boolean) => void;
}

const MobileContext = createContext<MobileContextType | null>(null);

/**
 * MobileProvider manages the mobile state, including manual overrides.
 */
export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobileWindow, setIsMobileWindow] = useState(false);
  const [isForcedMobile, setIsForcedMobile] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    const checkIsMobile = () => {
      setIsMobileWindow(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on mount
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const value = {
    isMobile: isForcedMobile || isMobileWindow,
    isForcedMobile,
    setIsForcedMobile,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}

/**
 * Hook to check if the current view should be mobile.
 * Respects both window size and forced manual override.
 */
export function useIsMobile() {
  const context = useContext(MobileContext);
  // Return context.isMobile if available, otherwise fallback to false (safari/server safety)
  return context ? context.isMobile : false;
}

/**
 * Hook to control the forced mobile mode.
 */
export function useMobileControl() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobileControl must be used within a MobileProvider');
  }
  return context;
}
