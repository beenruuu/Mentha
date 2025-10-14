import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-2xl text-center p-8">
        <h1 className="text-4xl font-extrabold mb-4">Brand Analytics Dashboard</h1>
        <p className="text-gray-600 mb-6">Convierte tu panel en Mentha: monitoriza la visibilidad de marcas en motores de IA y asistentes conversacionales.</p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard" className="inline-block bg-black text-white px-6 py-3 rounded-lg">Ir al panel</Link>
          <Link href="/settings" className="inline-block border border-gray-200 px-6 py-3 rounded-lg">Configuración</Link>
        </div>
      </div>
    </div>
  )
}
