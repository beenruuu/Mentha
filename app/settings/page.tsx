import { Search, Bell, User, Lock, CreditCard, Palette } from "lucide-react"
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AppSidebar } from "@/components/app-sidebar"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0F]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-[#2A2A30] px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-gray-50 dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">K</kbd>
              </div>
            </div>
          </div>
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VUcSRydRPw7ZxpM77k5JPTb70b6iXC.png" />
            <AvatarFallback>U</AvatarFallback>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </Avatar>
        </header>

        <div className="p-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Configuración</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Administra tu cuenta y preferencias.</p>

          <div className="max-w-4xl space-y-6">
            {/* Profile Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Perfil</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VUcSRydRPw7ZxpM77k5JPTb70b6iXC.png" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Cambiar foto
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG o GIF. Máx 2MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre
                    </Label>
                    <Input id="firstName" defaultValue="Usuario" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apellido
                    </Label>
                    <Input id="lastName" defaultValue="Demo" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <Input id="email" type="email" defaultValue="usuario@ejemplo.com" className="mt-1" />
                </div>
                <Button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black">Guardar cambios</Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Seguridad</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña actual
                  </Label>
                  <Input id="currentPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nueva contraseña
                  </Label>
                  <Input id="newPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar contraseña
                  </Label>
                  <Input id="confirmPassword" type="password" className="mt-1" />
                </div>
                <Button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black">Actualizar contraseña</Button>
              </div>
            </Card>

            {/* Notifications Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notificaciones</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Cambios en el ranking</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recibe alertas cuando tus marcas cambien de posición</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Nuevas menciones</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Notificaciones cuando se detecten nuevas menciones</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Informes semanales</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Resumen semanal de rendimiento por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Actualizaciones del producto</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Noticias sobre nuevas funciones y mejoras</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>

            {/* Billing Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Facturación</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0A0A0F] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Plan Gratuito</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2,564 / 10,000 tokens usados este mes</p>
                  </div>
                  <Button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black">Actualizar a Pro</Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Historial de facturación</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay facturas disponibles</p>
                </div>
              </div>
            </Card>

            {/* Appearance Settings */}
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Apariencia</h2>
              </div>
              <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Tema</Label>
                    <DarkModeToggle />
                  </div>
                </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}




