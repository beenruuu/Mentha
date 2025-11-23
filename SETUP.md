# Mentha AEO - Guía de Configuración y Despliegue

## 🚀 Descripción

Mentha es una plataforma SaaS completa para AI Engine Optimization (AEO) que ayuda a las marcas a optimizar su visibilidad en motores de IA como ChatGPT, Claude, Perplexity y Gemini.

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta de Supabase
- Cuenta de Stripe
- API Keys de OpenAI y Anthropic
- Git

## 🛠️ Configuración Paso a Paso

### 1. Configurar Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Espera a que el proyecto esté completamente inicializado
3. Ve a **Settings > API** y copia:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon/public key` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role key` (SUPABASE_SERVICE_ROLE_KEY)

4. Ve a **SQL Editor** y ejecuta el archivo `supabase/schema.sql` completo
   - Esto creará todas las tablas necesarias
   - Configurará Row Level Security (RLS)
   - Establecerá las políticas de acceso
   - Creará triggers y funciones

5. Configura la autenticación:
   - Ve a **Authentication > Providers**
   - Habilita **Email** provider
   - (Opcional) Habilita **Google** OAuth:
     - Necesitarás crear un proyecto en Google Cloud Console
     - Configurar OAuth consent screen
     - Crear credenciales OAuth 2.0
     - Agregar las credenciales en Supabase

### 2. Configurar Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Ve a **Developers > API Keys** y copia:
   - `Publishable key` (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   - `Secret key` (STRIPE_SECRET_KEY)

3. Crea productos y precios:
   ```
   Producto: Mentha Starter
   - Precio Mensual: $29/mes → copia el Price ID
   - Precio Anual: $290/año → copia el Price ID

   Producto: Mentha Pro
   - Precio Mensual: $99/mes → copia el Price ID
   - Precio Anual: $990/año → copia el Price ID

   Producto: Mentha Enterprise
   - Precio Mensual: $299/mes → copia el Price ID
   - Precio Anual: $2990/año → copia el Price ID
   ```

4. Configura el Webhook:
   - Ve a **Developers > Webhooks**
   - Agrega endpoint: `https://tu-dominio.com/api/stripe/webhook`
   - Selecciona estos eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copia el **Signing secret** (STRIPE_WEBHOOK_SECRET)

### 3. Configurar APIs de IA

#### OpenAI
1. Ve a [OpenAI Platform](https://platform.openai.com)
2. Crea una API key en **API Keys**
3. Copia la key (OPENAI_API_KEY)
4. Asegúrate de tener créditos en tu cuenta

#### Anthropic
1. Ve a [Anthropic Console](https://console.anthropic.com)
2. Crea una API key
3. Copia la key (ANTHROPIC_API_KEY)
4. Asegúrate de tener créditos en tu cuenta

### 4. Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Completa todas las variables en `.env.local`:
   ```env
   # Supabase
   SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   SUPABASE_SERVICE_KEY=tu-service-role-key  # Backend espera este nombre exacto

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Stripe Price IDs
   STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
   STRIPE_PRICE_ID_STARTER_YEARLY=price_...
   STRIPE_PRICE_ID_PRO_MONTHLY=price_...
   STRIPE_PRICE_ID_PRO_YEARLY=price_...
   STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_...
   STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_...

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Anthropic
   ANTHROPIC_API_KEY=sk-ant-...

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 5. Instalación Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/mentha.git
   cd mentha
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 🚢 Despliegue a Producción

### Opción 1: Vercel (Recomendado)

1. Push tu código a GitHub
2. Ve a [Vercel](https://vercel.com)
3. Importa tu repositorio
4. Configura las variables de entorno (todas las del .env.local)
5. Despliega

**Configuración post-despliegue:**
- Actualiza `NEXT_PUBLIC_APP_URL` con tu dominio de Vercel
- Actualiza el webhook de Stripe con tu URL de producción
- Actualiza las URLs de redirección en Supabase Auth

### Opción 2: Fly.io

1. Instala Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Crea una app:
   ```bash
   fly launch
   ```

3. Configura secrets:
   ```bash
   fly secrets set NEXT_PUBLIC_SUPABASE_URL=...
   fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   # ... todas las demás variables
   ```

4. Despliega:
   ```bash
   fly deploy
   ```

### Opción 3: Railway

1. Ve a [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. Despliega automáticamente

## 🧪 Configuración de Webhooks en Local

Para probar webhooks de Stripe localmente:

1. Instala Stripe CLI:
   ```bash
   stripe login
   ```

2. Reenvía eventos a tu localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Usa la clave de webhook que te proporciona el CLI

## 📊 Estructura de la Base de Datos

La base de datos incluye las siguientes tablas principales:

- **profiles**: Información de usuarios
- **subscriptions**: Suscripciones de Stripe
- **brands**: Marcas que los usuarios monitorean
- **aeo_analyses**: Análisis AEO realizados
- **keywords**: Keywords trackeadas
- **keyword_rankings**: Rankings en diferentes modelos de IA
- **competitors**: Competidores monitoreados
- **recommendations**: Recomendaciones generadas por IA
- **crawler_logs**: Logs de crawlers de IA

Todas las tablas tienen Row Level Security (RLS) habilitado para garantizar que los usuarios solo puedan acceder a sus propios datos.

## 🔒 Seguridad

### Row Level Security (RLS)

Todas las tablas están protegidas con políticas RLS que garantizan:
- Los usuarios solo pueden ver sus propios datos
- Las operaciones están autorizadas correctamente
- Los datos están aislados entre usuarios

### Middleware de Autenticación

El middleware en `middleware.ts` protege las rutas:
- Rutas protegidas requieren autenticación
- Usuarios autenticados son redirigidos del login
- Las sesiones se validan en cada request

## 🎨 Personalización de Marca

El favicon y logo de Mentha están en:
- `mentha.svg` - Logo principal
- `public/favicon.svg` - Favicon
- `app/favicon.ico` - Favicon alternativo

Los colores de marca son:
- Verde Menta: `#10b981` (emerald-600)
- Blanco: `#ffffff`
- Gris Oscuro: `#1f2937` (gray-800)

## 📈 Monitoreo y Logs

### Logs de Aplicación
Los errores se loguean en la consola. En producción, considera integrar:
- [Sentry](https://sentry.io) para error tracking
- [LogRocket](https://logrocket.com) para session replay
- [Vercel Analytics](https://vercel.com/analytics) para métricas

### Monitoreo de Base de Datos
Supabase proporciona:
- Dashboard de queries lentas
- Logs en tiempo real
- Métricas de uso

## 🔧 Troubleshooting

### Error: "Invalid API key"
- Verifica que las API keys estén correctas en `.env.local`
- Asegúrate de que no haya espacios extras
- Confirma que las keys tengan créditos/cuota disponible

### Error: "Row Level Security policy violation"
- Verifica que el schema SQL se ejecutó completamente
- Asegúrate de que el usuario esté autenticado
- Revisa las políticas RLS en Supabase Dashboard

### Webhook no funciona
- Verifica que la URL del webhook sea correcta
- Confirma que el STRIPE_WEBHOOK_SECRET sea correcto
- Revisa los logs del webhook en Stripe Dashboard

### Análisis AEO falla
- Verifica las API keys de OpenAI/Anthropic
- Confirma que hay créditos disponibles
- Revisa los logs del servidor para errores específicos

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Stripe](https://stripe.com/docs)
- [Documentación de OpenAI](https://platform.openai.com/docs)
- [Documentación de Anthropic](https://docs.anthropic.com)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Soporte

Para soporte o preguntas:
- Crea un issue en GitHub
- Contacta al equipo de desarrollo
- Consulta la documentación

## 📝 Licencia

Apache License 2.0 - Ver archivo LICENSE para detalles
