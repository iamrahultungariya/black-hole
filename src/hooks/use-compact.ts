import { useEffect, useState } from "react";

export function useCompact(query = "(max-width: 767px)") {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return compact;
}
