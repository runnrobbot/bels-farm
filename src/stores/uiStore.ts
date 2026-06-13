import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  /** Desktop sidebar collapsed (icon-only) state — persisted. */
  sidebarCollapsed: boolean;
  /** Mobile sidebar drawer open state — ephemeral. */
  mobileNavOpen: boolean;
  /** Raycast-style command palette visibility — ephemeral. */
  commandOpen: boolean;
  /** Active branch scope for branch-filtered views. */
  activeBranchId: string | null;

  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  setActiveBranch: (id: string | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      activeBranchId: null,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
      setActiveBranch: (activeBranchId) => set({ activeBranchId }),
    }),
    {
      name: 'bels-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, activeBranchId: s.activeBranchId }),
    },
  ),
);
