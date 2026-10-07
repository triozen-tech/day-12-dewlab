"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, isRecording, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { shop } from "../content";
import DewBeads from "./DewBeads";
import Drop from "./Drop";
import ShopTurntable from "./ShopTurntable";
import DewMagnetic from "./DewMagnetic";

/** PS04 restyled + M452 (depth stack, next comes forward): the selected product as a Blender turntable on a big sea-glass
 *  disc (C8) + the buy box. Switching product: the current one recedes into depth, then the next comes forward from
 *  behind; the name clip-wipes in whole (lesson 85). Add to bag: a drop arcs from the button into the nav Bag and the
 *  count bumps (F8). In ?record=1 a hands-free script plays it once (lesson 75): Mist → Serum → 50 ml → Add to bag,
 *  with a soft touch ring that follows each target LIVE (lesson 83). Normal mode: nothing moves by itself. */

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2] as const;
};

export default function Shop() {
  const [sel, setSel] = useState(0);
  const [size, setSize] = useState(1);
  const [qty, setQty] = useState(1);
  const p = shop.products[sel];
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const product = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const chips = useRef<HTMLDivElement>(null);
  const chipBead = useRef<HTMLSpanElement>(null);
  const price = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  const selRef = useRef(0);
  selRef.current = sel;
  const busy = useRef(false);

  // the frames only load when the shop is near the screen (lesson 3: no loading burst during the cinematic sections)
  useEffect(() => {
    if (!stage.current) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "120% 0px" });
    io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  // M452: the incoming product comes forward from behind; the name wipes in whole
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    gsap.fromTo(product.current, { scale: 0.8, opacity: 0, filter: "blur(6px)", yPercent: -3 }, { scale: 1, opacity: 1, filter: "blur(0px)", yPercent: 0, duration: 0.8, ease: "power3.out" });
    // whole titles only: the new name fades up complete (a left-to-right wipe briefly showed a lone "D")
    gsap.fromTo(name.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", delay: 0.04 });
  }, [sel]);

  const choose = (i: number) => {
    if (i === selRef.current || busy.current) return;
    if (prefersReducedMotion()) return (setSel(i), setSize(0));
    busy.current = true;
    // the current product recedes into depth, its name lifts out (0.1 s), THEN the next one comes in
    gsap.to(name.current, { opacity: 0, y: -6, duration: 0.12, ease: "power2.in" });
    gsap.to(product.current, {
      scale: 0.9,
      opacity: 0,
      filter: "blur(4px)",
      yPercent: 2,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(name.current, { opacity: 1, y: 0 });
        setSel(i);
        setSize(0);
        busy.current = false;
      },
    });
  };

  // F8: a drop arcs from the Add button into the nav Bag (target read live, lesson 83); the count bumps
  const addToBag = (from: Element) => {
    const bag = document.querySelector("[data-bag]");
    const count = document.querySelector<HTMLElement>("[data-bag-count]");
    const f = flyer.current;
    if (!bag || !count || !f) return;
    const bump = () => {
      count.textContent = String(Number(count.textContent || "0") + qty);
      bag.setAttribute("aria-label", `Bag, ${count.textContent} items`);
      gsap.fromTo(count, { scale: 1 }, { scale: 1.35, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" });
      gsap.fromTo(bag, { scale: 1 }, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
    };
    if (prefersReducedMotion()) return bump();
    gsap.fromTo(from, { scale: 1 }, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
    const [x0, y0] = center(from);
    const st = { t: 0 };
    gsap.set(f, { opacity: 1 });
    gsap.to(st, {
      t: 1,
      duration: 0.95,
      ease: "power1.inOut",
      onUpdate: () => {
        const [x1, y1] = center(bag);
        const k = st.t;
        const x = x0 + (x1 - x0) * k;
        const y = y0 + (y1 - y0) * k - 180 * Math.sin(Math.PI * k);
        gsap.set(f, { x: x - 14, y: y - 18, scale: 1 - 0.45 * k });
      },
      onComplete: () => {
        gsap.set(f, { opacity: 0 });
        bump();
      },
    });
  };

  // ?record=1 only: the hands-free demo, started by the section coming into view (not the hold event, lesson 75)
  useEffect(() => {
    if (!isRecording() || prefersReducedMotion()) return;
    const sec = section.current!;
    const r = ring.current!;
    let tl: gsap.core.Timeline | undefined;
    const pos = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.9 };
    let target: Element | null = null;
    const follow = () => {
      if (!target) return;
      gsap.set(r, { x: pos.x - 22, y: pos.y - 22 });
    };
    const glide = (sel: string, dur = 0.55) => {
      const st = { k: 0 };
      const sx = pos.x, sy = pos.y;
      return gsap.to(st, {
        k: 1,
        duration: dur,
        ease: "power2.inOut",
        onStart: () => void (target = sec.querySelector(sel)),
        onUpdate: () => {
          const el = sec.querySelector(sel);
          if (!el) return;
          const [tx, ty] = center(el);
          pos.x = sx + (tx - sx) * st.k;
          pos.y = sy + (ty - sy) * st.k;
          follow();
        },
      });
    };
    const press = (sel: string, fn: (el: Element) => void) =>
      gsap
        .timeline()
        .to(r, { scale: 0.8, duration: 0.08, ease: "power2.in" })
        .add(() => {
          const el = sec.querySelector(sel);
          if (el) fn(el);
        })
        .to(r, { scale: 1, duration: 0.18, ease: "power2.out" });
    // stay on the moving target between moves (the page keeps scrolling under it)
    const ticker = () => {
      if (!target || gsap.isTweening(pos)) return;
      const [tx, ty] = center(target);
      pos.x = tx;
      pos.y = ty;
      follow();
    };

    setSize(0);
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.ticker.add(ticker);
        tl = gsap
          .timeline({ onComplete: () => gsap.to(r, { opacity: 0, duration: 0.4, onComplete: () => gsap.ticker.remove(ticker) }) })
          .set(r, { x: pos.x - 22, y: pos.y - 22 })
          .to(r, { opacity: 1, duration: 0.3 })
          .add(glide('[data-shop-tab="mist"]', 0.6))
          .add(press('[data-shop-tab="mist"]', () => choose(1)))
          .add(glide('[data-shop-tab="serum"]', 0.6)) // the mist spray is round: a long dwell on it reads as still
          .add(press('[data-shop-tab="serum"]', () => choose(0)))
          .add(glide('[data-shop-size="50 ml"]', 0.8), "+=0.1")
          .add(press('[data-shop-size="50 ml"]', () => setSize(1)))
          .add(glide("[data-add-to-bag]", 0.7))
          .add(() => sec.querySelector("[data-add-to-bag]")?.classList.add("is-demo"), "-=0.25") // the hover fill shows on camera
          .add(press("[data-add-to-bag]", (el) => addToBag(el)))
          .add(() => sec.querySelector("[data-add-to-bag]")?.classList.remove("is-demo"), "+=0.9");
      },
    });
    return () => {
      st.kill();
      tl?.kill();
      gsap.ticker.remove(ticker);
    };
    // the script reads choose/addToBag through refs to the live DOM; it must only be built once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sz = p.sizes[Math.min(size, p.sizes.length - 1)];

  // the dark bead slides to the chosen size chip; the price gives a small bump when it changes
  useEffect(() => {
    const on = chips.current?.querySelector<HTMLElement>('.chip[aria-pressed="true"]');
    if (!on || !chipBead.current) return;
    const vars = { x: on.offsetLeft, width: on.offsetWidth };
    if (prefersReducedMotion()) gsap.set(chipBead.current, vars);
    else gsap.to(chipBead.current, { ...vars, duration: 0.45, ease: "power3.out" });
  }, [sel, size]);
  const firstPrice = useRef(true);
  useEffect(() => {
    if (firstPrice.current) return void (firstPrice.current = false);
    if (prefersReducedMotion() || !price.current) return;
    gsap.fromTo(price.current, { scale: 1 }, { scale: 1.06, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "0% 60%" });
  }, [sz.price]);

  return (
    <section ref={section} id="shop" className="pane relative z-[5] px-[72px] pb-[80px] pt-[96px]" data-section="shop" data-record-time="2.0" data-record-hold="3.6" data-record-offset="-24" data-record-label="Shop">
      <DewBeads beads={[[7, 10], [36, 14], [58, 9], [93, 12]]} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,560px)] items-center gap-16">
        {/* stage: sea-glass disc + product */}
        <div ref={stage} className="relative aspect-square w-full max-w-[640px]">
          <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_42%_32%,#ffffff,#e4f2ee_42%,var(--sea)_70%,var(--sea-deep))] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.9),inset_0_-30px_60px_-20px_rgba(15,42,46,0.18),0_50px_90px_-50px_rgba(15,42,46,0.5)]" />
          <span className="dw-glide-light dw-glide-sea" style={{ inset: "6%", borderRadius: "50%", zIndex: 0 }} aria-hidden="true" />
          <span className="bead-shine !left-[18%] !top-[12%]" aria-hidden="true" />
          <span data-drop-anchor="shop-disc" className="absolute bottom-[24%] right-[20%] h-0 w-0" />
          <div ref={product} className="absolute inset-0">
            <ShopTurntable key={p.key} product={p} near={near} />
          </div>
        </div>

        {/* buy box */}
        <div>
          <div className="flex gap-8" role="tablist" aria-label="Products">
            {shop.products.map((x, i) => (
              <button key={x.key} type="button" role="tab" aria-selected={i === sel} className="tab" onClick={() => choose(i)} data-shop-tab={x.key}>
                {x.tab}
              </button>
            ))}
          </div>
          <h2 ref={name} className="dw-display mt-8 text-[64px] text-[var(--ink)]" data-shop-name>
            {p.name}
          </h2>
          <p className="mt-3 flex items-center gap-3 text-[16px] text-[var(--muted-ink)]">
            <span className="tracking-[2px] text-[var(--apricot)]" aria-label="5 out of 5">
              ★★★★★
            </span>
            {shop.rating.text}
          </p>
          <p className="dw-body mt-5 min-h-[56px] max-w-[500px]">{p.copy}</p>

          <dl className="mt-7 divide-y divide-[rgba(15,42,46,0.1)] border-y border-[rgba(15,42,46,0.1)]">
            {p.specs.map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 text-[16px]">
                <dt className="text-[var(--muted-ink)]">{k}</dt>
                <dd className="font-[600] text-[var(--ink)]">{v}</dd>
              </div>
            ))}
          </dl>

          <div ref={chips} className="chip-track mt-7 flex min-h-[48px] flex-wrap items-center gap-3">
            <span ref={chipBead} className="chip-bead" aria-hidden="true" />
            {p.sizes.map((s, i) => (
              <button key={s.label} type="button" className="chip" aria-pressed={i === Math.min(size, p.sizes.length - 1)} onClick={() => setSize(i)} data-shop-size={s.label}>
                {s.label}
                <span className="dw-num opacity-70">{s.price}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="chip !gap-0 !px-1">
                <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-[22px]" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One less">
                  −
                </button>
                <span className="dw-num w-8 text-center text-[18px]">{qty}</span>
                <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-[22px]" onClick={() => setQty((q) => q + 1)} aria-label="One more">
                  +
                </button>
              </div>
              <span ref={price} className="dw-num inline-block text-[48px] font-[650] tracking-[-0.02em] text-[var(--ink)]" data-shop-price>
                {sz.price}
              </span>
            </div>
            <DewMagnetic>
              <button type="button" className="dw-btn !h-[60px] !px-8 !text-[17px]" data-add-to-bag onClick={(e) => addToBag(e.currentTarget)}>
                {shop.cta}
                <span className="dw-btn-dot" aria-hidden="true" />
              </button>
            </DewMagnetic>
          </div>
        </div>
      </div>

      {/* X3 · the bottom edge bows down under the drop as it leaves (drawn by Transitions) */}
      <svg data-bow className="pointer-events-none absolute inset-x-0 top-full h-[60px] w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
        <path d="" fill="#f7faf9" />
      </svg>
      {/* F8 flyer + the record-mode touch ring live in fixed layers above the page */}
      <div ref={flyer} className="pointer-events-none fixed left-0 top-0 z-[60] opacity-0" aria-hidden="true">
        <Drop shape="bead" size={28} id="flyer" />
      </div>
      <div ref={ring} className="dw-touch pointer-events-none fixed left-0 top-0 z-[61] h-11 w-11 rounded-full opacity-0" aria-hidden="true" />
    </section>
  );
}
