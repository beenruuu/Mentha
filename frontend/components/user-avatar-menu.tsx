'use client'

import { LogOut, User, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getTranslations, getLanguage, type Language } from '@/lib/i18n'

export function UserAvatarMenu() {
  const router = useRouter()
  const [lang, setLang] = useState<Language>('es')
  const t = getTranslations(lang)

  useEffect(() => {
    setLang(getLanguage())
  }, [])

  const handleLogout = async () => {
    // En modo demo, simplemente redirigir
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    
    if (isDemoMode) {
      router.push('/auth/login')
    } else {
      // En producción, usar Supabase
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/auth/login')
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
        router.push('/auth/login')
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt="Usuario" />
            <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
              U
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-black rounded-full"></div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
        <DropdownMenuLabel className="text-gray-900 dark:text-white">
          {t.myAccount}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2A2A30]" />
        <DropdownMenuItem 
          onClick={() => router.push('/settings')}
          className="cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-[#1E1E24]"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>{t.settings}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#2A2A30]" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
