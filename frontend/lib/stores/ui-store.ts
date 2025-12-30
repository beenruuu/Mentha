import { create } from 'zustand'

// Store para estado UI global mínimo
// Solo toggles, modales, y estado de UI efímero

interface UIState {
    // Modales
    isUpgradeModalOpen: boolean
    isAddBrandModalOpen: boolean
    isDeleteConfirmOpen: boolean
    deleteTargetId: string | null

    // Sidebar
    isSidebarCollapsed: boolean

    // Actions
    openUpgradeModal: () => void
    closeUpgradeModal: () => void
    openAddBrandModal: () => void
    closeAddBrandModal: () => void
    openDeleteConfirm: (targetId: string) => void
    closeDeleteConfirm: () => void
    toggleSidebar: () => void
    setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
    // Initial state
    isUpgradeModalOpen: false,
    isAddBrandModalOpen: false,
    isDeleteConfirmOpen: false,
    deleteTargetId: null,
    isSidebarCollapsed: false,

    // Modal actions
    openUpgradeModal: () => set({ isUpgradeModalOpen: true }),
    closeUpgradeModal: () => set({ isUpgradeModalOpen: false }),
    openAddBrandModal: () => set({ isAddBrandModalOpen: true }),
    closeAddBrandModal: () => set({ isAddBrandModalOpen: false }),
    openDeleteConfirm: (targetId) => set({ isDeleteConfirmOpen: true, deleteTargetId: targetId }),
    closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false, deleteTargetId: null }),

    // Sidebar actions
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
}))
