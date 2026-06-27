import type { Domain } from "@/lib/skate/types";

export const FLATGROUND: Domain = {
  id: "flatground",
  label: "Flatground",
  stances: ["regular", "fakie", "switch", "nollie"],
  bases: [
    { id: "ollie", name: "Ollie", base: 1, dir: "none" },
    { id: "shuvit", name: "Shuvit", base: 2, dir: "optional" },
    { id: "180", name: "180", base: 2, dir: "required" },
    { id: "kickflip", name: "Kickflip", base: 3, dir: "none" },
    { id: "heelflip", name: "Heelflip", base: 3, dir: "none" },
    { id: "360-shuvit", name: "360 Shuvit", base: 4, dir: "optional" },
    { id: "varial-kickflip", name: "Varial Kickflip", base: 4, dir: "none" },
    { id: "varial-heelflip", name: "Varial Heelflip", base: 4, dir: "none" },
    { id: "bigspin", name: "Bigspin", base: 5, dir: "required" },
    { id: "360-flip", name: "360 Flip", base: 6, dir: "none" },
    { id: "hardflip", name: "Hardflip", base: 6, dir: "none" },
    { id: "inward-heelflip", name: "Inward Heelflip", base: 6, dir: "none" },
    { id: "bigspin-flip", name: "Bigspin Flip", base: 7, dir: "required" },
    { id: "laser-flip", name: "Laser Flip", base: 7, dir: "none" },
  ],
};
