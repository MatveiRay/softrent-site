"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Expose lenis on window so modals can stop/start it.
declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    window.__lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}

/**
 * Pause Lenis smooth scroll while `active` is true (e.g. when a modal is open).
 * Lenis driver bypasses `overflow: hidden`, so we have to explicitly stop it.
 */
export function useLockLenis(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const lenis = window.__lenis;
    if (!lenis) return;
    lenis.stop();
    return () => {
      lenis.start();
    };
  }, [active]);
}
