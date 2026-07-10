import { create } from "zustand";

type DemoTab = "inicio" | "casos" | "perfil";
type DemoChip = "online" | "premium" | "managua";

type UiState = {
  demoTab: DemoTab;
  demoChip: DemoChip;
  setDemoTab: (tab: DemoTab) => void;
  setDemoChip: (chip: DemoChip) => void;
};

export const useUiStore = create<UiState>((set) => ({
  demoTab: "inicio",
  demoChip: "online",
  setDemoTab: (demoTab) => set({ demoTab }),
  setDemoChip: (demoChip) => set({ demoChip }),
}));
