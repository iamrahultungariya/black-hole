const KM_PER_SOLAR_RS = 2.953;
const KM_PER_AU = 149_597_870.7;
const AU_PER_LY = 63_241.077;

export function schwarzschildKm(massSolar: number): number {
  return massSolar * KM_PER_SOLAR_RS;
}

export function formatMass(mass: number): string {
  if (mass < 1_000) {
    const digits = mass >= 100 ? 0 : mass >= 10 ? 1 : 2;
    return `${mass.toFixed(digits)} M☉`;
  }
  if (mass < 1_000_000) {
    return `${Math.round(mass).toLocaleString("en-US")} M☉`;
  }
  if (mass < 1_000_000_000) {
    const n = mass / 1_000_000;
    return `${n < 10 ? n.toFixed(2) : n.toFixed(1)} million M☉`;
  }
  const n = mass / 1_000_000_000;
  return `${n < 10 ? n.toFixed(2) : n.toFixed(1)} billion M☉`;
}

export function formatMassCompact(mass: number): string {
  if (mass < 1_000) return mass < 10 ? mass.toFixed(1) : String(Math.round(mass));
  if (mass < 1e6) return `${(mass / 1e3).toFixed(mass < 1e4 ? 1 : 0)}k`;
  if (mass < 1e9) return `${(mass / 1e6).toFixed(mass < 1e7 ? 2 : 1)}M`;
  return `${(mass / 1e9).toFixed(mass < 1e10 ? 2 : 1)}B`;
}

export function formatRs(mass: number): string {
  const km = schwarzschildKm(mass);
  if (km < 1_000) return `${km.toFixed(0)} km`;
  if (km < 1_000_000) return `${(km / 1_000).toFixed(1)} thousand km`;
  const au = km / KM_PER_AU;
  if (au < 0.05) return `${(km / 1_000_000).toFixed(2)} million km`;
  if (au < 10) return `${au.toFixed(3)} AU`;
  if (au < 1_000) return `${au.toFixed(1)} AU`;
  const ly = au / AU_PER_LY;
  return `${ly < 0.01 ? ly.toFixed(4) : ly.toFixed(3)} ly`;
}

export function formatPhotonSphere(mass: number): string {
  return formatRs(mass * 1.5);
}

export function formatRatio(a: number, b: number): string {
  if (b <= 0 || a <= 0) return "—";
  const r = a / b;
  if (r >= 0.4 && r <= 2.5) return `${r.toFixed(2)}×`;
  if (r > 1) return formatTimes(r);
  return `${formatTimes(1 / r)} smaller`;
}

function formatTimes(r: number): string {
  if (r >= 1_000_000_000) return `${(r / 1_000_000_000).toFixed(1)} billion×`;
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1)} million×`;
  if (r >= 1_000) return `${(r / 1_000).toFixed(1)} thousand×`;
  return `${r.toFixed(r >= 20 ? 0 : 1)}×`;
}

export function formatDistance(opts: {
  distanceLy: number | null;
  redshift?: number;
}): string {
  if (opts.redshift != null && opts.redshift >= 0.05) {
    return `z = ${opts.redshift}`;
  }
  if (opts.distanceLy == null) return "Unknown";
  const ly = opts.distanceLy;
  if (ly >= 1_000_000_000) return `${(ly / 1_000_000_000).toFixed(1)} billion ly`;
  if (ly >= 1_000_000) return `${(ly / 1_000_000).toFixed(1)} million ly`;
  return `${Math.round(ly).toLocaleString("en-US")} ly`;
}

export function logMassT(mass: number, min: number, max: number): number {
  const a = Math.log10(min);
  const b = Math.log10(max);
  return (Math.log10(mass) - a) / (b - a);
}
