import type { SiteMeta, Theme } from "@/lib/site";

// Dewlab: one cool, misty morning and one apricot drop of serum travelling through it (site/DESIGN.md).

export const meta: SiteMeta = {
  name: "dewlab",
  title: "Dewlab · Skincare, but make it cinematic",
  description: "Dewlab Dew Drop Serum: three drops of morning, made to last all day. Concept website.",
  loaderText: "dewlab",
  loader: false, // Dewlab draws its own fog loader (site/components/FogLoader.tsx, I11)
  cursor: true,
  record: { duration: 34 },
};

export const theme: Theme = {
  bg: "#F2F6F4", // mist
  surface: "#FFFFFF",
  text: "#0F2A2E", // lagoon ink
  muted: "#557170", // ≈ 4.7:1 on the mist bg
  accent: "#EE7A3B", // apricot: the serum (fills, large type, buttons with ink text)
  accentText: "#0F2A2E",
  line: "rgba(15, 42, 46, 0.12)",
  fontDisplay: "'Gloock', serif",
  fontBody: "'Urbanist Variable', sans-serif",
  radius: 999,
  heroText: "#0F2A2E",
};
