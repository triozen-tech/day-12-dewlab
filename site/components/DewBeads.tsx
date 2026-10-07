/** A few dew beads resting on a glass pane's top edge (decoration, S5). Positions are fixed per pane so they never jump. */
export default function DewBeads({ beads }: { beads: [x: number, size: number][] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0">
      {beads.map(([x, s], i) => (
        <span key={i} className="dew-bead" style={{ left: `${x}%`, top: -s * 0.55, width: s, height: s * 0.86 }} />
      ))}
    </div>
  );
}
