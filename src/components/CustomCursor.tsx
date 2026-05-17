"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  '[role="button"]',
  "input",
  "textarea",
  "select",
  '[data-cursor="interactive"]',
].join(",");

const FOLLOW_EASING = 0.18;

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const targetPositionRef = useRef({ x: 0, y: 0 });
  const currentPositionRef = useRef({ x: 0, y: 0 });
  const hasPositionRef = useRef(false);
  const visibleRef = useRef(false);
  const interactiveRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const [isSupported, setIsSupported] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const syncSupport = () => {
      const nextSupport =
        finePointerQuery.matches && !reducedMotionQuery.matches;

      setIsSupported(nextSupport);

      if (!nextSupport) {
        hasPositionRef.current = false;
        visibleRef.current = false;
        interactiveRef.current = false;
        setIsVisible(false);
        setIsInteractive(false);
      }
    };

    syncSupport();
    finePointerQuery.addEventListener("change", syncSupport);
    reducedMotionQuery.addEventListener("change", syncSupport);

    return () => {
      finePointerQuery.removeEventListener("change", syncSupport);
      reducedMotionQuery.removeEventListener("change", syncSupport);
    };
  }, []);

  useEffect(() => {
    if (!isSupported) {
      document.documentElement.classList.remove("custom-cursor-enabled");
      return;
    }

    document.documentElement.classList.add("custom-cursor-enabled");

    const setVisible = (nextVisible: boolean) => {
      if (visibleRef.current === nextVisible) return;

      visibleRef.current = nextVisible;
      setIsVisible(nextVisible);
    };

    const setInteractive = (nextInteractive: boolean) => {
      if (interactiveRef.current === nextInteractive) return;

      interactiveRef.current = nextInteractive;
      setIsInteractive(nextInteractive);
    };

    const updateInteractiveState = (target: EventTarget | null) => {
      const nextInteractive =
        target instanceof Element &&
        Boolean(target.closest(INTERACTIVE_SELECTOR));

      setInteractive(nextInteractive);
    };

    const onPointerMove = (event: PointerEvent) => {
      targetPositionRef.current = { x: event.clientX, y: event.clientY };

      if (!hasPositionRef.current) {
        currentPositionRef.current = targetPositionRef.current;
        hasPositionRef.current = true;
      }

      setVisible(true);
      updateInteractiveState(event.target);
    };

    const onPointerEnter = (event: PointerEvent) => {
      targetPositionRef.current = { x: event.clientX, y: event.clientY };

      if (!hasPositionRef.current) {
        currentPositionRef.current = targetPositionRef.current;
        hasPositionRef.current = true;
      }

      setVisible(true);
      updateInteractiveState(event.target);
    };

    const onPointerLeave = () => {
      setVisible(false);
      setInteractive(false);
    };

    const animate = () => {
      const cursor = cursorRef.current;

      if (cursor && hasPositionRef.current) {
        const current = currentPositionRef.current;
        const target = targetPositionRef.current;

        current.x += (target.x - current.x) * FOLLOW_EASING;
        current.y += (target.y - current.y) * FOLLOW_EASING;

        cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0)`;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerenter", onPointerEnter);
    window.addEventListener("pointerleave", onPointerLeave);
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerenter", onPointerEnter);
      window.removeEventListener("pointerleave", onPointerLeave);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      document.documentElement.classList.remove("custom-cursor-enabled");
    };
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="custom-cursor"
      data-visible={isVisible}
      data-interactive={isInteractive}
    />
  );
}
