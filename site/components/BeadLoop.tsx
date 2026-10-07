"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { createShader, loadImage, type GLHandle } from "@/lib/gl";

/** A seamless code loop inside an ingredient bead (lesson 91: no Veo loops; the still + a small shader). One shader,
 *  four settings: gel flows · crystals glint · oil slides · petals turn on ripples. Seamless by construction: every
 *  motion is periodic in time (flow-map with two staggered phases, sines, fract sweeps). Runs only on screen (gl.ts);
 *  the plain <img> underneath is the fallback and the ?static=1 state. */
export type BeadMode = "gel" | "crystal" | "oil" | "petal";
const MODE: Record<BeadMode, number> = { gel: 0, crystal: 1, oil: 2, petal: 3 };

const FRAG = /* glsl */ `
uniform float uMode;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec2 flowField(vec2 p) {
  float a = vnoise(p * 2.2) * 6.2831, b = vnoise(p * 3.7 + 9.1) * 6.2831;
  return 0.6 * vec2(cos(a), sin(a)) + 0.4 * vec2(cos(b), sin(b));
}
vec3 tex(vec2 uv) { return texture2D(uTex0, clamp(uv, 0.002, 0.998)).rgb; }
// flow-map loop: two copies advected half a cycle apart, crossfaded, each reset hidden (never rewinds, no seam)
vec3 flowLoop(vec2 uv, vec2 flow, float period, float stagger) {
  float t = uTime / period + stagger;
  float p1 = fract(t), p2 = fract(t + 0.5);
  float w1 = 1.0 - abs(2.0 * p1 - 1.0);
  return tex(uv - flow * (p1 - 0.5)) * w1 + tex(uv - flow * (p2 - 0.5)) * (1.0 - w1);
}
void main() {
  vec2 uv = vUv;
  vec3 col;
  float T = uTime;
  if (uMode < 0.5) {
    // gel: slow swirl + a gentle rise, staggered per region so the whole bead never blends at once
    vec2 flow = flowField(uv) * 0.035 + vec2(0.0, -0.012);
    col = flowLoop(uv, flow, 4.0, vnoise(uv * 2.0));
    // bubbles drifting up: soft rings that fade in and out within their own cycle
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec2 o = vec2(hash(vec2(fi, 1.3)), hash(vec2(fi, 7.7)));
      float ph = fract(T / (3.0 + o.x * 2.0) + o.y);
      vec2 c = vec2(0.2 + 0.6 * o.x + 0.02 * sin(ph * 6.2831), 0.15 + 0.7 * fract(o.y + ph * 0.25));
      float d = length(uv - c), r = 0.012 + 0.012 * o.y;
      float ring = smoothstep(0.004, 0.0, abs(d - r)) * sin(3.1416 * ph);
      col += vec3(0.9, 0.97, 0.97) * ring * 0.55;
    }
  } else if (uMode < 1.5) {
    // crystals: they stay put; a broad light sweep crosses the facets and sparkle points flare and fade
    col = tex(uv + 0.0015 * vec2(sin(T * 0.8 + uv.y * 9.0), cos(T * 0.7 + uv.x * 8.0)));
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    float sweep = fract((uv.x * 0.8 + uv.y * 0.4) * 0.8 - T * 0.22) - 0.5;
    col += vec3(1.0, 0.98, 0.95) * exp(-sweep * sweep / 0.006) * smoothstep(0.55, 0.9, lum) * 0.35;
    vec2 cell = floor(uv * 26.0);
    float h = hash(cell);
    float tw = pow(max(0.0, sin(T * (1.2 + h * 1.6) + h * 40.0)), 24.0);
    vec2 f = fract(uv * 26.0) - 0.5;
    float star = exp(-dot(f, f) * 40.0) * (exp(-abs(f.x) * 60.0) + exp(-abs(f.y) * 60.0));
    col += vec3(1.0) * star * tw * smoothstep(0.6, 0.85, lum) * step(0.72, h) * 0.9;
  } else if (uMode < 2.5) {
    // oil: a slow slide in one direction, with highlights gliding along the surface
    vec2 flow = vec2(0.03, 0.006) + flowField(uv * 0.7) * 0.012;
    col = flowLoop(uv, flow, 5.0, 0.0);
    float g = fract(uv.x * 0.9 - uv.y * 0.3 - T * 0.12) - 0.5;
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col += vec3(1.0, 0.86, 0.62) * exp(-g * g / 0.004) * smoothstep(0.35, 0.8, lum) * 0.22;
  } else {
    // petals: ripple rings run under them on the water, and the scene turns very slowly
    vec2 c = uv - 0.5;
    float a = 0.035 * sin(T * 0.25);
    c = mat2(cos(a), -sin(a), sin(a), cos(a)) * c;
    float r = length(c);
    vec2 dir = r > 1e-4 ? c / r : vec2(0.0);
    float wave = sin(r * 48.0 - T * 2.2) * 0.0035 * smoothstep(0.5, 0.15, r);
    col = tex(c + 0.5 + dir * wave);
    col += vec3(1.0) * max(0.0, cos(r * 48.0 - T * 2.2)) * 0.05 * smoothstep(0.5, 0.2, r);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export default function BeadLoop({ src, mode }: { src: string; mode: BeadMode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let gl: GLHandle | null = null;
    let alive = true;
    loadImage(src).then(async (img) => {
      if (!alive || !img) return;
      gl = await createShader(canvas.current!, FRAG, { textures: [img], uniforms: { uMode: { value: MODE[mode] } }, dpr: 1.5 });
    });
    return () => {
      alive = false;
      gl?.destroy();
    };
  }, [src, mode]);
  return <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" aria-hidden="true" />;
}
