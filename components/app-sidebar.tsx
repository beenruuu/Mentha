"use client"

import { Search, Bell, Settings, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { create } from "zustand"

// Store para manejar el estado de la sidebar
interface SidebarStore {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

export const useSidebar = create<SidebarStore>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}))

export function AppSidebar() {
  const { isOpen, close } = useSidebar()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed left-0 top-0 h-screen w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-[#2A2A30] flex flex-col z-50 transition-transform duration-300 ease-in-out`}>
      {/* Logo and Close Button */}
      <div className="p-4 flex items-center justify-between">
        <Link href="/">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer">
            {/* Mentha logo - color follows text color: black in light, white in dark */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-6 h-6 text-black dark:text-white" aria-hidden="true">
              <path d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z" fill="currentColor"/>
              <path d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z" fill="currentColor"/>
              <path d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z" fill="currentColor"/>
              <path d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z" fill="currentColor"/>
              <path d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z" fill="currentColor"/>
            </svg>
          </div>
        </Link>
        <button
          onClick={close}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Create Brand Button */}
      <div className="px-4 mb-6">
        <Link href="/brand/new">
          <Button className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-lg">+ Crear marca</Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <Link href="/search">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg mb-1">
            <Search className="w-4 h-4" />
            <span className="text-sm">Buscar</span>
          </button>
        </Link>
        <Link href="/notifications">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-sm">Notificaciones</span>
          </button>
        </Link>
        <Link href="/dashboard">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg mb-1 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-gray-600 dark:border-gray-300 rounded"></div>
              </div>
              <span className="text-sm">Panel</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
        <Link href="/settings">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg mb-6">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Configuración</span>
          </button>
        </Link>

        {/* Brands Section */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-3 mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Marcas</span>
            <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500 rotate-90" />
          </div>
          <div className="space-y-1">
            <Link href="/brand/airbnb">
              <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#FF5A5F] rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">A</span>
                  </div>
                  <span className="text-sm">Airbnb</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </Link>
            <Link href="/brand/strava">
              <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#FC4C02] rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">S</span>
                  </div>
                  <span className="text-sm">Strava</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </Link>
            <Link href="/brand/vercel">
              <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-black dark:bg-white rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 fill-white dark:fill-black" viewBox="0 0 24 24">
                      <path d="M12 2L2 19.5h20L12 2z" />
                    </svg>
                  </div>
                  <span className="text-sm">Vercel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </Link>
            <Link href="/brand/revolut">
              <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white dark:bg-black border border-gray-300 dark:border-[#2A2A30] rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-black dark:text-white font-bold">R</span>
                  </div>
                  <span className="text-sm">Revolut</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Token Usage */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Casi alcanzas tu límite</p>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-black rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
              style={{ width: "25%" }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2,564 / 10,000 tokens usados</p>
        </div>

        <Link href="/upgrade">
          <Button variant="outline" className="w-full text-sm bg-transparent">
            Actualizar a Pro →
          </Button>
        </Link>
      </div>
      </aside>
    </>
  )
}




