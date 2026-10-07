import FogLoader from "./components/FogLoader";
import DewNav from "./components/DewNav";
import HeroBead from "./components/HeroBead";
import Ripple from "./components/Ripple";
import Actives from "./components/Actives";
import Ritual from "./components/Ritual";
import BeforeAfter from "./components/BeforeAfter";
import Results from "./components/Results";
import Reviews from "./components/Reviews";
import Shop from "./components/Shop";
import FooterDew from "./components/FooterDew";
import DropTraveller from "./components/DropTraveller";
import Transitions from "./components/Transitions";
import RecordPointer from "./components/RecordPointer";

/** Dewlab · Round 1 structure (site/DESIGN.md): every section in its final state, the drop's anchors in place
 *  ([data-drop-anchor]); the travelling drop layer, loader, pins and motion arrive in Rounds 2–4. Desktop 1440×900 only. */
export default function Page() {
  return (
    <main className="pane-stack bg-[var(--mist)]">
      <FogLoader />
      <DewNav />
      <HeroBead />
      <Ripple />
      <Actives />
      <Ritual />
      <BeforeAfter />
      <Results />
      <Reviews />
      <Shop />
      <FooterDew />
      <DropTraveller />
      <Transitions />
      <RecordPointer />
    </main>
  );
}
