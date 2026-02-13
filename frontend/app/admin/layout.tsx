'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/features/admin/components/admin-sidebar'
import { adminService, type AdminUser } from '@/features/admin/api/admin'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const adminData = await adminService.getCurrentAdmin()
        setAdmin(adminData)
      } catch {
        // Not an admin, redirect
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-[#FAFAFA] dark:bg-[#09090b] h-screen overflow-hidden flex flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
