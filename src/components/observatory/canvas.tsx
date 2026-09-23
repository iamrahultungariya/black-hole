import { Canvas } from "@react-three/fiber";
import { ObservatoryScene } from "./scene";

export function ObservatoryCanvas({ compact }: { compact: boolean }) {
  return (
    <Canvas
      camera={{ position: [10, 26, 58], fov: compact ? 50 : 42, near: 0.08, far: 260 }}
      dpr={compact ? [1, 1.25] : [1, 1.75]}
      gl={{
        antialias: !compact,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ touchAction: "none" }}
      onPointerMissed={() => {
        /* keep selection; orbiting empty space should not deselect */
      }}
    >
      <ObservatoryScene compact={compact} />
    </Canvas>
  );
}
