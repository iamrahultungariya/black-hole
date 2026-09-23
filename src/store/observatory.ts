import { create } from "zustand";
import {
  BLACK_HOLES,
  BY_ID,
  CENSUS_ID,
  TOUR_STOPS,
  type Category,
  type ScaleMode,
} from "@/data/black-holes";

export interface ObservatoryState {
  selectedId: string | null;
  hoveredId: string | null;
  compareIds: string[];
  scaleMode: ScaleMode;
  categories: Record<Category, boolean>;
  selectedCategory: "all" | Category;
  setSelectedCategory: (cat: "all" | Category) => void;
  activeNavTab: "explore" | "learn" | "about";
  setActiveNavTab: (tab: "explore" | "learn" | "about") => void;
  query: string;
  catalogOpen: boolean;
  toggleCatalog: () => void;
  tourActive: boolean;
  tourIndex: number;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  spacetimeGrid: boolean;
  toggleSpacetimeGrid: () => void;
  setScaleMode: (mode: ScaleMode) => void;
  toggleCategory: (category: Category) => void;
  setQuery: (query: string) => void;
  setCatalogOpen: (open: boolean) => void;
  startTour: () => void;
  nextTour: () => void;
  prevTour: () => void;
  stopTour: () => void;
  cycle: (dir: 1 | -1) => void;
}

const ALL_ON: Record<Category, boolean> = {
  stellar: true,
  intermediate: true,
  supermassive: true,
  ultramassive: true,
};

export function isHoleVisible(
  id: string,
  categories: Record<Category, boolean>,
  query: string,
): boolean {
  if (id === CENSUS_ID) return true;
  const hole = BY_ID[id];
  if (!hole) return false;
  if (!categories[hole.category]) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    hole.name.toLowerCase().includes(q) ||
    (hole.aka?.toLowerCase().includes(q) ?? false) ||
    hole.host.toLowerCase().includes(q)
  );
}

export const useObservatory = create<ObservatoryState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  compareIds: [],
  scaleMode: "log",
  categories: { ...ALL_ON },
  selectedCategory: "all",
  setSelectedCategory: (cat) => {
    if (cat === "all") {
      set({
        selectedCategory: "all",
        categories: { ...ALL_ON },
      });
    } else {
      set({
        selectedCategory: cat,
        categories: {
          stellar: cat === "stellar",
          intermediate: cat === "intermediate",
          supermassive: cat === "supermassive",
          ultramassive: cat === "ultramassive",
        },
      });
    }
  },
  activeNavTab: "explore",
  setActiveNavTab: (tab) => set({ activeNavTab: tab }),
  query: "",
  catalogOpen: true,
  toggleCatalog: () => set((s) => ({ catalogOpen: !s.catalogOpen })),
  tourActive: false,
  tourIndex: 0,

  select: (id) => set({ selectedId: id, tourActive: false }),

  hover: (id) => set({ hoveredId: id }),

  toggleCompare: (id) => {
    if (id === CENSUS_ID) return;
    const ids = get().compareIds;
    if (ids.includes(id)) {
      set({ compareIds: ids.filter((x) => x !== id) });
      return;
    }
    if (ids.length < 2) {
      set({ compareIds: [...ids, id] });
      return;
    }
    set({ compareIds: [ids[1]!, id] });
  },

  clearCompare: () => set({ compareIds: [] }),

  spacetimeGrid: true,
  toggleSpacetimeGrid: () => set((s) => ({ spacetimeGrid: !s.spacetimeGrid })),

  setScaleMode: (mode) => set({ scaleMode: mode }),

  toggleCategory: (category) => {
    const categories = { ...get().categories, [category]: !get().categories[category] };
    const selectedId = get().selectedId;
    const stillVisible =
      selectedId != null && isHoleVisible(selectedId, categories, get().query);
    set({
      categories,
      selectedId: stillVisible ? selectedId : null,
    });
  },

  setQuery: (query) => set({ query }),

  setCatalogOpen: (open) => set({ catalogOpen: open }),

  startTour: () =>
    set({
      tourActive: true,
      tourIndex: 0,
      selectedId: TOUR_STOPS[0]!.id,
      query: "",
      categories: { ...ALL_ON },
    }),

  nextTour: () => {
    const i = get().tourIndex + 1;
    if (i >= TOUR_STOPS.length) {
      set({ tourActive: false });
      return;
    }
    set({ tourIndex: i, selectedId: TOUR_STOPS[i]!.id });
  },

  prevTour: () => {
    const i = Math.max(0, get().tourIndex - 1);
    set({ tourIndex: i, selectedId: TOUR_STOPS[i]!.id });
  },

  stopTour: () => set({ tourActive: false }),

  cycle: (dir) => {
    const { categories, query, selectedId } = get();
    const visible = BLACK_HOLES.filter((h) => isHoleVisible(h.id, categories, query));
    if (visible.length === 0) return;
    const current = visible.findIndex((h) => h.id === selectedId);
    const next =
      current === -1
        ? dir === 1
          ? 0
          : visible.length - 1
        : (current + dir + visible.length) % visible.length;
    set({ selectedId: visible[next]!.id, tourActive: false });
  },
}));
