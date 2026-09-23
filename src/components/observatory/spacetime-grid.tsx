import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { BLACK_HOLES, visualRadius } from "@/data/black-holes";
import { useObservatory } from "@/store/observatory";

const GRID_VERT = /* glsl */ `
varying vec3 vWorldPos;
varying float vTotalDip;
varying vec2 vUv;

uniform vec3 uHoles[36];
uniform float uRadius[36];
uniform int uHoleCount;
uniform float uGridVisible;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Compute gravitational wells beneath each black hole
  // Note: PlaneGeometry is in local XY. When rotated -PI/2 around X:
  // local X -> world X, local Y -> world -Z, local Z -> world Y.
  float totalDip = 0.0;
  for (int i = 0; i < 36; i++) {
    if (i >= uHoleCount) break;
    vec3 h = uHoles[i];
    float r = uRadius[i];
    float dx = pos.x - h.x;
    float dz = pos.y - h.y;
    float distSq = dx * dx + dz * dz;

    // Relativistic gravitational funnel (Flamm's paraboloid profile)
    float dip = h.z / (1.0 + distSq / (r * r));
    totalDip += dip;
  }

  // Deform grid downwards along Z (which maps to -Y in world coordinates)
  pos.z -= totalDip * uGridVisible;
  vTotalDip = totalDip * uGridVisible;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const GRID_FRAG = /* glsl */ `
uniform float uGridVisible;
uniform float uTime;
varying vec3 vWorldPos;
varying float vTotalDip;
varying vec2 vUv;

void main() {
  if (uGridVisible < 0.01) discard;

  // Ultra-fine hairline grid coordinates ("baal ki tarah" crisp lines)
  vec2 coord = vWorldPos.xz * 1.0;
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / (fwidth(coord) * 0.72);
  float line = 1.0 - min(min(grid.x, grid.y), 1.0);

  // Major accent coordinate lines (spacing = 5 units)
  vec2 majorCoord = vWorldPos.xz * 0.2;
  vec2 majorGrid = abs(fract(majorCoord - 0.5) - 0.5) / (fwidth(majorCoord) * 0.85);
  float majorLine = 1.0 - min(min(majorGrid.x, majorGrid.y), 1.0);

  // Refined deep space palette: dark cosmic indigo to electric cyan well glow
  vec3 flatColor = vec3(0.08, 0.22, 0.38);
  vec3 wellColor = vec3(0.18, 0.85, 0.96); // Vibrant pure cyan in gravitational funnels

  vec3 gridColor = mix(flatColor, wellColor, clamp(vTotalDip * 0.35, 0.0, 1.0));

  // Soft boundary fade
  float edgeFade = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x) *
                   smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);

  // Delicate hairline opacity (crisp, not blocky)
  float alpha = (line * 0.42 + majorLine * 0.58) * edgeFade * uGridVisible;
  if (alpha < 0.005) discard;

  gl_FragColor = vec4(gridColor, alpha * 0.58);
}
`;

export function SpacetimeGrid({ compact }: { compact: boolean }) {
  const isEnabled = useObservatory((s) => s.spacetimeGrid);
  const scaleMode = useObservatory((s) => s.scaleMode);
  const matRef = useRef<ShaderMaterial>(null);
  const currentVisibility = useRef(isEnabled ? 1.0 : 0.0);

  const geom = useMemo(
    () => new PlaneGeometry(260, 90, compact ? 130 : 190, compact ? 50 : 75),
    [compact],
  );

  const { holesArray, radiiArray, count } = useMemo(() => {
    const holes: Vector3[] = [];
    const radii: number[] = [];

    BLACK_HOLES.forEach((h) => {
      const r = visualRadius(h.mass, scaleMode);
      // Gravitational well depth scales with mass category
      let depth = 2.0 + r * 1.5;
      if (h.category === "intermediate") depth = 3.6;
      else if (h.category === "supermassive") depth = 5.8;
      else if (h.category === "ultramassive") depth = 8.5;

      const influenceRadius = 1.8 + r * 1.4;
      // In PlaneGeometry rotated -PI/2 around X:
      // world X = pos.x -> h.position[0]
      // world Z = -pos.y -> -h.position[2]
      holes.push(new Vector3(h.position[0], -h.position[2], depth));
      radii.push(influenceRadius);
    });

    // Pad to 36
    while (holes.length < 36) {
      holes.push(new Vector3(0, 0, 0));
      radii.push(1);
    }

    return { holesArray: holes, radiiArray: radii, count: BLACK_HOLES.length };
  }, [scaleMode]);

  const uniforms = useMemo(
    () => ({
      uHoles: { value: holesArray },
      uRadius: { value: radiiArray },
      uHoleCount: { value: count },
      uGridVisible: { value: currentVisibility.current },
      uTime: { value: 0 },
    }),
    [holesArray, radiiArray, count],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const target = isEnabled ? 1.0 : 0.0;
    currentVisibility.current += (target - currentVisibility.current) * Math.min(1.0, dt * 6.0);

    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      matRef.current.uniforms.uGridVisible.value = currentVisibility.current;
    }
  });

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <mesh
      geometry={geom}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.6, 0]}
      renderOrder={0}
    >
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={DoubleSide}
        vertexShader={GRID_VERT}
        fragmentShader={GRID_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}
