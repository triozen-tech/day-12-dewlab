"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/** Restyled from components/ui/Magnetic: a calm pull toward the pointer (power3, never elastic: no bounce on this site),
 *  the label leaning a little further than the button. Hands-free on camera: RecordPointer moves the real pointer path. */
export default function DewMagnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current!;
    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => (xTo(0), yTo(0));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    // RecordPointer (camera) nudges magnets with a synthetic event
    const nudge = (e: Event) => {
      const { dx, dy } = (e as CustomEvent<{ dx: number; dy: number }>).detail;
      xTo(dx * strength);
      yTo(dy * strength);
    };
    el.addEventListener("dew:nudge", nudge);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("dew:nudge", nudge);
    };
  }, [strength]);

  return (
    <span ref={ref} data-magnetic className="inline-block">
      {children}
    </span>
  );
}
