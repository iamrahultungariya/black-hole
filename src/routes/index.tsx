import { createFileRoute } from "@tanstack/react-router";
import { ObservatoryApp } from "@/components/observatory/app";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <ObservatoryApp />;
}
