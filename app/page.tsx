import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900 px-4">
      <div className="max-w-2xl text-center p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Brand Analytics Dashboard</h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6">Convierte tu panel en Mentha: monitoriza la visibilidad de marcas en motores de IA y asistentes conversacionales.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
          <Link href="/dashboard" className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-center">Ir al panel</Link>
          <Link href="/settings" className="inline-block border border-gray-200 dark:border-[#2A2A30] px-6 py-3 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1E1E24] text-center">Configuración</Link>
        </div>
      </div>
    </div>
  )
}




