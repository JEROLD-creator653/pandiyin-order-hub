import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/metaPixel';

/**
 * ScrollToTop Component
 * Scrolls to top and fires a Meta Pixel PageView on every client-side route change.
 * The initial PageView is already fired by the inline pixel script in index.html,
 * so we skip the first pathname to avoid duplicates.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
}

