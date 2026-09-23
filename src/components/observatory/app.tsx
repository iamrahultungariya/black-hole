import { Component, lazy, Suspense, type ReactNode } from "react";
import { useEffect, useState } from "react";
import { OverlayShell } from "@/components/overlay/shell";
import { useCompact } from "@/hooks/use-compact";

const ObservatoryCanvas = lazy(async () => {
  const mod = await import("./canvas");
  return { default: mod.ObservatoryCanvas };
});

export function ObservatoryApp() {
  const [mounted, setMounted] = useState(false);
  const compact = useCompact();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div className="absolute inset-0">
        {mounted ? (
          <WebGLGuard>
            <Suspense fallback={<StageFallback />}>
              <ObservatoryCanvas compact={compact} />
            </Suspense>
          </WebGLGuard>
        ) : (
          <StageFallback />
        )}
      </div>
      <OverlayShell compact={compact} />
    </main>
  );
}

function StageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg">
      <p className="font-display text-lg text-muted">Calibrating observatory</p>
    </div>
  );
}

class WebGLGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-bg px-6 text-center">
          <p className="max-w-sm text-sm text-muted">
            This observatory needs WebGL. Try another browser, or use the catalog on the left.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
