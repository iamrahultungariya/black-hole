import { useCursor } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  type Group,
  type Mesh,
  type ShaderMaterial,
  type Texture,
} from "three";
import { visualRadius, type BlackHole as Hole, type Morphology } from "@/data/black-holes";
import { useObservatory } from "@/store/observatory";

let _dustTexture: CanvasTexture | null = null;
function getDustTexture(): CanvasTexture {
  if (_dustTexture) return _dustTexture;
  if (typeof document === "undefined") {
    return new CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.25)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  _dustTexture = new CanvasTexture(canvas);
  return _dustTexture;
}

function createCurvedLensingGeometry(): BufferGeometry {
  const radialSegments = 96;
  const ringSegments = 16;
  const innerR = 1.05;
  const outerR = 2.45;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= ringSegments; j++) {
    const v = j / ringSegments;
    const r = innerR + (outerR - innerR) * v;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const x = r * cosT;
      // Background disk light bends upward over the sphere and downward under
      const arch = Math.pow(Math.max(0, sinT), 1.25) * (1.18 + (r - innerR) * 0.45);
      const underArch = -Math.pow(Math.max(0, -sinT), 1.45) * (0.82 + (r - innerR) * 0.35);
      const y = arch + underArch;
      const z = r * sinT * 0.42 - (y * y) * 0.12;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < ringSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * (radialSegments + 1) + i;
      const b = (j + 1) * (radialSegments + 1) + i;
      const c = (j + 1) * (radialSegments + 1) + (i + 1);
      const d = j * (radialSegments + 1) + (i + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new BufferGeometry();
  geom.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Shared unit geometries
const SPHERE_GEOM = new SphereGeometry(1, 40, 28);
const DISK_GEOM = new RingGeometry(1.0, 3.2, 96, 12);
const LENS_GEOM = createCurvedLensingGeometry();
const PHOTON_GEOM = new TorusGeometry(1.08, 0.045, 16, 96);
const JET_GEOM = new CylinderGeometry(0.04, 0.32, 1.0, 20, 8, true);

const MORPHOLOGY_ID: Record<Morphology, number> = {
  quiescent: 0.0,
  eht_synchrotron: 1.0,
  microquasar: 2.0,
  quasar: 3.0,
  dusty_torus: 4.0,
  cD_giant: 5.0,
  standard: 6.0,
};

const DISK_VERT = /* glsl */ `
varying vec2 vLocalPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vLocalPos = position.xy;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const DISK_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uHot;
uniform vec3 uCool;
uniform float uInner;
uniform float uOuter;
uniform float uIntensity;
uniform float uLensing;
uniform float uMorphology;
uniform float uSpin;

varying vec2 vLocalPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

// Fast procedural hash
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 2D value noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 3-octave FBM for organic plasma swirls
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rot * p * 2.1 + vec2(2.1, 7.3);
    a *= 0.48;
  }
  return v;
}

void main() {
  float dist = length(vLocalPos);
  float rNorm = clamp((dist - uInner) / (uOuter - uInner), 0.0, 1.0);
  float theta = atan(vLocalPos.y, vLocalPos.x);

  // Keplerian differential rotation influenced by black hole Kerr spin
  float spinSpeed = 0.25 + uSpin * 0.35;
  float omega = (1.2 + uSpin * 0.6) / pow(0.30 + rNorm, 1.25);
  float angle = theta + uTime * omega * spinSpeed;

  // Multi-scale procedural gas swirls
  vec2 gasUV1 = vec2(rNorm * 2.8, angle * 1.8 - uTime * 0.05);
  vec2 gasUV2 = vec2(rNorm * 4.6 + 1.2, angle * 3.4 + uTime * 0.04);
  float gas1 = fbm(gasUV1);
  float gas2 = fbm(gasUV2 + gas1 * 1.2);
  float density = clamp(0.32 + 0.46 * gas1 + 0.26 * gas2, 0.0, 1.0);

  // Relativistic Doppler beaming
  float doppler = 0.55 + 0.45 * (sin(theta + 0.2) * 0.5 + 0.5);
  if (uLensing > 0.5) {
    doppler = 0.78 + 0.22 * sin(theta);
  }

  // Base heat & color ramp
  float heat = pow(1.0 - rNorm, 1.25);
  vec3 col = mix(uCool * 0.8, uHot, heat);

  // 1. Quiescent morphology (Gaia BH1, Gaia BH3, GW remnants)
  if (uMorphology < 0.5) {
    // Dormant black hole: pure relativistic spacetime lensing of background starlight
    float caustic = pow(sin(dist * 18.0 - uTime * 1.5) * 0.5 + 0.5, 2.5);
    float deflection = pow(1.0 - rNorm, 1.8);
    col = mix(vec3(0.65, 0.85, 1.0), vec3(0.95, 0.98, 1.0), caustic * 0.6 + deflection * 0.4) * 1.35;
    density = 0.55 + 0.45 * caustic;
  }
  // 2. EHT Synchrotron Ring (Sagittarius A*, Messier 87*)
  else if (abs(uMorphology - 1.0) < 0.5) {
    // Asymmetric Doppler crescent and 3 orbiting synchrotron emission knots
    float crescent = pow(sin(theta * 0.5 + 0.75) * 0.5 + 0.5, 2.2);
    float knots = 0.75 + 0.35 * sin(theta * 3.0 - uTime * 0.3);
    density = clamp(density * (0.35 + 1.4 * crescent) * knots, 0.05, 1.4);
    // Synchrotron radio coloring
    col = mix(uCool, uHot * 1.2, pow(1.0 - rNorm, 1.1) * (0.5 + 0.5 * crescent));
  }
  // 3. Microquasar (Cygnus X-1, GRS 1915, MAXI J1820)
  else if (abs(uMorphology - 2.0) < 0.5) {
    // Ultra-hot X-ray inner boundary: electric cyan/blue-white
    float xRayLip = smoothstep(0.0, 0.05, rNorm) * (1.0 - smoothstep(0.0, 0.25, rNorm));
    col = mix(col, vec3(0.82, 0.94, 1.0) * 1.6, xRayLip * 0.85);
  }
  // 4. Hyperluminous Quasar (TON 618, 3C 273, SDSS J0100)
  else if (abs(uMorphology - 3.0) < 0.5) {
    // Blinding coronal ionization with crisp contrast
    float corona = smoothstep(0.0, 0.08, rNorm) * (1.0 - smoothstep(0.0, 0.32, rNorm));
    col = mix(col, vec3(1.0, 0.97, 0.92) * 1.35, corona * 0.85);
    density *= 1.15;
  }
  // 5. Dusty Torus / Obscured (Centaurus A, Sombrero, V404 Cygni)
  else if (abs(uMorphology - 4.0) < 0.5) {
    // Dark molecular dust absorption lanes crossing the disk
    float dust = smoothstep(0.34, 0.66, fbm(vec2(rNorm * 5.5, theta * 4.0 + 1.8)));
    col = mix(col * 0.18, col, dust);
    density *= mix(0.45, 1.0, dust);
  }

  // Apply density, Doppler beaming, and uniform intensity
  col *= (0.42 + 0.58 * density) * (0.65 + 0.65 * doppler) * uIntensity;

  // Boundary falloffs
  float innerFade = smoothstep(0.0, 0.06, rNorm);
  float outerFade = pow(1.0 - rNorm, 1.4);
  float alpha = innerFade * outerFade * (0.35 + 0.65 * density) * uIntensity;

  if (uLensing > 0.5) {
    alpha *= 0.68;
  }

  // Quiescent holes have subtle translucent starlight lensing
  if (uMorphology < 0.5) {
    alpha = innerFade * outerFade * (0.40 + 0.60 * density) * 0.80 * uIntensity;
  }

  gl_FragColor = vec4(col, alpha);
}
`;

const JET_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const JET_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Center beam concentration
  float centerDist = abs(vUv.x - 0.5) * 2.0;
  float beam = pow(1.0 - centerDist, 2.2);

  // Longitudinal dissipation into deep space
  float nozzleFade = smoothstep(0.0, 0.05, vUv.y);
  float tipFade = pow(1.0 - vUv.y, 1.8);
  float lengthDecay = nozzleFade * tipFade;

  // Relativistic plasma knots streaming along magnetic field lines
  float pulse = 0.85 + 0.22 * sin(vUv.y * 20.0 - uTime * 5.0);

  // Fresnel edge glow
  float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 1.5);

  vec3 col = mix(uColor, vec3(1.0, 0.98, 0.94), 0.45 * beam) * 1.35;
  col *= (beam * 0.75 + fresnel * 0.25) * pulse * uIntensity;

  float alpha = lengthDecay * (beam * 0.8 + fresnel * 0.2) * 0.40 * uIntensity;
  gl_FragColor = vec4(col, alpha);
}
`;

function AccretionDust({
  data,
  isFocused,
}: {
  data: Hole;
  isFocused: boolean;
}) {
  const pointsRef = useRef<Points>(null);
  const count = isFocused ? 96 : 48;
  const isQuiescent = data.morphology === "quiescent";

  const { geom, angles, radii, speeds, heights } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const ang = new Float32Array(count);
    const rad = new Float32Array(count);
    const spd = new Float32Array(count);
    const hgt = new Float32Array(count);

    const inner = data.innerRadiusRatio * 1.05;
    const outer = data.outerRadiusRatio * 1.30;

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const r = inner + (outer - inner) * Math.pow(u, 1.5);
      const a = Math.random() * Math.PI * 2;
      const speed = (0.7 + data.spin * 0.6) / Math.pow(r, 1.25);
      const h = (Math.random() - 0.5) * 0.14 * r;

      ang[i] = a;
      rad[i] = r;
      spd[i] = speed;
      hgt[i] = h;

      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }

    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return { geom: g, angles: ang, radii: rad, speeds: spd, heights: hgt };
  }, [count, data.innerRadiusRatio, data.outerRadiusRatio, data.spin]);

  const mat = useMemo(
    () =>
      new PointsMaterial({
        map: getDustTexture(),
        color: new Color(isQuiescent ? "#d0e8ff" : data.hot),
        size: isFocused ? 0.040 : 0.024,
        transparent: true,
        opacity: isQuiescent ? 0.45 : isFocused ? 0.90 : 0.60,
        blending: AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [data.hot, isFocused, isQuiescent],
  );

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.08);
    const posAttr = pointsRef.current.geometry.attributes.position;
    if (!posAttr) return;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      angles[i] += speeds[i] * dt;
      const a = angles[i];
      const r = radii[i];
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = heights[i] + Math.sin(a * 2.0) * 0.03 * r;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    posAttr.needsUpdate = true;
  });

  useEffect(() => () => {
    geom.dispose();
    mat.dispose();
  }, [geom, mat]);

  return <points ref={pointsRef} geometry={geom} material={mat} renderOrder={4} />;
}

export function BlackHoleMesh({ data }: { data: Hole }) {
  const scaleMode = useObservatory((s) => s.scaleMode);
  const selectedId = useObservatory((s) => s.selectedId);
  const selected = selectedId === data.id;
  const anySelected = Boolean(selectedId);
  const hoveredId = useObservatory((s) => s.hoveredId);
  const compare = useObservatory((s) => s.compareIds.includes(data.id));
  const select = useObservatory((s) => s.select);
  const hover = useObservatory((s) => s.hover);
  const [localHover, setLocalHover] = useState(false);
  useCursor(localHover);

  const radius = visualRadius(data.mass, scaleMode);
  const group = useRef<Group>(null);
  const diskMat = useRef<ShaderMaterial>(null);
  const lensMat = useRef<ShaderMaterial>(null);
  const jetMatTop = useRef<ShaderMaterial>(null);
  const jetMatBottom = useRef<ShaderMaterial>(null);
  const photon = useRef<Mesh>(null);

  const morphologyId = MORPHOLOGY_ID[data.morphology];
  const isQuiescent = data.morphology === "quiescent";
  const baseBrightness = data.diskBrightness;

  const diskUniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 40 },
      uHot: { value: new Color(data.hot) },
      uCool: { value: new Color(data.cool) },
      uInner: { value: data.innerRadiusRatio },
      uOuter: { value: data.outerRadiusRatio },
      uIntensity: { value: baseBrightness },
      uLensing: { value: 0.0 },
      uMorphology: { value: morphologyId },
      uSpin: { value: data.spin },
    }),
    [data.hot, data.cool, data.innerRadiusRatio, data.outerRadiusRatio, baseBrightness, morphologyId, data.spin],
  );

  const lensUniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 40 },
      uHot: { value: new Color(data.hot) },
      uCool: { value: new Color(data.cool) },
      uInner: { value: Math.max(1.16, data.innerRadiusRatio * 0.95) },
      uOuter: { value: Math.min(2.4, data.outerRadiusRatio * 0.78) },
      uIntensity: { value: baseBrightness * data.lensingStrength * 0.9 },
      uLensing: { value: 1.0 },
      uMorphology: { value: morphologyId },
      uSpin: { value: data.spin },
    }),
    [data.hot, data.cool, data.innerRadiusRatio, data.outerRadiusRatio, baseBrightness, data.lensingStrength, morphologyId, data.spin],
  );

  const jetUniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 20 },
      uColor: { value: new Color(data.jetColor ?? data.hot) },
      uIntensity: { value: 1.0 },
    }),
    [data.jetColor, data.hot],
  );

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.08);

    // Depth-of-field focus
    let mult = 1.0;
    if (anySelected) {
      mult = selected ? 1.25 : 0.32;
    } else if (localHover) {
      mult = 1.2;
    }

    if (diskMat.current) {
      diskMat.current.uniforms.uTime.value += dt;
      diskMat.current.uniforms.uIntensity.value = baseBrightness * mult;
    }
    if (lensMat.current) {
      lensMat.current.uniforms.uTime.value += dt * 0.9;
      lensMat.current.uniforms.uIntensity.value = baseBrightness * data.lensingStrength * 0.9 * mult;
    }
    if (jetMatTop.current) {
      jetMatTop.current.uniforms.uTime.value += dt;
      jetMatTop.current.uniforms.uIntensity.value = mult;
    }
    if (jetMatBottom.current) {
      jetMatBottom.current.uniforms.uTime.value += dt;
      jetMatBottom.current.uniforms.uIntensity.value = mult;
    }
    if (photon.current) {
      photon.current.rotation.z += dt * (0.16 + data.spin * 0.22);
      const timeVal = diskMat.current?.uniforms.uTime.value ?? 0;
      const pulse = 1.0 + Math.sin(timeVal * 2.8) * 0.015;
      photon.current.scale.set(pulse, pulse, pulse);
    }
    if (group.current && selected) {
      group.current.rotation.y += dt * 0.04;
    }
  });

  const bind = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      select(data.id);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setLocalHover(true);
      hover(data.id);
    },
    onPointerOut: () => {
      setLocalHover(false);
      if (hoveredId === data.id) hover(null);
    },
  };

  const highlight = selected || compare;
  const jetLength = data.jetLength ?? 4.4;

  return (
    <group ref={group} position={data.position} rotation={data.tilt} scale={radius}>
      {/* Relativistic Gravitational Lensing Halo (Light bent over top/bottom) */}
      <mesh geometry={LENS_GEOM} rotation={[0, 0, 0]} renderOrder={1}>
        <shaderMaterial
          ref={lensMat}
          transparent
          depthWrite={false}
          depthTest
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
          vertexShader={DISK_VERT}
          fragmentShader={DISK_FRAG}
          uniforms={lensUniforms}
        />
      </mesh>

      {/* Event Horizon: Pure light-trapping black sphere (renders over background lensing) */}
      <mesh {...bind} geometry={SPHERE_GEOM} renderOrder={2}>
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>

      {/* Photon Sphere: Luminous Einstein ring at the shadow boundary */}
      <mesh ref={photon} geometry={PHOTON_GEOM} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <meshBasicMaterial
          color={isQuiescent ? "#d8efff" : data.hot}
          toneMapped={false}
        />
      </mesh>

      {/* Equatorial Accretion Disk (Swirling plasma in orbital plane) */}
      <mesh geometry={DISK_GEOM} rotation={[Math.PI / 2, 0, 0]} renderOrder={4} {...bind}>
        <shaderMaterial
          ref={diskMat}
          transparent
          depthWrite={false}
          depthTest
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
          vertexShader={DISK_VERT}
          fragmentShader={DISK_FRAG}
          uniforms={diskUniforms}
        />
      </mesh>

      {/* Orbiting Accretion Dust & Relativistic Sparks */}
      <AccretionDust data={data} isFocused={selected || localHover} />

      {/* Astrophysical Relativistic Plasma Jets */}
      {data.hasJets && (
        <group>
          {/* North Jet */}
          <mesh
            geometry={JET_GEOM}
            position={[0, jetLength * 0.5 + 0.2, 0]}
            scale={[1, jetLength, 1]}
          >
            <shaderMaterial
              ref={jetMatTop}
              transparent
              depthWrite={false}
              depthTest
              side={DoubleSide}
              blending={AdditiveBlending}
              toneMapped={false}
              vertexShader={JET_VERT}
              fragmentShader={JET_FRAG}
              uniforms={jetUniforms}
            />
          </mesh>
          {/* South Jet */}
          <mesh
            geometry={JET_GEOM}
            position={[0, -(jetLength * 0.5 + 0.2), 0]}
            rotation={[Math.PI, 0, 0]}
            scale={[1, jetLength, 1]}
          >
            <shaderMaterial
              ref={jetMatBottom}
              transparent
              depthWrite={false}
              depthTest
              side={DoubleSide}
              blending={AdditiveBlending}
              toneMapped={false}
              vertexShader={JET_VERT}
              fragmentShader={JET_FRAG}
              uniforms={jetUniforms}
            />
          </mesh>
        </group>
      )}

      {/* Selection / Compare Indicator Ring */}
      {highlight && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[data.outerRadiusRatio * 1.04, data.outerRadiusRatio * 1.06, 96]} />
          <meshBasicMaterial
            color="#e2e8f0"
            toneMapped={false}
            transparent
            opacity={selected ? 0.95 : 0.6}
            side={DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
