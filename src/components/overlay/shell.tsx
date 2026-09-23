import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Compass,
  Crosshair,
  Grid3X3,
  Menu,
  Mouse,
  Move,
  Pin,
  PinOff,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import {
  BLACK_HOLES,
  BY_ID,
  CATEGORY_HINT,
  CATEGORY_LABEL,
  CENSUS,
  CENSUS_ID,
  MASS_MAX,
  MASS_MIN,
  MORPHOLOGY_LABEL,
  TOUR_STOPS,
  type BlackHole,
  type Category,
  type ScaleMode,
} from "@/data/black-holes";
import {
  formatDistance,
  formatMass,
  formatMassCompact,
  formatPhotonSphere,
  formatRatio,
  formatRs,
  logMassT,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { isHoleVisible, useObservatory } from "@/store/observatory";

const CATEGORIES: Category[] = ["stellar", "intermediate", "supermassive", "ultramassive"];
const SCALES: { id: ScaleMode; label: string }[] = [
  { id: "log", label: "Log" },
  { id: "true", label: "True" },
  { id: "equal", label: "Equal" },
];

export function OverlayShell({ compact }: { compact: boolean }) {
  const reduce = useReducedMotion();
  const selectedId = useObservatory((s) => s.selectedId);
  const catalogOpen = useObservatory((s) => s.catalogOpen);
  const setCatalogOpen = useObservatory((s) => s.setCatalogOpen);
  const cycle = useObservatory((s) => s.cycle);
  const select = useObservatory((s) => s.select);
  const startTour = useObservatory((s) => s.startTour);
  const stopTour = useObservatory((s) => s.stopTour);
  const nextTour = useObservatory((s) => s.nextTour);
  const prevTour = useObservatory((s) => s.prevTour);
  const tourActive = useObservatory((s) => s.tourActive);
  const compareIds = useObservatory((s) => s.compareIds);

  useEffect(() => {
    if (compact) setCatalogOpen(false);
  }, [compact, setCatalogOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (tourActive) nextTour();
        else cycle(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (tourActive) prevTour();
        else cycle(-1);
      } else if (e.key === "Escape") {
        if (tourActive) stopTour();
        else select(null);
      } else if (e.key === "t" || e.key === "T") {
        if (tourActive) stopTour();
        else startTour();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle, nextTour, prevTour, select, startTour, stopTour, tourActive]);

  const duration = reduce ? 0 : 0.28;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <TopChrome compact={compact} />

      {/* Top Right Mass Scale Badge */}
      {!compact && <TopRightMassScaleCard />}

      {/* Left Collapsible Catalog Sidebar */}
      {!compact && (
        <AnimatePresence>
          {catalogOpen ? (
            <motion.aside
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto absolute top-20 bottom-6 left-5 flex w-84 flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface/95 shadow-hairline backdrop-blur-md"
            >
              <CatalogBody onClose={() => setCatalogOpen(false)} />
            </motion.aside>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto absolute top-20 left-5"
            >
              <Button
                variant="outline"
                onClick={() => setCatalogOpen(true)}
                className="gap-2 rounded-xl border-border/70 bg-surface/90 px-3.5 py-2 shadow-hairline backdrop-blur-md hover:bg-surface-2"
              >
                <Menu className="size-4 text-cyan-400" />
                <span className="font-display text-xs font-medium text-fg">Black Holes</span>
                <span className="rounded-full bg-cyan-950/80 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  {BLACK_HOLES.length}
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Right Detail Inspection Drawer (Collapsible) */}
      {!compact && selectedId && (
        <motion.aside
          key={selectedId}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute top-20 right-5 bottom-28 flex w-96 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface/95 shadow-hairline backdrop-blur-md"
        >
          <DetailBody />
        </motion.aside>
      )}

      {/* Mobile Drawer Navigation */}
      {compact && (
        <MobileChrome
          catalogOpen={catalogOpen}
          onCatalog={setCatalogOpen}
        />
      )}

      {/* Active Tour Stepper */}
      <TourBar compact={compact} />

      {/* Bottom Center Horizontal Timeline Scrubber */}
      <HorizontalNavigator compact={compact} />

      {/* Bottom Right HUD Controls Guide */}
      {!compact && !selectedId && <ControlHelperHUD />}

      {/* Comparison Drawer */}
      {compareIds.length > 0 && !tourActive && <CompareTray compact={compact} />}

      {/* Modals for Learn & About tabs */}
      <InfoModals />
    </div>
  );
}

function BlackHoleGlyph({ className = "size-7" }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0 flex items-center justify-center rounded-full p-0.5", className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/40 via-amber-400/50 to-blue-500/40 blur-[2px] animate-pulse" />
      <div className="relative size-full rounded-full border border-cyan-400/70 bg-black flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.4)]">
        <div className="size-2 rounded-full bg-black shadow-[inset_0_0_3px_rgba(255,255,255,0.9)]" />
      </div>
    </div>
  );
}

const BlackHoleThumbnail = React.memo(function BlackHoleThumbnail({ hole }: { hole: BlackHole }) {
  const isQuiescent = hole.morphology === "quiescent";
  const hasJets = Boolean(hole.hasJets);

  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-black/95 border border-border/60 flex items-center justify-center shadow-inner">
      {/* Relativistic Jet Beams */}
      {hasJets && (
        <div
          className="absolute inset-x-0 mx-auto w-0.5 h-full opacity-75 blur-[0.5px]"
          style={{ background: `linear-gradient(to bottom, transparent, ${hole.jetColor ?? hole.hot}, transparent)` }}
        />
      )}
      {/* Accretion Disk Glow */}
      <div
        className="absolute size-7 rounded-full blur-[1px] opacity-80"
        style={{
          background: isQuiescent
            ? "radial-gradient(circle, rgba(160,210,255,0.7) 25%, transparent 70%)"
            : `radial-gradient(circle, ${hole.hot} 20%, ${hole.cool} 60%, transparent 80%)`,
        }}
      />
      {/* Upper/Lower Curved Einstein Lensing Ring */}
      <div
        className="absolute size-6 rounded-full border shadow-sm"
        style={{
          borderColor: isQuiescent ? "#c8e4ff" : hole.hot,
          transform: "scaleY(0.44) rotate(-18deg)",
          background: `linear-gradient(90deg, ${hole.hot} 0%, transparent 60%, ${hole.cool} 100%)`,
        }}
      />
      {/* Pure Black Event Horizon Core */}
      <div className="relative size-3 rounded-full bg-black border border-black shadow-[0_0_4px_rgba(0,0,0,1)]" />
    </div>
  );
});

function TopChrome({ compact }: { compact: boolean }) {
  const scaleMode = useObservatory((s) => s.scaleMode);
  const setScaleMode = useObservatory((s) => s.setScaleMode);
  const tourActive = useObservatory((s) => s.tourActive);
  const startTour = useObservatory((s) => s.startTour);
  const stopTour = useObservatory((s) => s.stopTour);
  const spacetimeGrid = useObservatory((s) => s.spacetimeGrid);
  const toggleSpacetimeGrid = useObservatory((s) => s.toggleSpacetimeGrid);
  const activeNavTab = useObservatory((s) => s.activeNavTab);
  const setActiveNavTab = useObservatory((s) => s.setActiveNavTab);

  return (
    <header className="pointer-events-none absolute top-0 right-0 left-0 flex items-center justify-between gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
      {/* Left: Brand Identity */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
        <BlackHoleGlyph className="size-6 sm:size-8" />
        <div>
          <h1 className="font-display text-base font-semibold leading-tight text-fg tracking-tight sm:text-2xl">
            Event Horizon
          </h1>
          {!compact && (
            <p className="text-[11px] text-muted">
              A 3D mass observatory of weighed black holes
            </p>
          )}
        </div>
      </div>

      {/* Center: Navigation Pill Tabs (Explore / Learn / About) */}
      {!compact && (
        <nav
          role="tablist"
          aria-label="Navigation sections"
          className="pointer-events-auto flex items-center rounded-full border border-border/70 bg-surface/90 p-1 shadow-hairline backdrop-blur-md"
        >
          {(["explore", "learn", "about"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeNavTab === tab}
              onClick={() => setActiveNavTab(tab)}
              className={cn(
                "h-7 rounded-full px-4 text-xs font-medium capitalize transition-all duration-150",
                activeNavTab === tab
                  ? "bg-surface-2 text-fg shadow-sm"
                  : "text-muted hover:text-fg",
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      )}

      {/* Right: Controls Toolbar */}
      <div className="pointer-events-auto flex items-center justify-end gap-1 sm:gap-2">
        <Button
          variant={spacetimeGrid ? "primary" : "outline"}
          onClick={toggleSpacetimeGrid}
          className={cn(
            "h-7 sm:h-9 px-2 sm:px-3.5 text-[11px] sm:text-sm gap-1 transition-colors rounded-lg",
            spacetimeGrid && "bg-cyan-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30",
          )}
          title="Toggle Spacetime Curvature Grid & Gravity Wells"
        >
          <Grid3X3 className="size-3 sm:size-4" />
          {compact ? "Grid" : "Gravity Grid"}
        </Button>

        <div
          role="tablist"
          aria-label="Size scale"
          className="flex h-7 sm:h-9 items-center rounded-lg bg-surface/90 border border-border/60 p-0.5 shadow-hairline backdrop-blur-md"
        >
          {SCALES.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={scaleMode === s.id}
              onClick={() => setScaleMode(s.id)}
              className={cn(
                "h-6 sm:h-8 rounded-md px-1.5 sm:px-3 text-[11px] sm:text-xs transition-[background-color,color] duration-150",
                scaleMode === s.id ? "bg-surface-2 text-fg font-medium" : "text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Button
          variant={tourActive ? "primary" : "outline"}
          onClick={() => (tourActive ? stopTour() : startTour())}
          className="h-7 sm:h-9 px-2 sm:px-3 text-[11px] sm:text-sm rounded-lg"
          title="Start Tour"
        >
          <Compass className="size-3 sm:size-4" />
          {!compact && (tourActive ? "End tour" : "Mass tour")}
        </Button>
      </div>
    </header>
  );
}

function TopRightMassScaleCard() {
  return (
    <div className="pointer-events-auto absolute top-18 right-6 z-20 flex items-center gap-3.5 rounded-xl border border-border/70 bg-surface/90 px-3.5 py-2 shadow-hairline backdrop-blur-md">
      <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
        <Activity className="size-4" />
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-wider text-muted uppercase">Mass Scale</p>
        <p className="font-display text-xs font-semibold text-fg tracking-wide">
          10⁰ – 10¹⁰ M☉
        </p>
      </div>
      <div className="h-5 w-px bg-border/60" />
      <p className="text-[11px] italic text-muted max-w-[155px] leading-tight">
        “From stellar remnants to cosmic giants.”
      </p>
    </div>
  );
}

function CatalogBody({ onClose }: { onClose?: () => void }) {
  const query = useObservatory((s) => s.query);
  const setQuery = useObservatory((s) => s.setQuery);
  const selectedCategory = useObservatory((s) => s.selectedCategory);
  const setSelectedCategory = useObservatory((s) => s.setSelectedCategory);
  const selectedId = useObservatory((s) => s.selectedId);
  const select = useObservatory((s) => s.select);
  const hover = useObservatory((s) => s.hover);
  const categories = useObservatory((s) => s.categories);

  const visible = useMemo(
    () => BLACK_HOLES.filter((h) => isHoleVisible(h.id, categories, query)),
    [categories, query],
  );

  return (
    <>
      {/* Header */}
      <div className="border-b border-border/70 px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-kicker text-muted uppercase">
              Known Masses
            </p>
            <h2 className="font-display text-lg font-semibold text-fg tracking-tight">
              Black Holes
            </h2>
            <p className="text-xs text-muted">
              Explore observed black holes across the mass scale.
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted hover:text-fg"
              aria-label="Collapse sidebar"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Search Input with Filter Icon */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or host galaxy..."
            className="h-9 w-full rounded-lg border border-border/70 bg-surface-2/80 pr-9 pl-9 text-xs text-fg outline-none placeholder:text-muted focus:border-cyan-500/50"
          />
          <SlidersHorizontal className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted" />
        </div>

        {/* Category Filter Pills: All | Stellar | Intermediate | Supermassive | Ultramassive */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "h-6 rounded-md px-2 text-[11px] font-medium transition-all",
              selectedCategory === "all"
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                : "text-muted hover:text-fg bg-surface-2/60",
            )}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={cn(
                "h-6 rounded-md px-2 text-[11px] font-medium transition-all",
                selectedCategory === c
                  ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                  : "text-muted hover:text-fg bg-surface-2/60",
              )}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Black Hole List with Visual Thumbnails */}
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {visible.map((h) => {
          const active = selectedId === h.id;
          return (
            <li key={h.id}>
              <button
                onClick={() => select(h.id)}
                onPointerEnter={() => hover(h.id)}
                onPointerLeave={() => hover(null)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all duration-150",
                  active
                    ? "border border-cyan-500/70 bg-cyan-950/25 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    : "border border-transparent hover:bg-surface-2/70",
                )}
              >
                {/* Visual Thumbnail */}
                <BlackHoleThumbnail hole={h} />

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-fg">
                      {h.name}
                    </span>
                    <span className="font-mono text-xs text-muted tabular-nums">
                      {formatMassCompact(h.mass)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span className="truncate">{MORPHOLOGY_LABEL[h.morphology]}</span>
                    <span className="shrink-0 font-mono text-[9px] text-muted/80">a* {h.spin}</span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-xs text-muted">
            No black holes found.
          </li>
        )}
      </ul>

      {/* Bottom Census Card */}
      <button
        onClick={() => select(CENSUS_ID)}
        className={cn(
          "border-t border-border/70 px-4 py-3 text-left transition-all duration-150 hover:bg-surface-2",
          selectedId === CENSUS_ID && "bg-cyan-950/25 border-cyan-500/50",
        )}
      >
        <p className="font-mono text-[10px] tracking-kicker text-muted uppercase">Census</p>
        <p className="mt-0.5 text-xs font-semibold text-fg">The unweighed remainder</p>
        <p className="text-[11px] text-muted">
          {CENSUS.observableStellar} stellar-mass holes estimated
        </p>
      </button>
    </>
  );
}

function DetailBody() {
  const selectedId = useObservatory((s) => s.selectedId);
  const select = useObservatory((s) => s.select);
  const compareIds = useObservatory((s) => s.compareIds);
  const toggleCompare = useObservatory((s) => s.toggleCompare);
  const sgr = BY_ID["sgr-a"];

  if (selectedId === CENSUS_ID) {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-5">
        <HeaderClose title="Observable census" kicker="Uncounted" onClose={() => select(null)} />
        <p className="mt-4 text-xs leading-relaxed text-muted">
          This gallery is every black hole with a published mass worth comparing — not every
          black hole that exists. Stellar remnants in quiet binaries are almost invisible.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-2.5">
          <Stat label="In this catalog" value={String(CENSUS.catalogCount)} />
          <Stat label="Milky Way (est.)" value={CENSUS.milkyWayStellar} />
          <Stat label="Observable universe" value={CENSUS.observableStellar} />
          <Stat label="Source" value="ApJ 2022" />
        </dl>
        <p className="mt-5 text-[11px] leading-relaxed text-muted/70">
          Sicilia, Lapi, et al. 2022 estimate ~40 quintillion stellar-mass holes in the
          observable universe. Almost none of them have been weighed.
        </p>
      </div>
    );
  }

  const hole = selectedId ? BY_ID[selectedId] : undefined;
  if (!hole) return null;
  const pinned = compareIds.includes(hole.id);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <HeaderClose
        kicker={`${CATEGORY_LABEL[hole.category]} · ${MORPHOLOGY_LABEL[hole.morphology]}`}
        title={hole.name}
        onClose={() => select(null)}
      />
      {hole.aka && <p className="mt-1 text-xs text-muted">{hole.aka}</p>}
      <p className="font-display mt-3 text-2xl font-bold leading-none tracking-tight text-fg tabular-nums">
        {formatMass(hole.mass)}
      </p>
      {hole.massNote && <p className="mt-1 text-[11px] text-muted/80">{hole.massNote}</p>}
      {hole.debated && (
        <p className="mt-1.5 text-xs text-amber-400">Mass is disputed across methods.</p>
      )}
      <p className="mt-3.5 text-xs leading-relaxed text-muted">{hole.blurb}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat
          label="Kerr Spin (a*)"
          value={hole.spin >= 0.95 ? `${hole.spin} (near-maximal)` : String(hole.spin)}
        />
        <Stat label="Schwarzschild radius" value={formatRs(hole.mass)} />
        <Stat label="Photon sphere" value={formatPhotonSphere(hole.mass)} />
        <Stat
          label="Distance"
          value={formatDistance({ distanceLy: hole.distanceLy, redshift: hole.redshift })}
        />
        <Stat label="Host" value={hole.host} />
        <Stat label="Identified" value={String(hole.discovered)} />
        {sgr && hole.id !== "sgr-a" && (
          <Stat label="vs Sagittarius A*" value={formatRatio(hole.mass, sgr.mass)} />
        )}
      </dl>
      {hole.event && (
        <p className="mt-3.5 font-mono text-[11px] tracking-wide text-cyan-300">{hole.event}</p>
      )}
      <p className="mt-3.5 text-[11px] leading-relaxed text-muted/70">{CATEGORY_HINT[hole.category]}</p>
      <div className="mt-4 flex gap-2">
        <Button variant={pinned ? "primary" : "outline"} size="sm" onClick={() => toggleCompare(hole.id)}>
          {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          {pinned ? "Unpin" : "Compare"}
        </Button>
      </div>
    </div>
  );
}

function HeaderClose({
  kicker,
  title,
  onClose,
}: {
  kicker: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] tracking-kicker text-muted uppercase">{kicker}</p>
        <h2 className="font-display mt-0.5 text-xl font-bold leading-tight text-fg">{title}</h2>
      </div>
      <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="size-7 rounded-lg">
        <X className="size-4" />
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2/90 border border-border/50 px-2.5 py-2">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-fg tabular-nums">{value}</dd>
    </div>
  );
}

function HorizontalNavigator({ compact }: { compact: boolean }) {
  const selectedId = useObservatory((s) => s.selectedId);
  const select = useObservatory((s) => s.select);
  const cycle = useObservatory((s) => s.cycle);
  const tourActive = useObservatory((s) => s.tourActive);

  if (tourActive) return null;

  const currentIndex = selectedId
    ? BLACK_HOLES.findIndex((h) => h.id === selectedId)
    : -1;
  const currentHole = currentIndex >= 0 ? BLACK_HOLES[currentIndex] : null;

  const pct = currentIndex >= 0
    ? (currentIndex / (BLACK_HOLES.length - 1)) * 100
    : 50;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 rounded-2xl border border-border/70 bg-surface/90 px-4 py-2.5 shadow-hairline backdrop-blur-md transition-all min-w-[290px] sm:min-w-[380px]",
        compact
          ? selectedId
            ? "bottom-[calc(38dvh+5.5rem)] max-w-[calc(100vw-1.5rem)]"
            : "bottom-20 max-w-[calc(100vw-1.5rem)]"
          : "bottom-6",
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-display text-xs font-semibold text-fg tracking-wide">
          Horizontal Axis
        </span>
        {currentHole && (
          <span className="font-mono text-[11px] text-cyan-300 truncate max-w-[160px]">
            {currentHole.name} ({formatMassCompact(currentHole.mass)} M☉)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 w-full mt-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg hover:bg-surface-2 text-muted hover:text-fg"
          aria-label="Previous black hole"
          onClick={() => cycle(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Custom Slider with White Circular Knob Handle */}
        <div className="relative flex-1 flex items-center h-4 cursor-pointer">
          <div className="h-1.5 w-full rounded-full bg-border/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div
            className="absolute size-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)] -translate-x-1/2 pointer-events-none transition-all duration-75 border border-black/20"
            style={{ left: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={BLACK_HOLES.length - 1}
            value={currentIndex >= 0 ? currentIndex : 0}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              select(BLACK_HOLES[idx].id);
            }}
            aria-label="Horizontal mass timeline drag slider"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg hover:bg-surface-2 text-muted hover:text-fg"
          aria-label="Next black hole"
          onClick={() => cycle(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Category Labels under the slider */}
      <div className="flex items-center justify-between w-full px-3 sm:px-7 font-mono text-[9px] sm:text-[10px] text-muted tracking-wider gap-2">
        <button
          onClick={() => select(BLACK_HOLES[0].id)}
          className="hover:text-cyan-300 transition-colors cursor-pointer"
        >
          Stellar
        </button>
        <button
          onClick={() => select("hlx-1")}
          className="hover:text-cyan-300 transition-colors cursor-pointer"
        >
          Intermediate
        </button>
        <button
          onClick={() => select("m87")}
          className="hover:text-cyan-300 transition-colors cursor-pointer"
        >
          Supermassive
        </button>
      </div>
    </div>
  );
}

function ControlHelperHUD() {
  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-20 hidden md:flex flex-col gap-2 rounded-2xl border border-border/70 bg-surface/85 p-3.5 shadow-hairline backdrop-blur-md font-mono text-[11px] text-muted">
      <div className="flex items-center gap-2.5">
        <Move className="size-3.5 text-cyan-400" />
        <span>Drag to rotate</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Mouse className="size-3.5 text-cyan-400" />
        <span>Scroll to zoom</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Crosshair className="size-3.5 text-cyan-400" />
        <span>Click a black hole to focus</span>
      </div>
    </div>
  );
}

function TourBar({ compact }: { compact: boolean }) {
  const tourActive = useObservatory((s) => s.tourActive);
  const tourIndex = useObservatory((s) => s.tourIndex);
  const nextTour = useObservatory((s) => s.nextTour);
  const prevTour = useObservatory((s) => s.prevTour);
  const stopTour = useObservatory((s) => s.stopTour);
  const reduce = useReducedMotion();
  if (!tourActive) return null;
  const stop = TOUR_STOPS[tourIndex];
  if (!stop) return null;
  const last = tourIndex >= TOUR_STOPS.length - 1;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "pointer-events-auto absolute right-4 left-4 rounded-2xl bg-surface/95 p-4 shadow-hairline border border-border/70 backdrop-blur-md z-30",
        compact ? "bottom-20" : "bottom-6 left-1/2 w-[min(36rem,calc(100vw-22rem))] -translate-x-1/2",
      )}
    >
      <p className="font-mono text-[10px] tracking-kicker text-muted uppercase">
        {stop.kicker} · {tourIndex + 1} / {TOUR_STOPS.length}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-fg">{stop.line}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Previous stop" onClick={prevTour} className="size-7 rounded-lg">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={stopTour} className="rounded-lg">
          Close
        </Button>
        <Button size="sm" onClick={nextTour} className="ml-auto rounded-lg">
          {last ? "Finish" : "Next"}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function CompareTray({ compact }: { compact: boolean }) {
  const compareIds = useObservatory((s) => s.compareIds);
  const clearCompare = useObservatory((s) => s.clearCompare);
  const select = useObservatory((s) => s.select);
  const a = compareIds[0] ? BY_ID[compareIds[0]] : undefined;
  const b = compareIds[1] ? BY_ID[compareIds[1]] : undefined;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute rounded-2xl border border-border/70 bg-surface/95 p-4 shadow-hairline backdrop-blur-md z-20",
        compact
          ? "bottom-20 right-3 left-3"
          : "bottom-6 left-1/2 -translate-x-1/2 w-[min(36rem,calc(100vw-26rem))]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold text-fg">
          <Columns2 className="size-4 text-muted" />
          Compare
        </p>
        <Button variant="ghost" size="sm" onClick={clearCompare} className="text-xs">
          Clear
        </Button>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {[a, b].map((hole, i) => (
          <button
            key={hole?.id ?? i}
            onClick={() => hole && select(hole.id)}
            className="rounded-lg bg-surface-2/90 border border-border/50 p-2.5 text-left"
          >
            <p className="truncate text-xs font-semibold text-fg">{hole ? hole.name : "Pin a second hole"}</p>
            <p className="font-mono text-[10px] text-muted tabular-nums">
              {hole ? formatMass(hole.mass) : "Use Compare on a card"}
            </p>
          </button>
        ))}
      </div>
      {a && b && (
        <p className="mt-2.5 text-xs text-muted">
          <span className="text-fg font-medium">{a.mass >= b.mass ? a.name : b.name}</span> is{" "}
          <span className="text-cyan-300 font-mono">
            {formatRatio(Math.max(a.mass, b.mass), Math.min(a.mass, b.mass))}
          </span>{" "}
          the mass of {a.mass >= b.mass ? b.name : a.name}.
        </p>
      )}
    </div>
  );
}

function MobileChrome({
  catalogOpen,
  onCatalog,
}: {
  catalogOpen: boolean;
  onCatalog: (open: boolean) => void;
}) {
  const selectedId = useObservatory((s) => s.selectedId);
  const select = useObservatory((s) => s.select);
  const tourActive = useObservatory((s) => s.tourActive);

  return (
    <>
      <Drawer.Root open={catalogOpen} onOpenChange={onCatalog}>
        <Drawer.Portal>
          <Drawer.Overlay className="pointer-events-auto fixed inset-0 z-40 bg-bg/70" />
          <Drawer.Content className="pointer-events-auto fixed right-0 bottom-0 left-0 z-50 flex h-[78dvh] flex-col rounded-t-2xl bg-surface shadow-hairline">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
            <div className="flex min-h-0 flex-1 flex-col pt-2">
              <CatalogBody onClose={() => onCatalog(false)} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {selectedId && !tourActive && (
        <div className="pointer-events-auto absolute right-3 bottom-20 left-3 max-h-[38dvh] overflow-y-auto rounded-2xl bg-surface/95 shadow-hairline border border-border/70 backdrop-blur-md">
          <DetailBody />
        </div>
      )}

      <nav className="pointer-events-auto absolute right-3 bottom-3 left-3 flex h-14 items-center justify-between rounded-2xl bg-surface/95 border border-border/70 px-3 shadow-hairline backdrop-blur-md z-30">
        <Button variant="ghost" onClick={() => onCatalog(true)} className="gap-2 text-xs">
          <Menu className="size-4" />
          Catalog ({BLACK_HOLES.length})
        </Button>
        {selectedId && (
          <Button variant="ghost" onClick={() => select(null)} className="gap-1.5 text-xs text-muted hover:text-fg">
            <X className="size-4" />
            Clear
          </Button>
        )}
      </nav>
    </>
  );
}

function InfoModals() {
  const activeNavTab = useObservatory((s) => s.activeNavTab);
  const setActiveNavTab = useObservatory((s) => s.setActiveNavTab);

  if (activeNavTab === "explore") return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/70 bg-surface/95 p-6 shadow-2xl backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 size-8 rounded-lg"
          onClick={() => setActiveNavTab("explore")}
        >
          <X className="size-4" />
        </Button>

        {activeNavTab === "learn" ? (
          <div>
            <p className="font-mono text-xs tracking-kicker text-cyan-400 uppercase">Astrophysics</p>
            <h2 className="font-display mt-1 text-2xl font-bold text-fg">Physics of the Event Horizon</h2>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
              <p>
                <strong className="text-fg">Schwarzschild Radius ($R_s = 2GM/c^2$):</strong> The radius of the event horizon for a non-rotating black hole. Nothing, not even light, can escape from inside this boundary.
              </p>
              <p>
                <strong className="text-fg">Photon Sphere ($1.5 R_s$):</strong> The spherical boundary where photons orbit on unstable circular paths. Light bent around this sphere produces the iconic Einstein ring.
              </p>
              <p>
                <strong className="text-fg">Relativistic Accretion & Doppler Beaming:</strong> Infalling plasma spirals inward at up to 40% the speed of light. Due to special relativity, the side moving toward the observer appears blindingly bright and blue-shifted.
              </p>
              <p>
                <strong className="text-fg">Gravitational Lensing:</strong> Light rays from the rear of the accretion disk curve over and under the black hole shadow, creating the dual arched silhouettes seen in Kip Thorne's simulations and *Interstellar*.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-mono text-xs tracking-kicker text-cyan-400 uppercase">Observatory</p>
            <h2 className="font-display mt-1 text-2xl font-bold text-fg">About Event Horizon</h2>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
              <p>
                <strong className="text-fg">Event Horizon</strong> is an interactive 3D mass observatory that visualizes astrophysically confirmed black holes across 11 orders of magnitude — from stellar-mass binary remnants to ultramassive quasars.
              </p>
              <p>
                <strong className="text-fg">Data Sources & Citations:</strong>
                <br />• Sicilia, Lapi, et al. 2022 (ApJ) — Stellar-mass black hole population census
                <br />• Event Horizon Telescope (EHT) Collaboration — Sgr A* and M87* shadow imaging
                <br />• LIGO-Virgo-KAGRA Collaboration — Gravitational-wave merger remnants
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={() => setActiveNavTab("explore")} className="rounded-lg">
            Back to Observatory
          </Button>
        </div>
      </div>
    </div>
  );
}
