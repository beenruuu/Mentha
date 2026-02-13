"use client"

import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function MenuButton() {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
      aria-label="Abrir menú"
    >
      <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    </button>
  )
}
