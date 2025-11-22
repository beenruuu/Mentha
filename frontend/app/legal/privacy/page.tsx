import React from 'react'

export const metadata = {
  title: 'Política de Privacidad | Mentha',
  description: 'Política de privacidad y protección de datos de Mentha.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-6">Última actualización: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Información que Recopilamos</h2>
        <p>
          Recopilamos información que usted nos proporciona directamente (como nombre, email, datos de facturación) y 
          datos recopilados automáticamente cuando utiliza el servicio (logs de uso, dirección IP, cookies).
        </p>

        <h2>2. Uso de la Información</h2>
        <p>
          Utilizamos su información para:
        </p>
        <ul>
          <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
          <li>Procesar transacciones y enviar notificaciones relacionadas.</li>
          <li>Analizar tendencias y uso para optimizar la experiencia del usuario.</li>
          <li>Detectar y prevenir fraudes o abusos.</li>
        </ul>

        <h2>3. Compartir Información</h2>
        <p>
          No vendemos sus datos personales. Solo compartimos información con terceros proveedores de servicios (como hosting, 
          procesamiento de pagos) que necesitan acceso para realizar trabajos en nuestro nombre y bajo estrictas obligaciones 
          de confidencialidad.
        </p>

        <h2>4. Seguridad de Datos</h2>
        <p>
          Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos personales contra 
          acceso no autorizado, alteración, divulgación o destrucción.
        </p>

        <h2>5. Sus Derechos (GDPR/CCPA)</h2>
        <p>
          Dependiendo de su ubicación, puede tener derechos para acceder, corregir, eliminar o restringir el uso de sus datos 
          personales. Para ejercer estos derechos, contáctenos en privacy@mentha.ai.
        </p>

        <h2>6. Retención de Datos</h2>
        <p>
          Conservamos sus datos personales mientras su cuenta esté activa o sea necesario para proporcionarle servicios, 
          cumplir con obligaciones legales, resolver disputas y hacer cumplir nuestros acuerdos.
        </p>

        <h2>7. Transferencias Internacionales</h2>
        <p>
          Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de su país de residencia. Tomamos 
          medidas para asegurar que sus datos sean tratados de forma segura y de acuerdo con esta política.
        </p>
      </div>
    </div>
  )
}
