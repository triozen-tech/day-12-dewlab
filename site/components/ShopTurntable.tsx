"use client";

import { useEffect, useRef, useState } from "react";
import { isRecording, prefersReducedMotion } from "@/lib/gsap";
import type { Product } from "../content";

/** Blender turntable (48 frames, 360°, transparent glass) drawn on a canvas. Neighbour frames are blended (lesson 2),
 *  so the slow auto-spin is continuous, never stepped. Drag turns it; the auto-spin resumes after a pause.
 *  ?static=1 (and until the frames are in) shows the still render. */
const FRAMES = 48;
const SPIN_SECS = 14; // one full turn while idle
const ZOOM = 1.18; // the frames are framed loosely: draw them a little larger so the product fills the disc
const cache = new Map<string, HTMLImageElement[]>();

function load(dir: string): Promise<HTMLImageElement[]> {
  if (cache.has(dir)) return Promise.resolve(cache.get(dir)!);
  const imgs = Array.from({ length: FRAMES }, (_, i) => {
    const im = new Image();
    im.decoding = "async";
    im.src = `${dir}/${String(i).padStart(2, "0")}.webp`;
    return im;
  });
  return Promise.all(imgs.map((im) => im.decode().catch(() => {}))).then(() => (cache.set(dir, imgs), imgs));
}

export default function ShopTurntable({ product, near }: { product: Product; near: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const angle = useRef(0); // in frames (0..48)
  const drag = useRef<{ x: number; a: number } | null>(null);
  const idleAt = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || !near) return;
    let raf = 0;
    let alive = true;
    let imgs: HTMLImageElement[] = [];
    let onScreen = true;
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting), { rootMargin: "100px" });
    if (canvas.current) io.observe(canvas.current);
    setReady(false);
    load(product.frames).then((list) => {
      if (!alive) return;
      imgs = list;
      setReady(true);
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const spin = isRecording() ? SPIN_SECS * 0.3 : SPIN_SECS; // a little faster on camera: a slow glass turn reads as still
        if (!drag.current && now > idleAt.current) angle.current = (angle.current + (dt * FRAMES) / spin) % FRAMES;
        if (onScreen) draw(); // no drawing off screen
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    const draw = () => {
      const c = canvas.current;
      if (!c || !imgs.length) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth * dpr;
      const h = c.clientHeight * dpr;
      if (c.width !== w || c.height !== h) ((c.width = w), (c.height = h));
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      const a = ((angle.current % FRAMES) + FRAMES) % FRAMES;
      const i0 = Math.floor(a);
      const f = a - i0;
      const dw = w * ZOOM, dh = h * ZOOM, dx = (w - dw) / 2, dy = (h - dh) / 2;
      ctx.globalAlpha = 1;
      ctx.drawImage(imgs[i0], dx, dy, dw, dh);
      if (f > 0.001) {
        ctx.globalAlpha = f;
        ctx.drawImage(imgs[(i0 + 1) % FRAMES], dx, dy, dw, dh);
      }
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [product.frames, near]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, a: angle.current };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    angle.current = drag.current.a - (e.clientX - drag.current.x) / 9; // ~9 px per frame (7.5°)
  };
  const onUp = () => {
    drag.current = null;
    idleAt.current = performance.now() + 1600;
  };

  return (
    <div className="absolute inset-0">
      {/* soft contact shadow under the product's base (no hard line) */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 h-[46px] w-[42%] -translate-x-1/2 rounded-[50%] bg-[rgba(15,42,46,0.32)] blur-[14px]"
        style={{ top: `calc(${(0.5 + (product.base - 0.5) * ZOOM) * 100}% - 20px)` }}
      />
      {/* the turntable's own first frame: same framing as the spin, so the hand-over never jumps (also ?static=1) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${product.frames}/00.webp`}
        alt={product.name}
        className={`absolute inset-0 h-full w-full scale-[1.18] object-contain transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        draggable={false}
      />
      <canvas
        ref={canvas}
        className={`absolute inset-0 h-full w-full touch-none select-none transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"} cursor-grab active:cursor-grabbing`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        data-cursor="Drag"
        aria-label={`${product.name}, drag to turn`}
        role="img"
      />
    </div>
  );
}
