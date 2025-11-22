import React from 'react'

export const metadata = {
  title: 'Términos y Condiciones | Mentha',
  description: 'Términos y condiciones de uso de la plataforma Mentha.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Términos y Condiciones</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-6">Última actualización: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Introducción</h2>
        <p>
          Bienvenido a Mentha ("nosotros", "nuestro" o "la Plataforma"). Al acceder o utilizar nuestro sitio web y servicios, 
          usted acepta estar legalmente vinculado por estos Términos y Condiciones ("Términos"). Si no está de acuerdo con alguno 
          de estos términos, no debe utilizar nuestros servicios.
        </p>

        <h2>2. Descripción del Servicio</h2>
        <p>
          Mentha es una plataforma de optimización para motores de IA (AEO - AI Engine Optimization) que proporciona herramientas 
          de análisis, seguimiento y recomendaciones para mejorar la visibilidad de marcas en modelos de lenguaje generativo.
        </p>

        <h2>3. Cuentas de Usuario</h2>
        <p>
          Para acceder a ciertas funciones, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad 
          de sus credenciales y de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender o 
          terminar cuentas que violen estos términos.
        </p>

        <h2>4. Suscripciones y Pagos</h2>
        <p>
          Algunos servicios se ofrecen bajo modelos de suscripción de pago. Al suscribirse, acepta pagar las tarifas aplicables 
          según el plan seleccionado. Los pagos se procesan a través de proveedores seguros (Stripe). Las suscripciones se renuevan 
          automáticamente a menos que se cancelen antes del final del período actual.
        </p>

        <h2>5. Propiedad Intelectual</h2>
        <p>
          Todo el contenido, software, y tecnología de Mentha son propiedad exclusiva nuestra o de nuestros licenciantes. 
          Usted conserva la propiedad de los datos que sube a la plataforma, pero nos otorga una licencia para procesarlos 
          con el fin de proporcionar el servicio.
        </p>

        <h2>6. Limitación de Responsabilidad</h2>
        <p>
          Mentha se proporciona "tal cual". No garantizamos resultados específicos en el posicionamiento en motores de IA, 
          ya que estos dependen de algoritmos de terceros que cambian constantemente. En la medida máxima permitida por la ley, 
          no seremos responsables de daños indirectos o consecuentes.
        </p>

        <h2>7. Modificaciones</h2>
        <p>
          Podemos actualizar estos Términos ocasionalmente. Le notificaremos sobre cambios significativos enviando un aviso 
          a la dirección de correo electrónico asociada a su cuenta o publicando un aviso visible en nuestro sitio.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Si tiene preguntas sobre estos Términos, contáctenos en legal@mentha.ai.
        </p>
      </div>
    </div>
  )
}
