import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface AosProviderProps {
  children: React.ReactNode;
}

let initialized = false;

/**
 * Initializes Animate-On-Scroll once for the whole app. AOS auto-detects new
 * elements with [data-aos] attributes via its built-in MutationObserver, so no
 * per-route refresh is required.
 *
 * Honours prefers-reduced-motion via AOS's `disable` option.
 */
export default function AosProvider({ children }: AosProviderProps) {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      delay: 0,
      disable: prefersReducedMotion,
      anchorPlacement: 'top-bottom',
    });
  }, []);

  return <>{children}</>;
}
