"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { ripple } from "../content";
import DewBeads from "./DewBeads";

/** SY08 restyled as "The Ripple" (signature, M562). The pane pins for ~2.5 screens; the drop's impact sends three strong
 *  rings out from the centre (scroll = time since impact, so it scrubs both ways). The title lies UNDER the water: each
 *  ring bends it as it passes, and the inside of each new ring front carries the next chapter (One drop. → Three depths.
 *  → All-day dew.). A net of caustic light crawls on the clock, so the pinned stage is never still (lesson 9).
 *  The CSS surface + DOM title stay underneath as the fallback (and the ?static=1 final state). */

const CENTRE = { x: 0.5, y: 0.42 }; // impact point (uv, y up) = the DOM anchor at 58 % from the top
const LAUNCH = [0.06, 0.36, 0.66]; // scroll progress at which each ring leaves the centre

const FRAG = /* glsl */ `
uniform vec2 uC;
uniform vec3 uK;
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
// distance between the two nearest cell points: small along cell edges -> a net of light (our caustic)
float cellEdge(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash2(i + g);
    o = 0.5 + 0.42 * sin(t * 0.55 + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
float caustic(vec2 p, float t) {
  vec2 w = p + 0.35 * vec2(sin(p.y * 1.3 + t * 0.4), cos(p.x * 1.1 - t * 0.35)); // warp: wobbly, liquid cells
  float a = 1.0 - smoothstep(0.0, 0.22, cellEdge(w, t));
  float b = 1.0 - smoothstep(0.0, 0.18, cellEdge(w * 1.6 + vec2(3.1, 1.7), t * 1.2));
  return a * a * a * 0.6 + b * b * b * 0.4;
}
// one wave packet around a ring front: height and its slope along r
float ringH(float r, float f, float a) { float d = r - f; return a * sin(d * 70.0) * exp(-d * d * 140.0); }
float ringD(float r, float f, float a) { float d = r - f; return a * exp(-d * d * 140.0) * (70.0 * cos(d * 70.0) - 280.0 * d * sin(d * 70.0)); }

// a smooth lens bump around the ring front: one gentle swell (no oscillation), ~0.9 % of the screen at most
float lensBend(float r, float f) { float d = r - f; return 0.009 * sin(d * 9.0) * exp(-d * d * 22.0); }

void main() {
  float asp = uRes.x / uRes.y;
  vec2 uv = vUv;
  vec2 q = uv - uC; q.x *= asp;
  float r = length(q);
  vec2 dir = r > 1e-4 ? q / r : vec2(0.0);
  float SPEED = 3.4;
  float dh = 0.0, crest = 0.0;
  float f0 = (uProgress - uK.x) * SPEED, f1 = (uProgress - uK.y) * SPEED, f2 = (uProgress - uK.z) * SPEED;
  if (f0 > 0.0) { float a = 0.0009 / (1.0 + f0 * 2.2); dh += ringD(r, f0, a); crest += ringH(r, f0, a); }
  if (f1 > 0.0) { float a = 0.0008 / (1.0 + f1 * 2.2); dh += ringD(r, f1, a); crest += ringH(r, f1, a); }
  if (f2 > 0.0) { float a = 0.0008 / (1.0 + f2 * 2.2); dh += ringD(r, f2, a); crest += ringH(r, f2, a); }
  // the surface is never perfectly still: a slow, faint swell on the clock
  vec2 life = 0.0016 * vec2(sin(uv.y * 23.0 + uTime * 0.9), cos(uv.x * 19.0 - uTime * 0.8));
  vec2 off = vec2(dir.x / asp, dir.y) * dh * 1.15 + life;

  // the title under the water bends like a soft lens as each ring passes: its own LOW-frequency, low-strength wave
  // (slope well under 1 px per px, so strokes never fold or tear; every word stays readable)
  float lens = 0.0;
  if (f0 > 0.0) lens += lensBend(r, f0) / (1.0 + f0 * 1.5);
  if (f1 > 0.0) lens += lensBend(r, f1) / (1.0 + f1 * 1.5);
  if (f2 > 0.0) lens += lensBend(r, f2) / (1.0 + f2 * 1.5);
  vec2 tuv = uv + vec2(dir.x / asp, dir.y) * lens + life * 0.4;
  float t0 = texture2D(uTex0, tuv).a, t1 = texture2D(uTex1, tuv).a, t2 = texture2D(uTex2, tuv).a;
  // each ring swaps the title in two steps (lesson 85): the old title sinks away as the ring crosses it, THEN the
  // next one rises; two words never overlap. The ring's refraction carries both moves.
  float out1 = smoothstep(uK.y + 0.02, uK.y + 0.07, uProgress), in1 = smoothstep(uK.y + 0.07, uK.y + 0.12, uProgress);
  float out2 = smoothstep(uK.z + 0.02, uK.z + 0.07, uProgress), in2 = smoothstep(uK.z + 0.07, uK.z + 0.12, uProgress);
  float title = t0 * (1.0 - out1) + t1 * in1 * (1.0 - out2) + t2 * in2;

  // water: sea-glass, lighter where the light falls, caustics bent by the rings
  vec3 deep = vec3(0.792, 0.886, 0.858), shallow = vec3(0.905, 0.953, 0.937);
  vec3 col = mix(deep, shallow, clamp(uv.y * 0.75 + 0.35 - r * 0.25, 0.0, 1.0));
  float c = caustic((uv + off * 2.2) * vec2(asp, 1.0) * 2.6, uTime * 0.5);
  col += c * 0.08;
  vec3 ink = vec3(0.235, 0.349, 0.357);
  col = mix(col, ink, title * 0.8);
  col += c * title * 0.07;
  // ring crests catch the light, troughs shade a little
  col += vec3(1.0) * clamp(dh * 14.0, 0.0, 1.0) * 0.32;
  col -= vec3(0.05, 0.07, 0.07) * clamp(-dh * 14.0, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

/** One chapter title, drawn like the DOM title, onto a canvas with the stage's aspect (sampled at the same uv). */
function titleCanvas(text: string, w: number, h: number) {
  const c = document.createElement("canvas");
  const H = 1024;
  c.height = H;
  c.width = Math.round((H * w) / h);
  const ctx = c.getContext("2d")!;
  let size = Math.round((210 / h) * H);
  ctx.font = `400 ${size}px Gloock`;
  const max = c.width * 0.86;
  const tw = ctx.measureText(text).width;
  if (tw > max) size = Math.floor((size * max) / tw);
  ctx.font = `400 ${size}px Gloock`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(text, c.width / 2, H * (0.34 + (105 / h)));
  return c;
}

export default function Ripple() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let gl: GLHandle | null = null;
    let st: ScrollTrigger | undefined;
    let alive = true;
    const setChapter = (p: number) => {
      const k = p >= LAUNCH[2] + 0.08 ? 2 : p >= LAUNCH[1] + 0.08 ? 1 : 0; // as the next title rises (shader: in1/in2)
      list.current?.querySelectorAll("li").forEach((li, i) => li.toggleAttribute("data-on", i === k));
    };
    (async () => {
      await document.fonts.load("400 200px Gloock");
      const box = stage.current!.getBoundingClientRect();
      const tex = ripple.chapters.map((c) => titleCanvas(c.title, box.width, box.height));
      gl = await createShader(canvas.current!, FRAG, {
        textures: tex,
        uniforms: { uC: { value: [CENTRE.x, CENTRE.y] }, uK: { value: LAUNCH } },
        dpr: 1.5,
      });
      if (!alive || !gl) return;
      section.current!.setAttribute("data-gl", "on"); // hides the DOM title once the water draws it
      st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom 140%", // the rings finish before the actives pane slides over the last 40vh (X1)
        onUpdate: (s) => {
          gl!.uniforms.uProgress.value = s.progress;
          setChapter(s.progress);
        },
      });
      setChapter(0);
    })();
    return () => {
      alive = false;
      st?.kill();
      gl?.destroy();
    };
  }, []);

  const [first] = ripple.chapters;
  return (
    <section ref={section} className="pane pane-sea pane-clip relative h-[290vh]" data-section="ripple" aria-label="The ripple" data-record-time="2.0" data-record-label="Ripple">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-screen" data-record-time="6.2" data-record-label="Ripple end" />
      <DewBeads beads={[[12, 10], [38, 15], [56, 9], [84, 13]]} />
      <div ref={stage} className="sticky top-0 h-screen overflow-hidden" data-ripple-stage>
        {/* CSS surface + DOM title: the fallback and the ?static=1 state; the WebGL water covers them when it runs */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_58%,rgba(255,255,255,0.65),rgba(255,255,255,0)_70%)]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1400 860" preserveAspectRatio="xMidYMid slice">
            {[90, 190, 310, 450, 610].map((r, i) => (
              <ellipse key={r} cx="700" cy="500" rx={r} ry={r * 0.36} fill="none" stroke="#fff" strokeOpacity={0.55 - i * 0.09} strokeWidth={1.4} />
            ))}
          </svg>
        </div>
        <h2 className="dw-display ripple-dom-title pointer-events-none absolute inset-x-0 top-[34%] text-center text-[210px] leading-none text-[var(--ink)] opacity-[0.62] mix-blend-multiply [filter:blur(0.6px)]" data-ripple-title>
          {first.title}
        </h2>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" aria-hidden="true" />
        {/* the drop's impact point (anchor) */}
        <span data-drop-anchor="ripple-centre" className="absolute left-1/2 top-[58%] h-0 w-0" />

        {/* chapter list: a real sequence of three, the current one bright */}
        <ol ref={list} className="ripple-chapters absolute bottom-14 right-16 w-[470px] space-y-4" data-ripple-chapters>
          {ripple.chapters.map((c, i) => (
            <li key={c.title} className="flex items-baseline gap-4" data-on={i === 0 ? "" : undefined}>
              <span className="dw-display shrink-0 whitespace-nowrap text-[30px] leading-tight">{c.title}</span>
              <span className="text-[16px] font-[500]">{c.caption}</span>
            </li>
          ))}
        </ol>
        <p className="dw-label absolute bottom-14 left-16">One drop · three depths of water</p>
      </div>
    </section>
  );
}
