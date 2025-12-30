import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Store para la selección de marca actual
// Persiste en localStorage para mantener la selección entre recargas

interface BrandSelectionState {
    selectedBrandId: string | null
    setSelectedBrand: (id: string | null) => void
}

export const useBrandSelectionStore = create<BrandSelectionState>()(
    persist(
        (set) => ({
            selectedBrandId: null,
            setSelectedBrand: (id) => set({ selectedBrandId: id }),
        }),
        {
            name: 'brand-selection',
        }
    )
)
