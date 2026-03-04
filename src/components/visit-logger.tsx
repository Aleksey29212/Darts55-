'use client';

import { useEffect, useRef } from 'react';
import { logVisitAction } from '@/app/actions';

const SESSION_KEY = 'dartbrig_pro_visit_logged';

export function VisitLogger() {
  const hasLogged = useRef(false);

  useEffect(() => {
    // Ensure this only runs once per component mount
    if (hasLogged.current) {
      return;
    }
    hasLogged.current = true;

    try {
      const visitLogged = sessionStorage.getItem(SESSION_KEY);
      if (!visitLogged) {
        // The server action handles bot detection from headers.
        // We call it without waiting to avoid blocking.
        logVisitAction();
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    } catch (e) {
      // sessionStorage might not be available (e.g., in private browsing mode or on server)
      console.error('Could not log visit:', e);
    }
  }, []); // Empty dependency array ensures this runs only once client-side

  return null;
}
