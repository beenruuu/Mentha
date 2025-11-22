import React from 'react'

export const metadata = {
  title: 'Política de Cookies | Mentha',
  description: 'Información sobre el uso de cookies en Mentha.',
}

export default function CookiesPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Política de Cookies</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-6">Última actualización: {new Date().toLocaleDateString()}</p>
        
        <h2>1. ¿Qué son las Cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web guardan en su ordenador o dispositivo móvil cuando los visita. 
          Permiten que el sitio recuerde sus acciones y preferencias durante un período de tiempo.
        </p>

        <h2>2. Cómo Usamos las Cookies</h2>
        <p>
          Utilizamos cookies para:
        </p>
        <ul>
          <li>Mantener su sesión iniciada de forma segura.</li>
          <li>Recordar sus preferencias de configuración (como idioma o tema).</li>
          <li>Analizar cómo utiliza nuestro sitio para mejorar el rendimiento.</li>
        </ul>

        <h2>3. Tipos de Cookies que Usamos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2">Tipo</th>
                <th className="p-2">Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Esenciales</td>
                <td className="p-2">Necesarias para el funcionamiento básico del sitio (autenticación, seguridad). No se pueden desactivar.</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Analíticas</td>
                <td className="p-2">Nos ayudan a entender cómo los visitantes interactúan con el sitio (ej. Google Analytics).</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Funcionales</td>
                <td className="p-2">Permiten recordar sus preferencias para mejorar su experiencia.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>4. Gestión de Cookies</h2>
        <p>
          Puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies que ya están en su ordenador 
          y puede configurar la mayoría de los navegadores para que impidan su instalación. Sin embargo, si lo hace, es posible 
          que tenga que ajustar manualmente algunas preferencias cada vez que visite un sitio y que algunos servicios y 
          funcionalidades no funcionen.
        </p>
      </div>
    </div>
  )
}
