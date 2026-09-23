import { CameraControls, Html, Line, Stars } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { Color, AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from "three";
import {
  AXIS_TICKS,
  BLACK_HOLES,
  CENSUS_ID,
  massToPos,
  massToX,
  visualRadius,
  AXIS_SPAN,
} from "@/data/black-holes";
import { isHoleVisible, useObservatory } from "@/store/observatory";
import { BlackHoleMesh } from "./black-hole";
import { SpacetimeGrid } from "./spacetime-grid";

type ControlsHandle = {
  setLookAt: (
    px: number,
    py: number,
    pz: number,
    tx: number,
    ty: number,
    tz: number,
    enableTransition?: boolean,
  ) => Promise<unknown> | unknown;
};

export function ObservatoryScene({ compact }: { compact: boolean }) {
  return (
    <>
      <color attach="background" args={["#08090c"]} />
      <fog attach="fog" args={["#08090c", 22, 120]} />
      <ambientLight intensity={0.04} />
      <hemisphereLight args={["#8fa0b8", "#08090c", 0.18]} />
      <Stars
        radius={160}
        depth={70}
        count={compact ? 2200 : 6500}
        factor={2.6}
        saturation={0}
        fade
        speed={0.22}
      />
      <MassAxis compact={compact} />
      <Holes />
      <SpacetimeGrid compact={compact} />
      <UncountedField />
      <CompareLink />
      <CameraRig compact={compact} />
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.90}
          luminanceSmoothing={0.20}
          intensity={compact ? 0.30 : 0.40}
          mipmapBlur
        />
        {!compact && <Vignette eskil={false} offset={0.25} darkness={0.45} />}
      </EffectComposer>
    </>
  );
}

function Holes() {
  const categories = useObservatory((s) => s.categories);
  const query = useObservatory((s) => s.query);
  const visible = BLACK_HOLES.filter((h) => isHoleVisible(h.id, categories, query));
  return (
    <>
      {visible.map((h) => (
        <BlackHoleMesh key={h.id} data={h} />
      ))}
    </>
  );
}

function MassAxis({ compact }: { compact: boolean }) {
  const catalogOpen = useObservatory((s) => s.catalogOpen);
  const linePoints = useMemo<[number, number, number][]>(() => {
    const firstPos = BLACK_HOLES[0].position;
    const lastPos = BLACK_HOLES[BLACK_HOLES.length - 1].position;
    const start: [number, number, number] = [
      firstPos[0] - 8,
      firstPos[1] + 1.2,
      firstPos[2] - 1.8,
    ];
    const end: [number, number, number] = [
      lastPos[0] + 10,
      lastPos[1] - 1.4,
      lastPos[2] + 2.2,
    ];
    return [start, end];
  }, []);

  return (
    <group position={[0, -2.6, -1.0]}>
      <Line points={linePoints} color="#222834" lineWidth={1.2} />
      {AXIS_TICKS.map((tick) => {
        const [tx, ty, tz] = massToPos(tick.mass);
        const occludedBySidebar = catalogOpen && tx < -28;
        return (
          <group key={tick.mass} position={[tx, ty, tz]}>
            <Line
              points={[
                [0, -0.45, 0],
                [0, 0.45, 0],
              ]}
              color="#3a4456"
              lineWidth={1.2}
            />
            {!compact && !occludedBySidebar && (
              <Html position={[0, -1.8, 1.4]} center style={{ pointerEvents: "none" }}>
                <div className="font-mono text-[10px] font-medium tracking-wider text-muted/90 bg-black/75 px-1.5 py-0.5 rounded border border-border/40 select-none whitespace-nowrap shadow-sm">
                  {tick.label} M☉
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function UncountedField() {
  const select = useObservatory((s) => s.select);
  const selected = useObservatory((s) => s.selectedId === CENSUS_ID);
  const geom = useMemo(() => {
    const n = 1600;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random();
      const v = Math.random();
      positions[i * 3] = 118 + u * 24;
      positions[i * 3 + 1] = -12 + (v - 0.5) * 14;
      positions[i * 3 + 2] = 20 + (Math.random() - 0.5) * 16;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new PointsMaterial({
        color: new Color("#c9d1d8"),
        size: selected ? 0.18 : 0.11,
        transparent: true,
        opacity: selected ? 0.85 : 0.45,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
      }),
    [selected],
  );

  const ref = useRef<Points>(null);
  useFrame((_, raw) => {
    if (ref.current) ref.current.rotation.y += Math.min(raw, 0.1) * 0.02;
  });

  useEffect(() => () => {
    geom.dispose();
    mat.dispose();
  }, [geom, mat]);

  return (
    <points
      ref={ref}
      geometry={geom}
      material={mat}
      onClick={(e) => {
        e.stopPropagation();
        select(CENSUS_ID);
      }}
    />
  );
}

function CompareLink() {
  const ids = useObservatory((s) => s.compareIds);
  if (ids.length < 2) return null;
  const a = BLACK_HOLES.find((h) => h.id === ids[0]);
  const b = BLACK_HOLES.find((h) => h.id === ids[1]);
  if (!a || !b) return null;
  return (
    <Line
      points={[a.position, b.position]}
      color="#c9d1d8"
      lineWidth={1}
      dashed
      dashSize={0.55}
      gapSize={0.35}
      transparent
      opacity={0.55}
    />
  );
}

function CameraRig({ compact }: { compact: boolean }) {
  const controls = useRef<ControlsHandle | null>(null);
  const selectedId = useObservatory((s) => s.selectedId);
  const scaleMode = useObservatory((s) => s.scaleMode);
  const tourActive = useObservatory((s) => s.tourActive);
  const invalidate = useThree((s) => s.invalidate);
  const intro = useRef(true);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (intro.current) {
      intro.current = false;
      void c.setLookAt(
        compact ? 16 : 38,
        compact ? 18 : 26,
        compact ? 72 : 94,
        compact ? 0 : 16,
        compact ? 0 : -2,
        compact ? 0 : 2,
        false,
      );
      if (!selectedId) {
        void c.setLookAt(
          compact ? 16 : 38,
          compact ? 18 : 26,
          compact ? 72 : 94,
          compact ? 0 : 16,
          compact ? 0 : -2,
          compact ? 0 : 2,
          true,
        );
        return;
      }
    }

    if (!selectedId) {
      void c.setLookAt(
        compact ? 16 : 38,
        compact ? 18 : 26,
        compact ? 72 : 94,
        compact ? 0 : 16,
        compact ? 0 : -2,
        compact ? 0 : 2,
        true,
      );
      invalidate();
      return;
    }

    if (selectedId === CENSUS_ID) {
      void c.setLookAt(135, -4, 38, 122, -12, 20, true);
      invalidate();
      return;
    }

    const hole = BLACK_HOLES.find((h) => h.id === selectedId);
    if (!hole) return;
    const r = visualRadius(hole.mass, scaleMode);
    const dist = Math.max(compact ? 1.6 : 1.4, Math.min(r * (compact ? 4.2 : 3.6), compact ? 18 : 22));
    const [x, y, z] = hole.position;
    void c.setLookAt(x + dist * 0.74, y + dist * 0.42, z + dist * 0.74, x, y, z, true);
    invalidate();
  }, [selectedId, scaleMode, compact, tourActive, invalidate]);

  return (
    <CameraControls
      ref={controls as never}
      makeDefault
      minDistance={0.5}
      maxDistance={320}
      smoothTime={0.55}
      maxPolarAngle={Math.PI * 0.88}
      minPolarAngle={0.12}
      mouseButtons={{
        left: 1,
        wheel: 16,
        right: 2,
        middle: 2,
      }}
    />
  );
}
