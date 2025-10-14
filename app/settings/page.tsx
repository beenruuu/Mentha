import { Search, Bell, Settings, ChevronRight, Command, User, Lock, CreditCard, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <Link href="/">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center cursor-pointer">
              <Command className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>

        <div className="px-4 mb-6">
          <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg">+ Crear marca</Button>
        </div>

        <nav className="flex-1 px-3">
          <Link href="/search">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
              <Search className="w-4 h-4" />
              <span className="text-sm">Buscar</span>
            </button>
          </Link>
          <Link href="/notifications">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
              <Bell className="w-4 h-4" />
              <span className="text-sm">Notificaciones</span>
            </button>
          </Link>
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-gray-600 rounded"></div>
                </div>
                <span className="text-sm">Panel</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 bg-gray-100 rounded-lg mb-6">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Configuración</span>
            </button>
          </Link>

          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Marcas</span>
              <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
            </div>
            <div className="space-y-1">
              <Link href="/brand/airbnb">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#FF5A5F] rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">A</span>
                    </div>
                    <span className="text-sm">Airbnb</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/brand/strava">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#FC4C02] rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">S</span>
                    </div>
                    <span className="text-sm">Strava</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/brand/vercel">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L2 19.5h20L12 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">Vercel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/brand/revolut">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-black font-bold">R</span>
                    </div>
                    <span className="text-sm">Revolut</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 mb-1">Casi alcanzas tu límite</p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                style={{ width: "25%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">2,564 / 10,000 tokens usados</p>
          </div>
          <Button variant="outline" className="w-full text-sm bg-transparent">
            Actualizar a Pro →
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-gray-50 border-gray-200" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">K</kbd>
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Configuración</h1>
          <p className="text-gray-600 mb-8">Administra tu cuenta y preferencias.</p>

          <div className="max-w-4xl space-y-6">
            {/* Profile Settings */}
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
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
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG o GIF. Máx 2MB.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Nombre
                    </Label>
                    <Input id="firstName" defaultValue="Usuario" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Apellido
                    </Label>
                    <Input id="lastName" defaultValue="Demo" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input id="email" type="email" defaultValue="usuario@ejemplo.com" className="mt-1" />
                </div>
                <Button className="bg-black hover:bg-gray-800 text-white">Guardar cambios</Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                    Contraseña actual
                  </Label>
                  <Input id="currentPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </Label>
                  <Input id="newPassword" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar contraseña
                  </Label>
                  <Input id="confirmPassword" type="password" className="mt-1" />
                </div>
                <Button className="bg-black hover:bg-gray-800 text-white">Actualizar contraseña</Button>
              </div>
            </Card>

            {/* Notifications Settings */}
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cambios en el ranking</p>
                    <p className="text-xs text-gray-500">Recibe alertas cuando tus marcas cambien de posición</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Nuevas menciones</p>
                    <p className="text-xs text-gray-500">Notificaciones cuando se detecten nuevas menciones</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Informes semanales</p>
                    <p className="text-xs text-gray-500">Resumen semanal de rendimiento por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Actualizaciones del producto</p>
                    <p className="text-xs text-gray-500">Noticias sobre nuevas funciones y mejoras</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>

            {/* Billing Settings */}
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Facturación</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Plan Gratuito</p>
                    <p className="text-xs text-gray-500">2,564 / 10,000 tokens usados este mes</p>
                  </div>
                  <Button className="bg-black hover:bg-gray-800 text-white">Actualizar a Pro</Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Historial de facturación</h3>
                  <p className="text-sm text-gray-500">No hay facturas disponibles</p>
                </div>
              </div>
            </Card>

            {/* Appearance Settings */}
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Apariencia</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Tema</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-4 border-2 border-black rounded-lg bg-white">
                      <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
                      <p className="text-xs font-medium">Claro</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:border-gray-300">
                      <div className="w-full h-12 bg-gray-900 rounded mb-2"></div>
                      <p className="text-xs font-medium">Oscuro</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:border-gray-300">
                      <div className="w-full h-12 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
                      <p className="text-xs font-medium">Sistema</p>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
