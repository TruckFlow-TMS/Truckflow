import { useEffect, useState } from 'react';

/**
 * The CSS animations on this page are disabled by a media query, but SMIL
 * (`animateMotion`) ignores CSS entirely — animated nodes have to be withheld
 * from the tree instead. Watched rather than read once, so toggling the OS
 * setting takes effect without a reload.
 *
 * Same pattern as the hook in LoginView; extracted here so the landing page
 * and its diagram share one implementation.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
