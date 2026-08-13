import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets the window scroll to the top whenever the URL changes — including
 * search-string changes (so jumping from `/` → `/?destination=...` also
 * scrolls to top, not just pathname changes).
 *
 * Also disables the browser's automatic scroll restoration so cold loads at a
 * scrolled-deep URL don't restore the previous session's scroll position.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  // Disable browser-level scroll restoration once on mount. We own this.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Defer one tick so freshly mounted route content has a chance to lay out
    // before we scroll (otherwise some content can re-flow and re-scroll us).
    const id = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      // Belt-and-braces for any nested scroll containers on routes that use
      // their own scroll viewport (none today, harmless if so).
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname, search]);

  return null;
}
