# Mentha - IA-SEO Brand Analytics Dashboard

![Mentha Dashboard Preview](dashboard-preview.jpeg)

Un dashboard moderno y completo para el análisis de visibilidad de marca en motores de búsqueda y modelos de IA. Rastrea el rendimiento de tu marca en diferentes consultas y modelos de IA, monitorea competidores, y obtén insights accionables para mejorar tu presencia digital.

## 🚀 Características

### 📊 Dashboard Principal
- **Resumen de Marca**: Visualiza el rendimiento de tu marca en diferentes métricas
- **Análisis de Competidores**: Compara tu posición con marcas similares
- **Cambios Notables**: Mantente al día con las últimas actualizaciones y mejoras
- **Tabla de Datos**: Vista detallada de posiciones promedio y tasas de inclusión

### 🤖 IA-SEO Monitoring
- **Crawlers IA**: Monitorea la actividad de bots de IA en tu sitio web
- **Análisis de Consultas**: Rastrea cómo responden los modelos de IA a consultas relacionadas con tu marca
- **Métricas en Tiempo Real**: Estadísticas actualizadas de visitas, páginas indexadas y tendencias

### 🎨 Interfaz Moderna
- **Modo Oscuro/Claro**: Interfaz adaptativa con tema consistente
- **Diseño Responsivo**: Optimizado para desktop y dispositivos móviles
- **Componentes UI**: Construido con shadcn/ui para una experiencia premium

## 🛠️ Tecnologías

- **Framework**: Next.js 15.2.4 con App Router
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS 4.1.11
- **UI Components**: shadcn/ui con Radix UI
- **Iconos**: Lucide React
- **Estado**: React Hooks con localStorage para persistencia

## ⚠️ Estado del Proyecto

**Actualmente solo hay frontend implementado.** El proyecto está en desarrollo y utiliza datos mock para la demostración. Se planea implementar próximamente:

- **Backend API** con Next.js API Routes
- **Base de datos** (SQLite/PostgreSQL) para persistencia de datos
- **Sistema de autenticación** con NextAuth.js
- **APIs externas** para recopilación de datos de IA-SEO
- **Web scraping** para monitoreo automático de competidores

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/beenruuu/brand-analytics-dashboard.git
   cd brand-analytics-dashboard
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   # o
   pnpm install
   ```

3. **Ejecuta el servidor de desarrollo**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

4. **Abre tu navegador**
   Visita [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
mentha/
├── app/                    # Páginas Next.js App Router
│   ├── dashboard/         # Dashboard principal
│   ├── brand/[id]/        # Páginas de marca individual
│   │   ├── crawlers/      # Monitoreo de crawlers IA
│   │   ├── queries/       # Análisis de consultas
│   │   └── page.tsx       # Detalles de marca
│   ├── search/            # Búsqueda de marcas
│   ├── settings/          # Configuración de usuario
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base shadcn/ui
│   ├── app-sidebar.tsx   # Sidebar de navegación
│   └── dark-mode-toggle.tsx # Toggle de modo oscuro
├── lib/                  # Utilidades y configuraciones
├── hooks/               # Custom hooks
└── public/              # Assets estáticos
```

## 🎯 Uso

### Navegación Principal
- **Dashboard**: Vista general del rendimiento de tu marca
- **Buscar**: Encuentra y analiza nuevas marcas
- **Notificaciones**: Mantente al día con alertas importantes
- **Configuración**: Personaliza tu experiencia

### Análisis de Marca
1. Selecciona una marca desde el dashboard o búsqueda
2. Revisa el resumen general y métricas clave
3. Explora el análisis de competidores
4. Monitorea la actividad de crawlers IA
5. Analiza consultas específicas relacionadas con tu marca

## 🔧 Configuración

### Requisitos del Sistema

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.0 o superior
- **npm** 8.0 o superior (viene incluido con Node.js)
- **pnpm** (opcional, pero recomendado para mejor rendimiento)
- **Git** para control de versiones

### Verificar Instalación

```bash
# Verificar Node.js
node --version
# Debería mostrar v18.0.0 o superior

# Verificar npm
npm --version
# Debería mostrar 8.0.0 o superior

# Verificar Git
git --version
# Debería mostrar la versión de Git
```

### Tema Oscuro
El dashboard incluye soporte completo para modo oscuro:
- Se guarda automáticamente tu preferencia
- Tema consistente en todos los componentes
- Transiciones suaves entre modos

## 📈 Métricas y KPIs

- **Posición Promedio**: Ranking en consultas relacionadas
- **Tasa de Inclusión**: Porcentaje de respuestas que incluyen tu marca
- **Mejor Modelo**: Modelo de IA con mejor rendimiento para tu marca
- **Actividad de Crawlers**: Visitas y páginas indexadas por bots IA

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia Apache 2.0. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Autor**: beenruuu
- **Repositorio**: [GitHub](https://github.com/beenruuu/brand-analytics-dashboard)
- **Issues**: [Reportar Problemas](https://github.com/beenruuu/brand-analytics-dashboard/issues)

---

*Construido con ❤️ para mejorar la visibilidad de marca en la era de la IA*