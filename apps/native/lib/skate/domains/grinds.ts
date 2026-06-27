import type { Domain } from "@/lib/skate/types";

export const GRINDS: Domain = {
  id: "grinds",
  label: "Grinds & Slides",
  stances: ["regular", "fakie", "switch", "nollie"],
  bases: [
    { id: "50-50", name: "50-50", base: 1, dir: "optional" },
    { id: "boardslide", name: "Boardslide", base: 2, dir: "optional" },
    { id: "noseslide", name: "Noseslide", base: 3, dir: "optional" },
    { id: "5-0", name: "5-0", base: 3, dir: "optional" },
    { id: "nosegrind", name: "Nosegrind", base: 3, dir: "optional" },
    { id: "tailslide", name: "Tailslide", base: 4, dir: "optional" },
    { id: "lipslide", name: "Lipslide", base: 4, dir: "optional" },
    { id: "crooked", name: "Crooked Grind", base: 5, dir: "optional" },
    { id: "smith", name: "Smith Grind", base: 6, dir: "optional" },
    { id: "feeble", name: "Feeble Grind", base: 6, dir: "optional" },
    { id: "bluntslide", name: "Bluntslide", base: 7, dir: "optional" },
    { id: "nosebluntslide", name: "Nosebluntslide", base: 8, dir: "optional" },
  ],
};
