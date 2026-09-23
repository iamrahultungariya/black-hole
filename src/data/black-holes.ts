export type Category = "stellar" | "intermediate" | "supermassive" | "ultramassive";
export type ScaleMode = "log" | "true" | "equal";

export type Morphology =
  | "quiescent"       // Dormant / GW merger remnant (e.g. Gaia BH1, GW150914)
  | "eht_synchrotron" // Observed radio synchrotron crescent (e.g. Sgr A*, M87*)
  | "microquasar"     // High-energy stellar X-ray binary (e.g. Cygnus X-1, GRS 1915)
  | "quasar"          // Luminous broad-line quasar (e.g. TON 618, 3C 273)
  | "dusty_torus"     // Obscured dusty active nucleus / warped disk (e.g. Cen A, Sombrero)
  | "cD_giant"        // Brightest cluster galaxy giant (e.g. Phoenix A, Holmberg 15A)
  | "standard";       // Classical accretion system

export const MORPHOLOGY_LABEL: Record<Morphology, string> = {
  quiescent: "Quiescent (Dormant)",
  eht_synchrotron: "EHT Synchrotron Ring",
  microquasar: "Relativistic Microquasar",
  quasar: "Hyperluminous Quasar",
  dusty_torus: "Dust-Obscured Torus",
  cD_giant: "Cluster Behemoth (cD)",
  standard: "Standard Accretion Disk",
};

export interface BlackHole {
  id: string;
  name: string;
  aka?: string;
  mass: number;
  massNote?: string;
  category: Category;
  host: string;
  distanceLy: number | null;
  redshift?: number;
  discovered: number;
  event?: string;
  blurb: string;
  hasJets?: boolean;
  jetLength?: number;
  jetColor?: string;
  debated?: boolean;
  spin: number;
  morphology: Morphology;
  hot: string;
  cool: string;
  innerRadiusRatio: number;
  outerRadiusRatio: number;
  diskBrightness: number;
  lensingStrength: number;
  position: [number, number, number];
  tilt: [number, number, number];
}

export const CENSUS_ID = "census";

export const LOG_MIN = Math.log10(5);
export const LOG_MAX = Math.log10(1.2e11);
export const AXIS_SPAN = 168;

export function rawMassToX(mass: number): number {
  const t = (Math.log10(mass) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return (t - 0.5) * AXIS_SPAN;
}

export function visualRadius(mass: number, mode: ScaleMode): number {
  if (mode === "equal") return 0.72;
  if (mode === "true") {
    return Math.max(0.04, 1.2 * (mass / 6.5e9));
  }
  const t = (Math.log10(mass) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return 0.32 + Math.pow(Math.max(0, t), 1.35) * 2.85;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  stellar: "Stellar",
  intermediate: "Intermediate",
  supermassive: "Supermassive",
  ultramassive: "Ultramassive",
};

export const CATEGORY_HINT: Record<Category, string> = {
  stellar: "A few to a few hundred solar masses. Endpoints of massive stars, or merger remnants.",
  intermediate: "Hundreds to a hundred thousand solar masses. Rare, still being weighed.",
  supermassive: "Millions to billions of solar masses. Sit in galaxy centres.",
  ultramassive: "Ten billion solar masses and above. Mostly luminous quasars and cD galaxies.",
};

const PALETTE = {
  stellar: { hot: "#ffeed6", cool: "#6b829e" },
  intermediate: { hot: "#ffdfa0", cool: "#c46830" },
  supermassive: { hot: "#ffd094", cool: "#b84820" },
  ultramassive: { hot: "#ffbf7a", cool: "#8a2412" },
} as const;

export interface Seed {
  id: string;
  name: string;
  aka?: string;
  mass: number;
  massNote?: string;
  category: Category;
  host: string;
  distanceLy: number | null;
  redshift?: number;
  discovered: number;
  event?: string;
  blurb: string;
  hasJets?: boolean;
  jetLength?: number;
  jetColor?: string;
  debated?: boolean;
  spin?: number;
  morphology?: Morphology;
  hot?: string;
  cool?: string;
  innerRadiusRatio?: number;
  outerRadiusRatio?: number;
  diskBrightness?: number;
  lensingStrength?: number;
  tilt?: [number, number, number];
}

const SEEDS: Seed[] = [
  {
    id: "gro-j1655",
    name: "GRO J1655−40",
    mass: 6.3,
    massNote: "± 0.5",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 11_000,
    discovered: 1994,
    morphology: "microquasar",
    spin: 0.72,
    hasJets: true,
    jetLength: 3.8,
    jetColor: "#98dcff",
    hot: "#ffe4bc",
    cool: "#6c4020",
    tilt: [0.42, 0.35, 0.1],
    blurb:
      "A microquasar in Scorpius. Its high-velocity jets and thermal X-ray disk made it an early laboratory for stellar-mass accretion.",
  },
  {
    id: "a0620",
    name: "A0620−00",
    aka: "V616 Mon",
    mass: 6.6,
    massNote: "± 0.3",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 3_400,
    discovered: 1975,
    morphology: "standard",
    spin: 0.15,
    hot: "#ffd4a0",
    cool: "#7c381c",
    diskBrightness: 0.7,
    tilt: [0.48, 0.2, 0.1],
    blurb:
      "The first X-ray nova shown to host a compact object too massive to be a neutron star — a cornerstone of the stellar-mass sample.",
  },
  {
    id: "maxi-j1820",
    name: "MAXI J1820+070",
    mass: 8.5,
    massNote: "≈",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 9_800,
    discovered: 2018,
    morphology: "microquasar",
    spin: 0.82,
    hasJets: true,
    jetLength: 4.0,
    jetColor: "#a0e0ff",
    hot: "#fff0ce",
    cool: "#6888a4",
    tilt: [0.38, -0.25, 0.15],
    blurb:
      "A bright 2018 outburst let radio and X-ray campaigns clock jet launching and corona contraction from a nearby stellar hole.",
  },
  {
    id: "v404-cyg",
    name: "V404 Cygni",
    mass: 9.0,
    massNote: "± 0.2",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 7_800,
    discovered: 1989,
    morphology: "dusty_torus",
    spin: 0.91,
    hasJets: true,
    jetLength: 3.4,
    jetColor: "#ffd688",
    hot: "#ffb462",
    cool: "#852a12",
    tilt: [0.65, -0.38, 0.28], // Strongly warped precessing disk
    blurb:
      "A recurrent X-ray transient with a violently precessing, warped accretion disk that shoots plasma jets in fluctuating directions.",
  },
  {
    id: "gaia-bh1",
    name: "Gaia BH1",
    mass: 9.62,
    massNote: "± 0.18",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 1_560,
    discovered: 2022,
    event: "Nearest confirmed dormant hole",
    morphology: "quiescent",
    spin: 0.25,
    hot: "#c2e2ff",
    cool: "#243c58",
    diskBrightness: 0.9,
    lensingStrength: 1.35,
    tilt: [0.25, 0.1, 0.05],
    blurb:
      "A quiet, completely non-accreting black hole with a Sun-like companion, detected solely by astrometric orbital wobble.",
  },
  {
    id: "lmc-x1",
    name: "LMC X-1",
    mass: 10.9,
    massNote: "± 1.4",
    category: "stellar",
    host: "Large Magellanic Cloud",
    distanceLy: 163_000,
    discovered: 1969,
    morphology: "microquasar",
    spin: 0.92,
    hot: "#cceeff",
    cool: "#486e92",
    tilt: [0.4, 0.3, -0.1],
    blurb:
      "A persistent high-mass X-ray binary in the LMC, accreting hot wind from an O7 III giant star with high orbital energy.",
  },
  {
    id: "grs-1915",
    name: "GRS 1915+105",
    mass: 12.4,
    massNote: "± 2.0",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 28_000,
    discovered: 1992,
    morphology: "microquasar",
    spin: 0.99,
    hasJets: true,
    jetLength: 5.2,
    jetColor: "#7eccff",
    hot: "#fff6de",
    cool: "#7c4424",
    innerRadiusRatio: 1.18,
    tilt: [0.45, 0.42, 0.1],
    blurb:
      "The first galactic microquasar with superluminal radio jets. Its near-maximally spinning Kerr hole powers volatile X-ray flares.",
  },
  {
    id: "m33-x7",
    name: "M33 X-7",
    mass: 15.65,
    massNote: "± 1.45",
    category: "stellar",
    host: "Triangulum (M33)",
    distanceLy: 2_700_000,
    discovered: 2006,
    morphology: "microquasar",
    spin: 0.84,
    hot: "#c2e0ff",
    cool: "#45688d",
    tilt: [0.82, 0.15, 0.0], // Eclipsing binary: viewed near edge-on ~75 deg
    blurb:
      "An eclipsing high-mass X-ray binary in the Triangulum Galaxy. Its tilted edge-on orbital plane precisely constrains its mass.",
  },
  {
    id: "cygnus-x1",
    name: "Cygnus X-1",
    mass: 21.2,
    massNote: "± 2.2",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 7_200,
    discovered: 1964,
    event: "First black-hole candidate",
    morphology: "microquasar",
    spin: 0.97,
    hasJets: true,
    jetLength: 4.6,
    jetColor: "#92dcff",
    hot: "#d2f0ff",
    cool: "#4a7299",
    tilt: [0.38, 0.22, 0.12], // ~27 deg inclination
    blurb:
      "The historic prototype. A 21-solar-mass hole feeding furiously from blue supergiant HDE 226868 with relativistic polar jets.",
  },
  {
    id: "gaia-bh3",
    name: "Gaia BH3",
    mass: 32.7,
    massNote: "± 0.8",
    category: "stellar",
    host: "Milky Way",
    distanceLy: 1_900,
    discovered: 2024,
    event: "Heaviest dormant hole in the Milky Way",
    morphology: "quiescent",
    spin: 0.22,
    hot: "#b8dcff",
    cool: "#20344e",
    diskBrightness: 0.9,
    lensingStrength: 1.4,
    tilt: [0.22, 0.12, 0.05],
    blurb:
      "A massive 33-solar-mass dormant hole in the galactic halo, found by Gaia astrometry. A silent titan untouched by accretion.",
  },
  {
    id: "gw150914",
    name: "GW150914 remnant",
    mass: 62.3,
    massNote: "± 4",
    category: "stellar",
    host: "LIGO detection",
    distanceLy: 1_300_000_000,
    discovered: 2015,
    event: "First gravitational-wave detection",
    morphology: "quiescent",
    spin: 0.69,
    hot: "#c8e4ff",
    cool: "#1c2e42",
    diskBrightness: 0.95,
    lensingStrength: 1.45,
    tilt: [0.3, 0.1, 0.05],
    blurb:
      "Formed by the violent coalescence of two black holes 1.3 billion light-years away. A pure vacuum Kerr spacetime remnant.",
  },
  {
    id: "gw190521",
    name: "GW190521 remnant",
    mass: 142,
    massNote: "± 16",
    category: "intermediate",
    host: "LIGO/Virgo detection",
    distanceLy: 5_300_000_000,
    discovered: 2019,
    event: "First clear intermediate-mass remnant",
    morphology: "quiescent",
    spin: 0.72,
    hot: "#b0d8ff",
    cool: "#1a2a3e",
    diskBrightness: 0.95,
    lensingStrength: 1.45,
    tilt: [0.35, 0.15, 0.05],
    blurb:
      "A pair-instability gap merger remnant — the first gravitational-wave detection firmly proving the existence of intermediate-mass holes.",
  },
  {
    id: "m82-x1",
    name: "M82 X-1",
    mass: 428,
    massNote: "± 105",
    category: "intermediate",
    host: "M82",
    distanceLy: 12_000_000,
    discovered: 1999,
    morphology: "dusty_torus",
    spin: 0.55,
    hot: "#ffa658",
    cool: "#823218",
    tilt: [0.55, -0.2, 0.15],
    blurb:
      "An ultraluminous X-ray source in the Cigar Galaxy (M82). Its intermediate mass is fueled by intense starburst gas clouds.",
  },
  {
    id: "hlx-1",
    name: "HLX-1",
    aka: "ESO 243−49 HLX-1",
    mass: 20_000,
    massNote: "order of magnitude",
    category: "intermediate",
    host: "ESO 243−49",
    distanceLy: 290_000_000,
    discovered: 2009,
    event: "Strongest IMBH candidate",
    morphology: "microquasar",
    spin: 0.85,
    hot: "#bfe4ff",
    cool: "#3e668e",
    tilt: [0.42, 0.25, 0.1],
    blurb:
      "Hyper-Luminous X-ray source 1. Believed to be the stripped nucleus of a dwarf galaxy captured by an S0 lenticular galaxy.",
  },
  {
    id: "ngc-4395",
    name: "NGC 4395",
    mass: 360_000,
    massNote: "± 80,000",
    category: "supermassive",
    host: "NGC 4395",
    distanceLy: 14_000_000,
    discovered: 1989,
    morphology: "standard",
    spin: 0.62,
    hot: "#ffdfa4",
    cool: "#7c4a28",
    tilt: [0.38, 0.2, 0.1],
    blurb:
      "A dwarf Seyfert galaxy hosting one of the lowest-mass supermassive holes known — an evolutionary stepping stone from IMBHs.",
  },
  {
    id: "m32",
    name: "M32",
    mass: 2_500_000,
    massNote: "≈",
    category: "supermassive",
    host: "M32 (Andromeda satellite)",
    distanceLy: 2_650_000,
    discovered: 1998,
    morphology: "standard",
    spin: 0.45,
    hot: "#ffd090",
    cool: "#68381c",
    diskBrightness: 0.65,
    tilt: [0.42, 0.18, 0.08],
    blurb:
      "The compact elliptical satellite of Andromeda. Its densely packed stellar core harbors a few-million-solar-mass central black hole.",
  },
  {
    id: "sgr-a",
    name: "Sagittarius A*",
    mass: 4_300_000,
    massNote: "± 0.3 million",
    category: "supermassive",
    host: "Milky Way",
    distanceLy: 27_000,
    discovered: 1974,
    event: "EHT image, 2022",
    morphology: "eht_synchrotron",
    spin: 0.88,
    hot: "#ffb454",
    cool: "#8f3014",
    innerRadiusRatio: 1.25,
    outerRadiusRatio: 2.6,
    diskBrightness: 1.05,
    lensingStrength: 1.15,
    tilt: [0.28, 0.14, 0.06], // ~30 deg face-on view
    blurb:
      "The supermassive black hole at the heart of our Milky Way. Imaged by the EHT in 2022, revealing a glowing synchrotron ring around a dark shadow.",
  },
  {
    id: "ngc-4258",
    name: "NGC 4258",
    aka: "M106",
    mass: 40_000_000,
    massNote: "megamaser, high precision",
    category: "supermassive",
    host: "NGC 4258",
    distanceLy: 23_000_000,
    discovered: 1995,
    morphology: "standard",
    spin: 0.72,
    hasJets: true,
    jetLength: 3.8,
    jetColor: "#ffd688",
    hot: "#ffd694",
    cool: "#7a3c18",
    tilt: [0.78, -0.15, 0.22], // Strongly inclined megamaser disk
    blurb:
      "Water megamasers trace a thin Keplerian warped disk to exquisite milliarcsecond precision, providing a benchmark geometric mass.",
  },
  {
    id: "cen-a",
    name: "Centaurus A",
    aka: "NGC 5128",
    mass: 55_000_000,
    massNote: "≈",
    category: "supermassive",
    host: "NGC 5128",
    distanceLy: 13_000_000,
    discovered: 1949,
    morphology: "dusty_torus",
    spin: 0.68,
    hasJets: true,
    jetLength: 5.6,
    jetColor: "#7ec4ff",
    hot: "#f4a259",
    cool: "#581f14",
    tilt: [0.55, 0.35, 0.1],
    blurb:
      "The nearest giant radio galaxy. A galactic merger remnant with a massive dark dust lane and colossal radio jets inflating megaparsec lobes.",
  },
  {
    id: "m31",
    name: "Andromeda",
    aka: "M31*",
    mass: 140_000_000,
    massNote: "± 30 million",
    category: "supermassive",
    host: "Andromeda (M31)",
    distanceLy: 2_500_000,
    discovered: 1999,
    morphology: "standard",
    spin: 0.52,
    hot: "#ffd29a",
    cool: "#623820",
    diskBrightness: 0.65,
    tilt: [0.45, 0.2, 0.1],
    blurb:
      "The nucleus of our giant neighbor Andromeda is thirty times heavier than Sagittarius A*, wrapped in an eccentric double stellar cluster.",
  },
  {
    id: "sombrero",
    name: "Sombrero",
    aka: "M104",
    mass: 660_000_000,
    massNote: "≈",
    category: "supermassive",
    host: "M104",
    distanceLy: 31_000_000,
    discovered: 1996,
    morphology: "dusty_torus",
    spin: 0.62,
    hot: "#eec28a",
    cool: "#3e2618",
    tilt: [0.94, 0.05, 0.0], // Almost exactly edge-on ~84 deg!
    blurb:
      "A luminous bulge-dominated galaxy whose central black hole is encircled by a majestic, near edge-on ring of cold interstellar dust.",
  },
  {
    id: "3c273",
    name: "3C 273",
    mass: 886_000_000,
    massNote: "virial",
    category: "supermassive",
    host: "3C 273 host",
    distanceLy: null,
    redshift: 0.158,
    discovered: 1963,
    event: "First quasar identified",
    morphology: "quasar",
    spin: 0.95,
    hasJets: true,
    jetLength: 6.5,
    jetColor: "#6ec8ff",
    hot: "#d0f0ff",
    cool: "#386596",
    diskBrightness: 1.15,
    lensingStrength: 1.15,
    tilt: [0.32, 0.18, 0.08],
    blurb:
      "The very first object identified as a quasar. A billion-solar-mass engine launching an ultra-relativistic jet spanning hundreds of thousands of light-years.",
  },
  {
    id: "ngc-3115",
    name: "NGC 3115",
    mass: 2_000_000_000,
    massNote: "≈",
    category: "supermassive",
    host: "NGC 3115",
    distanceLy: 32_000_000,
    discovered: 1992,
    morphology: "standard",
    spin: 0.58,
    hot: "#ffcaa0",
    cool: "#683818",
    tilt: [0.5, 0.25, 0.1],
    blurb:
      "A nearby field lenticular galaxy whose HST spectroscopy in the 1990s gave one of the earliest firm billion-solar-mass black hole detections.",
  },
  {
    id: "cygnus-a",
    name: "Cygnus A",
    mass: 2_500_000_000,
    massNote: "≈",
    category: "supermassive",
    host: "Cygnus A host",
    distanceLy: 760_000_000,
    discovered: 1946,
    morphology: "quasar",
    spin: 0.89,
    hasJets: true,
    jetLength: 6.2,
    jetColor: "#7ed0ff",
    hot: "#ffd28e",
    cool: "#6e2a14",
    diskBrightness: 1.35,
    tilt: [0.45, 0.35, 0.1],
    blurb:
      "The archetype FR II radio galaxy. Its colossal relativistic twin jets slam into the intracluster medium, creating blazing hot spots.",
  },
  {
    id: "m87",
    name: "Messier 87*",
    mass: 6_500_000_000,
    massNote: "± 0.7 billion",
    category: "supermassive",
    host: "M87 (Virgo A)",
    distanceLy: 53_000_000,
    discovered: 1918,
    event: "First EHT image, 2019",
    morphology: "eht_synchrotron",
    spin: 0.92,
    hasJets: true,
    jetLength: 6.6,
    jetColor: "#7eccff",
    hot: "#ffa63e",
    cool: "#7a220a",
    innerRadiusRatio: 1.22,
    outerRadiusRatio: 2.7,
    diskBrightness: 1.25,
    lensingStrength: 1.25,
    tilt: [0.22, 0.14, 0.05], // ~17 deg inclination to line of sight!
    blurb:
      "The first black hole ever imaged by humanity (EHT 2019). A 6.5-billion-solar-mass colossus driving a 5,000-light-year relativistic plasma jet.",
  },
  {
    id: "ngc-3842",
    name: "NGC 3842",
    mass: 9_700_000_000,
    massNote: "≈",
    category: "supermassive",
    host: "NGC 3842",
    distanceLy: 320_000_000,
    discovered: 2011,
    morphology: "cD_giant",
    spin: 0.72,
    hot: "#ffb46e",
    cool: "#6c2612",
    tilt: [0.38, 0.2, 0.1],
    blurb:
      "The central giant elliptical galaxy in galaxy cluster Abell 1367. Its mass approaches the ten-billion-solar-mass ultramassive boundary.",
  },
  {
    id: "j0100",
    name: "SDSS J0100+2802",
    mass: 12_400_000_000,
    massNote: "virial, high-z",
    category: "ultramassive",
    host: "SDSS J0100+2802 host",
    distanceLy: null,
    redshift: 6.3,
    discovered: 2015,
    debated: true,
    morphology: "quasar",
    spin: 0.96,
    hot: "#ffe8b8",
    cool: "#8a3a16",
    diskBrightness: 1.15,
    lensingStrength: 1.15,
    tilt: [0.35, 0.22, 0.08],
    blurb:
      "A luminous quasar at redshift z = 6.3. A 12-billion-solar-mass titan already fully assembled just 900 million years after the Big Bang.",
  },
  {
    id: "ngc-1277",
    name: "NGC 1277",
    mass: 17_000_000_000,
    massNote: "debated; later work lower",
    category: "ultramassive",
    host: "NGC 1277 (Perseus)",
    distanceLy: 240_000_000,
    discovered: 2012,
    debated: true,
    morphology: "standard",
    spin: 0.68,
    hot: "#ffc89a",
    cool: "#683216",
    tilt: [0.48, 0.25, 0.1],
    blurb:
      "A compact lenticular galaxy in Perseus with an unexpectedly gigantic black hole that accounts for a substantial fraction of its bulge mass.",
  },
  {
    id: "ngc-1600",
    name: "NGC 1600",
    mass: 17_000_000_000,
    massNote: "≈",
    category: "ultramassive",
    host: "NGC 1600",
    distanceLy: 200_000_000,
    discovered: 2016,
    morphology: "cD_giant",
    spin: 0.65,
    hot: "#ffb268",
    cool: "#62200e",
    tilt: [0.36, 0.18, 0.08],
    blurb:
      "A fossil group elliptical. Stellar dynamics reveal a 17-billion-solar-mass monster sitting in a sparse galaxy group environment.",
  },
  {
    id: "oj-287",
    name: "OJ 287",
    mass: 18_000_000_000,
    massNote: "binary primary model",
    category: "ultramassive",
    host: "OJ 287 host",
    distanceLy: null,
    redshift: 0.306,
    discovered: 1967,
    hasJets: true,
    jetLength: 5.8,
    jetColor: "#92dcff",
    debated: true,
    morphology: "quasar",
    spin: 0.94,
    hot: "#ffe094",
    cool: "#883010",
    diskBrightness: 1.45,
    tilt: [0.42, 0.28, 0.12],
    blurb:
      "A blazar system exhibiting 12-year double optical flares, explained by a secondary black hole repeatedly punching through the primary's disk.",
  },
  {
    id: "ngc-4889",
    name: "NGC 4889",
    mass: 21_000_000_000,
    massNote: "range 6–37 billion",
    category: "ultramassive",
    host: "NGC 4889 (Coma)",
    distanceLy: 308_000_000,
    discovered: 2011,
    morphology: "cD_giant",
    spin: 0.76,
    hot: "#ffac60",
    cool: "#661c0a",
    tilt: [0.4, 0.2, 0.1],
    blurb:
      "The brightest cD galaxy in the Coma Cluster. Integral-field kinematics reveal a black hole containing tens of billions of solar masses.",
  },
  {
    id: "apm-08279",
    name: "APM 08279+5255",
    mass: 23_000_000_000,
    massNote: "lensed quasar, virial",
    category: "ultramassive",
    host: "APM 08279+5255 host",
    distanceLy: null,
    redshift: 3.91,
    discovered: 1998,
    debated: true,
    hasJets: true,
    jetLength: 5.6,
    jetColor: "#9ce2ff",
    morphology: "quasar",
    spin: 0.92,
    hot: "#ffd882",
    cool: "#78260e",
    tilt: [0.38, 0.22, 0.08],
    blurb:
      "A gravitationally lensed, iron-rich broad-absorption-line quasar at redshift 3.91, ranking among the most luminous beacons in the cosmos.",
  },
  {
    id: "holmberg-15a",
    name: "Holmberg 15A",
    mass: 40_000_000_000,
    massNote: "velocity dispersion; debated",
    category: "ultramassive",
    host: "Holmberg 15A (Abell 85)",
    distanceLy: 700_000_000,
    discovered: 2016,
    debated: true,
    morphology: "cD_giant",
    spin: 0.72,
    hot: "#ffa452",
    cool: "#561406",
    tilt: [0.32, 0.16, 0.06],
    blurb:
      "A central cD galaxy with a depleted core in Abell 85. Kinematical models indicate a supergiant hole of roughly 40 billion solar masses.",
  },
  {
    id: "ton-618",
    name: "TON 618",
    mass: 66_000_000_000,
    massNote: "Hβ virial",
    category: "ultramassive",
    host: "TON 618 host",
    distanceLy: null,
    redshift: 2.219,
    discovered: 1970,
    hasJets: true,
    jetLength: 6.8,
    jetColor: "#84d6ff",
    morphology: "quasar",
    spin: 0.99,
    hot: "#ffe8b0",
    cool: "#9a3810",
    innerRadiusRatio: 1.16,
    outerRadiusRatio: 3.2,
    diskBrightness: 1.15,
    lensingStrength: 1.15,
    tilt: [0.34, 0.2, 0.08],
    blurb:
      "A hyperluminous quasar shining with the luminosity of 140 trillion Suns. Its 66-billion-solar-mass event horizon is wider than our solar system.",
  },
  {
    id: "phoenix-a",
    name: "Phoenix A",
    mass: 100_000_000_000,
    massNote: "upper range; debated",
    category: "ultramassive",
    host: "Phoenix Cluster BCG",
    distanceLy: 5_700_000_000,
    discovered: 2010,
    debated: true,
    hasJets: true,
    jetLength: 7.2,
    jetColor: "#ffaa66",
    morphology: "cD_giant",
    spin: 0.86,
    hot: "#ff9248",
    cool: "#4a0e04",
    innerRadiusRatio: 1.22,
    outerRadiusRatio: 3.1,
    diskBrightness: 1.3,
    lensingStrength: 1.3,
    tilt: [0.36, 0.22, 0.1],
    blurb:
      "The colossal central black hole of the Phoenix Cluster BCG. Fed by a massive cooling flow of 600 solar masses per year, approaching 100 billion Suns.",
  },
];

export const SPAN_X = 220;
export const SPAN_Y = 24;
export const SPAN_Z = 34;

function computeSpacedT(sorted: Seed[]): number[] {
  const n = sorted.length;
  if (n === 0) return [];
  
  // Raw logarithmic progress t in [0, 1]
  const rawT = sorted.map((s) => {
    return Math.max(0, Math.min(1, (Math.log10(s.mass) - LOG_MIN) / (LOG_MAX - LOG_MIN)));
  });

  // Minimum fractional gap along the timeline to prevent any overlap
  const minGap = 0.026;
  const spaced = [...rawT];

  // Forward relaxation pass: enforce minimum gap between consecutive black holes
  for (let i = 1; i < n; i++) {
    if (spaced[i] < spaced[i - 1] + minGap) {
      spaced[i] = spaced[i - 1] + minGap;
    }
  }

  // Normalize so full spectrum spans [0, 1] smoothly
  const maxVal = spaced[n - 1];
  const minVal = spaced[0];
  const range = maxVal - minVal || 1;
  return spaced.map((v) => (v - minVal) / range);
}

function tToPosition(t: number): [number, number, number] {
  // Diagonal 3D trajectory from high-left to low-right (matching reference image)
  const x = (t - 0.5) * SPAN_X;
  const y = (0.5 - t) * SPAN_Y;
  const z = (t - 0.5) * SPAN_Z;
  return [x, y, z];
}

function layout(rows: Seed[]): BlackHole[] {
  const sorted = [...rows].sort((a, b) => a.mass - b.mass);
  const tValues = computeSpacedT(sorted);

  return sorted.map((row, i) => {
    const t = tValues[i];
    const pos = tToPosition(t);
    // Subtle alternate tilt for realistic varied orientation
    const defaultTilt: [number, number, number] = [
      0.32 * Math.sin(i * 1.37),
      0.20 * Math.cos(i * 0.81),
      0.12 * Math.sin(i * 0.63),
    ];
    const categoryPalette = PALETTE[row.category];
    const spin = row.spin ?? 0.7;
    const defaultInner = 1.48 - spin * 0.32;
    const defaultOuter = 2.85;

    return {
      ...row,
      spin,
      morphology: row.morphology ?? "standard",
      hot: row.hot ?? categoryPalette.hot,
      cool: row.cool ?? categoryPalette.cool,
      innerRadiusRatio: row.innerRadiusRatio ?? defaultInner,
      outerRadiusRatio: row.outerRadiusRatio ?? defaultOuter,
      diskBrightness: row.diskBrightness ?? 1.0,
      lensingStrength: row.lensingStrength ?? 1.0,
      jetLength: row.jetLength ?? (row.hasJets ? 4.2 : undefined),
      jetColor: row.jetColor ?? (row.hot ?? categoryPalette.hot),
      position: pos,
      tilt: row.tilt ?? defaultTilt,
    };
  });
}

export const BLACK_HOLES: BlackHole[] = layout(SEEDS);

export function massToPos(mass: number): [number, number, number] {
  if (BLACK_HOLES.length === 0) return [0, 0, 0];
  const first = BLACK_HOLES[0];
  const last = BLACK_HOLES[BLACK_HOLES.length - 1];
  if (mass <= first.mass) return first.position;
  if (mass >= last.mass) return last.position;

  for (let i = 0; i < BLACK_HOLES.length - 1; i++) {
    const a = BLACK_HOLES[i];
    const b = BLACK_HOLES[i + 1];
    if (mass >= a.mass && mass <= b.mass) {
      const logA = Math.log10(a.mass);
      const logB = Math.log10(b.mass);
      const frac = logB === logA ? 0 : (Math.log10(mass) - logA) / (logB - logA);
      return [
        a.position[0] + frac * (b.position[0] - a.position[0]),
        a.position[1] + frac * (b.position[1] - a.position[1]),
        a.position[2] + frac * (b.position[2] - a.position[2]),
      ];
    }
  }
  return [0, 0, 0];
}

export function massToX(mass: number): number {
  return massToPos(mass)[0];
}

export const BY_ID: Record<string, BlackHole> = Object.fromEntries(
  BLACK_HOLES.map((h) => [h.id, h]),
);

export const MASS_MIN = BLACK_HOLES[0]!.mass;
export const MASS_MAX = BLACK_HOLES[BLACK_HOLES.length - 1]!.mass;

export const TOUR_STOPS: { id: string; kicker: string; line: string }[] = [
  {
    id: "cygnus-x1",
    kicker: "The original",
    line: "Cygnus X-1 — twenty-one Suns, and the first object widely accepted as a black hole.",
  },
  {
    id: "gaia-bh3",
    kicker: "A quiet heavyweight",
    line: "Gaia BH3 sits dormant in the halo, as heavy as the remnants LIGO hears colliding.",
  },
  {
    id: "gw190521",
    kicker: "Born in a chirp",
    line: "GW190521 left a 142-solar-mass remnant — the first clear intermediate-mass hole from a merger.",
  },
  {
    id: "hlx-1",
    kicker: "The missing rung",
    line: "HLX-1 is the strongest case for a hole of tens of thousands of solar masses.",
  },
  {
    id: "sgr-a",
    kicker: "Home",
    line: "Sagittarius A* is 4.3 million solar masses, 27,000 light-years from Earth, and finally photographed.",
  },
  {
    id: "m87",
    kicker: "The first image",
    line: "M87* is 1,500 times heavier than Sagittarius A*. Its photon ring is the one you have already seen.",
  },
  {
    id: "ton-618",
    kicker: "A quasar ceiling",
    line: "TON 618's virial mass is 66 billion Suns — an event horizon thousands of times wider than Pluto's orbit.",
  },
  {
    id: "phoenix-a",
    kicker: "The upper shelf",
    line: "Phoenix A may approach 100 billion solar masses. The figure is debated; the scale is not in doubt.",
  },
  {
    id: CENSUS_ID,
    kicker: "The rest of the dark",
    line: "We have weighed a few dozen. The observable universe holds an estimated 40 quintillion stellar-mass holes.",
  },
];

export const CENSUS = {
  catalogCount: BLACK_HOLES.length,
  catalogMass: BLACK_HOLES.reduce((s, h) => s + h.mass, 0),
  milkyWayStellar: "≈ 10⁸",
  observableStellar: "≈ 4 × 10¹⁹",
  source: "Sicilia et al. 2022, ApJ",
};

export const AXIS_TICKS: { mass: number; label: string }[] = [
  { mass: 6.3, label: "10⁰" },
  { mass: 10, label: "10¹" },
  { mass: 100, label: "10²" },
  { mass: 1_000, label: "10³" },
  { mass: 1e4, label: "10⁴" },
  { mass: 1e6, label: "10⁶" },
  { mass: 1e8, label: "10⁸" },
  { mass: 1e10, label: "10¹⁰" },
];
