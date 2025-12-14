'use client'

import { useState, useEffect } from 'react'

type Language = 'es' | 'en'

// Country codes for Spain detection
const SPAIN_COUNTRY_CODES = ['ES']

const translations = {
  es: {
    // ==========================================
    // LANDING PAGE
    // ==========================================

    // Navbar
    navFeatures: 'Funcionalidades',
    navAIEngines: 'Motores IA',
    navPricing: 'Precios',
    navFAQs: 'Preguntas frecuentes',
    navLogin: 'Iniciar sesión',
    navSignUp: 'Registrarse',

    // Hero
    heroTagline: '✨ El Futuro del SEO está Aquí',
    heroTitle: 'Domina el',
    heroTitleHighlight: 'Panorama de Búsqueda IA',
    heroTitleEnd: '',
    heroDescription: 'El SEO tradicional está desapareciendo. Mentha ayuda a las marcas B2B a optimizar para la nueva era de motores de búsqueda: ChatGPT, Claude, Perplexity y Gemini.',
    heroStartTrial: 'Prueba Gratis',
    heroAnalyzeSite: 'Analiza tu Sitio',
    // Onboarding
    onboardingTitle: 'Optimiza tu marca para la',
    onboardingTitleHighlight: 'Era de Motores Generativos',
    onboardingDescription: 'Únete a miles de empresas vanguardistas que dominan su presencia en ChatGPT, Claude, Gemini y más.',

    // Introduction
    introTag: 'El Cambio de Paradigma',
    introTitle: 'Tu SEO merece más.',
    introDescription: 'El comportamiento de búsqueda está cambiando. Los usuarios hacen preguntas, no buscan palabras clave. Tu estrategia de optimización necesita evolucionar de keywords a entidades y contexto.',
    introHighlight: 'Por eso creamos Mentha.',

    // Features
    featuresTag: 'Funcionalidades',
    featuresTitle: 'Donde la IA se une a la',
    featuresTitleHighlight: 'visibilidad',
    featureAEOTitle: 'Análisis AEO',
    featureAEODescription: 'Profundiza en cómo los modelos de IA interpretan tu contenido y entidades de marca.',
    featureCompetitorTitle: 'Inteligencia Competitiva',
    featureCompetitorDescription: 'Compara tu share of voice con los principales rivales del mercado en respuestas de IA.',
    featureBrandTitle: 'Protección de Marca',
    featureBrandDescription: 'Monitorea el sentimiento y precisión de las respuestas generadas por IA sobre tu marca.',
    featureTagAEO: 'Análisis AEO',
    featureTagBrand: 'Monitoreo de Marca',
    featureTagCompetitor: 'Intel Competitiva',
    featureTagSmart: 'Recomendaciones Inteligentes',
    featureTagEntity: 'Seguimiento de Entidades',
    featureTagSentiment: 'Análisis de Sentimiento',

    // Integrations
    integrationsTag: 'Motores IA',
    integrationsTitle: 'Optimizado para',
    integrationsTitleHighlight: 'todas',
    integrationsTitleSuffix: "las principales IA's",
    integrationsDescription: 'Mentha analiza cómo aparece tu marca en las principales plataformas de IA. Rastrea tu visibilidad donde más importa.',
    integrationOpenAI: 'Búsqueda y respuestas impulsadas por ChatGPT y GPT-4o.',
    integrationClaude: 'Asistente de IA avanzado de Anthropic con comprensión matizada.',
    integrationPerplexity: 'Motor de respuestas con IA y búsqueda web en tiempo real.',
    integrationGemini: 'Modelo de IA multimodal de Google para tareas diversas.',

    // Pricing
    pricingTag: 'Precios',
    pricingTitle: 'Precios simples y',
    pricingTitleHighlight: 'transparentes',
    pricingDescription: 'Elige el plan que se adapte a tu etapa de crecimiento. Sin costos ocultos.',
    pricingStarter: 'Starter',
    pricingStarterPrice: 'Gratis',
    pricingStarterDescription: 'Para individuos explorando AEO.',
    pricingStarterFeature1: '10 Análisis/mes',
    pricingStarterFeature2: 'Seguimiento de Marca Básico',
    pricingStarterFeature3: 'Soporte Comunitario',
    pricingStarterFeature4: 'Un Motor de IA',
    pricingStarterCTA: 'Comenzar',
    pricingPro: 'Pro',
    pricingProPrice: 'Próximamente',
    pricingProDescription: 'Para marcas y agencias en crecimiento.',
    pricingProFeature1: 'Análisis Ilimitados',
    pricingProFeature2: 'Todos los Motores IA',
    pricingProFeature3: 'Seguimiento de Competidores',
    pricingProFeature4: 'Soporte Prioritario',
    pricingProFeature5: 'Acceso API',
    pricingProFeature6: 'Informes Personalizados',
    pricingProCTA: 'Próximamente',
    pricingMostPopular: 'Más Popular',
    pricingEnterprise: 'Enterprise',
    pricingEnterprisePrice: 'Personalizado',
    pricingEnterpriseDescription: 'Para grandes organizaciones.',
    pricingEnterpriseFeature1: 'Modelos de IA Personalizados',
    pricingEnterpriseFeature2: 'Account Manager Dedicado',
    pricingEnterpriseFeature3: 'Garantía SLA',
    pricingEnterpriseFeature4: 'Opciones White Label',
    pricingEnterpriseFeature5: 'Analíticas Avanzadas',
    pricingEnterpriseFeature6: 'SSO y Seguridad',
    pricingEnterpriseCTA: 'Contactar Ventas',

    // FAQs
    faqsTag: 'Preguntas frecuentes',
    faqsTitle: '¿Preguntas? Tenemos',
    faqsTitleHighlight: 'respuestas',
    faqQuestion1: '¿Qué es AEO y en qué se diferencia del SEO?',
    faqAnswer1: 'AEO (Optimización para Motores de Respuesta) se centra en optimizar tu contenido para motores de búsqueda impulsados por IA como ChatGPT, Claude y Perplexity. A diferencia del SEO tradicional que busca posicionarse en los 10 enlaces azules, AEO tiene como objetivo hacer que tu marca sea la respuesta definitiva en las respuestas de IA.',
    faqQuestion2: '¿Qué plataformas de IA soporta Mentha?',
    faqAnswer2: 'Mentha actualmente soporta OpenAI (ChatGPT), Anthropic (Claude), Perplexity y Google Gemini. Continuamente añadimos nuevas plataformas a medida que emergen en el panorama de búsqueda IA.',
    faqQuestion3: '¿Cómo funciona el monitoreo de marca?',
    faqAnswer3: 'Mentha consulta regularmente las plataformas de IA sobre tu marca y rastrea cómo te mencionan, el sentimiento de las respuestas y tu visibilidad comparada con los competidores. Recibirás alertas cuando ocurran cambios significativos.',
    faqQuestion4: '¿Puedo ver cómo aparecen los competidores en las respuestas de IA?',
    faqAnswer4: '¡Sí! Nuestra función de inteligencia competitiva te permite rastrear cómo aparecen los rivales en respuestas generadas por IA, comparar share of voice e identificar oportunidades para mejorar tu posicionamiento.',
    faqQuestion5: '¿Hay una prueba gratuita disponible?',
    faqAnswer5: '¡Por supuesto! Comienza con nuestro plan gratuito que incluye 10 análisis por mes. Actualiza a Pro para análisis ilimitados y funciones avanzadas como seguimiento de competidores y acceso API.',

    // Call to Action
    ctaText: 'Empieza gratis',

    // Footer
    footerPrivacy: 'Política de Privacidad',
    footerTerms: 'Términos y Condiciones',
    footerBlog: 'Blog',
    footerRights: 'Todos los derechos reservados.',

    // Privacy Policy Page
    privacyPolicy: 'Política de Privacidad',
    privacyLastUpdated: 'Última actualización:',
    privacySection1Title: '1. Información que Recopilamos',
    privacySection1Text: 'Recopilamos información que usted nos proporciona directamente (como nombre, email, datos de facturación) y datos recopilados automáticamente cuando utiliza el servicio (logs de uso, dirección IP, cookies).',
    privacySection2Title: '2. Uso de la Información',
    privacySection2Text: 'Utilizamos su información para:',
    privacySection2Item1: 'Proporcionar, mantener y mejorar nuestros servicios.',
    privacySection2Item2: 'Procesar transacciones y enviar notificaciones relacionadas.',
    privacySection2Item3: 'Analizar tendencias y uso para optimizar la experiencia del usuario.',
    privacySection2Item4: 'Detectar y prevenir fraudes o abusos.',
    privacySection3Title: '3. Compartir Información',
    privacySection3Text: 'No vendemos sus datos personales. Solo compartimos información con terceros proveedores de servicios (como hosting, procesamiento de pagos) que necesitan acceso para realizar trabajos en nuestro nombre y bajo estrictas obligaciones de confidencialidad.',
    privacySection4Title: '4. Seguridad de Datos',
    privacySection4Text: 'Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger sus datos personales contra acceso no autorizado, alteración, divulgación o destrucción.',
    privacySection5Title: '5. Sus Derechos (GDPR/CCPA)',
    privacySection5Text: 'Dependiendo de su ubicación, puede tener derechos para acceder, corregir, eliminar o restringir el uso de sus datos personales. Para ejercer estos derechos, contáctenos en privacy@mentha.ai.',
    privacySection6Title: '6. Retención de Datos',
    privacySection6Text: 'Conservamos sus datos personales mientras su cuenta esté activa o sea necesario para proporcionarle servicios, cumplir con obligaciones legales, resolver disputas y hacer cumplir nuestros acuerdos.',
    privacySection7Title: '7. Transferencias Internacionales',
    privacySection7Text: 'Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de su país de residencia. Tomamos medidas para asegurar que sus datos sean tratados de forma segura y de acuerdo con esta política.',

    // Terms & Conditions Page
    termsAndConditions: 'Términos y Condiciones',
    termsLastUpdated: 'Última actualización:',
    termsSection1Title: '1. Introducción',
    termsSection1Text: 'Bienvenido a Mentha ("nosotros", "nuestro" o "la Plataforma"). Al acceder o utilizar nuestro sitio web y servicios, usted acepta estar legalmente vinculado por estos Términos y Condiciones ("Términos"). Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestros servicios.',
    termsSection2Title: '2. Descripción del Servicio',
    termsSection2Text: 'Mentha es una plataforma de optimización para motores de IA (AEO - AI Engine Optimization) que proporciona herramientas de análisis, seguimiento y recomendaciones para mejorar la visibilidad de marcas en modelos de lenguaje generativo.',
    termsSection3Title: '3. Cuentas de Usuario',
    termsSection3Text: 'Para acceder a ciertas funciones, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos.',
    termsSection4Title: '4. Suscripciones y Pagos',
    termsSection4Text: 'Algunos servicios se ofrecen bajo modelos de suscripción de pago. Al suscribirse, acepta pagar las tarifas aplicables según el plan seleccionado. Los pagos se procesan a través de proveedores seguros (Stripe). Las suscripciones se renuevan automáticamente a menos que se cancelen antes del final del período actual.',
    termsSection5Title: '5. Propiedad Intelectual',
    termsSection5Text: 'Todo el contenido, software, y tecnología de Mentha son propiedad exclusiva nuestra o de nuestros licenciantes. Usted conserva la propiedad de los datos que sube a la plataforma, pero nos otorga una licencia para procesarlos con el fin de proporcionar el servicio.',
    termsSection6Title: '6. Limitación de Responsabilidad',
    termsSection6Text: 'Mentha se proporciona "tal cual". No garantizamos resultados específicos en el posicionamiento en motores de IA, ya que estos dependen de algoritmos de terceros que cambian constantemente. En la medida máxima permitida por la ley, no seremos responsables de daños indirectos o consecuentes.',
    termsSection7Title: '7. Modificaciones',
    termsSection7Text: 'Podemos actualizar estos Términos ocasionalmente. Le notificaremos sobre cambios significativos enviando un aviso a la dirección de correo electrónico asociada a su cuenta o publicando un aviso visible en nuestro sitio.',
    termsSection8Title: '8. Contacto',
    termsSection8Text: 'Si tiene preguntas sobre estos Términos, contáctenos en legal@mentha.ai.',

    // ==========================================
    // APP PAGES (existing translations)
    // ==========================================

    // Navigation
    dashboard: 'Dashboard',
    brands: 'Marcas',
    keywords: 'Palabras clave',
    competitors: 'Competidores',
    search: 'Buscar',
    notifications: 'Notificaciones',
    notificationsDescription: 'Te avisaremos cuando haya actualizaciones importantes de tus marcas.',
    settings: 'Configuración',

    // Settings
    profile: 'Perfil',
    security: 'Seguridad',
    billing: 'Facturación',
    appearance: 'Apariencia',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',

    // User menu
    myAccount: 'Mi Cuenta',
    logout: 'Cerrar sesión',

    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    searchPlaceholder: 'Buscar...',
    searchBrands: 'Buscar marcas, consultas, modelos...',

    // Search page
    searchTitle: 'Buscar',
    searchDescription: 'Encuentra marcas, consultas e insights en tu panel.',
    recentSearches: 'Búsquedas Recientes',
    popularSearches: 'Búsquedas Populares',
    noRecentSearches: 'Sin búsquedas recientes',
    noPopularSearches: 'Sin búsquedas populares',
    noBrandsFound: 'No se encontraron marcas',
    quickAccess: 'Accesos Rápidos',
    queries: 'Consultas',
    searches: 'búsquedas',
    hoursAgo: 'Hace {n} horas',
    yesterday: 'Ayer',
    daysAgo: 'Hace {n} días',

    // Dashboard
    rankingMovements: 'Movimientos de ranking esta semana.',
    brandOverview: 'Resumen de Marca',
    competitorOverview: 'Resumen de Competidores',
    notableChanges: 'Cambios Notables',
    rankingImproved: 'Ranking mejorado para',
    newMention: 'Nueva mención detectada para',
    performanceImprovement: 'Mejora de rendimiento para',
    visibilityIncreased: 'visibilidad aumentada en',
    trackBrand: 'Rastrea tu marca',
    invisibleInAI: 'Ser invisible en IA duele más que un error 404',
    averagePosition: 'Posición promedio',
    inclusionRate: 'Tasa de inclusión',
    bestModel: 'Mejor modelo',
    brand: 'Marca',
    position: 'Posición',

    // Brand pages
    overview: 'Vista general',
    overviewTooltip: 'Panel general con métricas clave, insights y estado de tu marca',
    keywordsTooltip: 'Analiza cómo aparece tu marca en respuestas de IA para diferentes keywords',
    searchPerformanceTooltip: 'Métricas de rendimiento en buscadores tradicionales (Google, Bing)',
    competitionTooltip: 'Compara tu visibilidad en IA frente a tus competidores',
    crawlersTooltip: 'Monitorea qué bots de IA están rastreando tu sitio web',
    brandQueries: 'Consultas',
    aiCrawlers: 'Crawlers IA',
    analysisPending: 'Analizando...',
    deleteBrand: 'Eliminar Marca',
    areYouSure: '¿Estás absolutamente seguro?',
    deleteWarning: 'Esta acción no se puede deshacer. Esto eliminará permanentemente la marca {name} y todos los datos asociados, incluyendo keywords, competidores e historial de análisis.',
    deleting: 'Eliminando...',

    // Brand info
    airbnbDescription: 'Plataforma global de alquiler vacacional que conecta viajeros con alojamientos únicos y experiencias locales.',
    airbnbLocation: 'San Francisco, EE.UU.',
    stravaDescription: 'Red social de fitness para atletas que rastrean, analizan y comparten sus entrenamientos y actividades.',
    stravaLocation: 'San Francisco, EE.UU.',
    vercelDescription: 'Plataforma cloud frontend para construir, desplegar y escalar aplicaciones web modernas con rendimiento óptimo.',
    vercelLocation: 'San Francisco, EE.UU.',
    revolutDescription: 'Aplicación de banca digital que ofrece cambio de divisas, transferencias de dinero y herramientas de gestión financiera.',
    revolutLocation: 'Londres, Reino Unido',

    // Time
    hoursAgo2: 'Hace 2 horas',
    hoursAgo5: 'Hace 5 horas',
    hoursAgo234: '234 búsquedas',
    hoursAgo189: '189 búsquedas',
    hoursAgo156: '156 búsquedas',
    hoursAgo142: '142 búsquedas',

    // Popular searches text
    bestBrandsAI: 'Mejores marcas en IA',
    modelRanking: 'Ranking de modelos',
    competitorComparison: 'Comparación de competidores',
    mentionTrends: 'Tendencias de menciones',

    // Recent searches text
    airbnbPerformance: 'Airbnb rendimiento',
    stravaComparison: 'Comparación Strava vs competidores',
    vercelRanking: 'Vercel ranking en GPT-5',
    revolutMentions: 'Revolut menciones fintech',

    // Sidebar
    createBrand: 'Crear marca',
    panel: 'Panel',
    aeoAnalysis: 'Análisis AEO',
    keywordsAI: 'Keywords IA',
    competition: 'Competencia',

    // Common words
    in: 'en',
    of: 'de',
    for: 'para',

    // Competitors page
    competitorsTitle: 'Competidores',
    addCompetitor: 'Agregar Competidor',
    competitorName: 'Nombre del Competidor',
    competitorDomain: 'Dominio',
    visibilityScore: 'Puntuación de Visibilidad',
    mentions: 'Menciones',
    avgPosition: 'Posición Promedio',
    trend: 'Tendencia',
    actions: 'Acciones',
    noCompetitors: 'No hay competidores agregados',
    failedToLoadCompetitors: 'Error al cargar competidores',
    failedToAddCompetitor: 'Error al agregar competidor',

    // Keywords page
    keywordsTitle: 'Palabras Clave',
    addKeyword: 'Agregar Keyword',
    keyword: 'Keyword',
    visibility: 'Visibilidad',
    difficulty: 'Dificultad',
    volume: 'Volumen',
    noKeywords: 'No hay keywords agregadas',
    keywordsDescription: 'Gestiona y rastrea tus palabras clave SEO',
    totalKeywords: 'Total Palabras Clave',
    avgVisibility: 'Visibilidad Promedio',
    highDifficulty: 'Alta Dificultad',
    opportunity: 'Oportunidad',
    sort: 'Ordenar',
    trend7d: 'Tendencia (7d)',
    loadingKeywords: 'Cargando palabras clave...',
    noKeywordsFoundSearch: 'No se encontraron palabras clave que coincidan con tu búsqueda.',
    viewDetails: 'Ver detalles',
    analyzeNow: 'Analizar ahora',
    deleteKeyword: 'Eliminar palabra clave',
    openMenu: 'Abrir menú',

    // Notifications
    notificationsTitle: 'Notificaciones',
    markAllRead: 'Marcar todas como leídas',
    markAsRead: 'Marcar como leída',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    ago: 'hace',
    rankingImprovement: 'Mejora en el ranking de',
    newMentionDetected: 'Nueva mención detectada para',
    noNotifications: 'No hay notificaciones',

    // Settings page
    configuration: 'Configuración',
    quickSettings: 'Ajustes rápidos',
    closeSettings: 'Cerrar configuración',
    close: 'Cerrar',
    openFullSettings: 'Abrir configuración completa',
    changeAppTheme: 'Cambiar el tema de la aplicación',
    advancedAppearance: 'Ajustes de apariencia avanzados.',
    saving: 'Guardando...',
    updating: 'Actualizando...',
    preferencesSaved: 'Preferencias guardadas',
    errorSavingPreferences: 'Error guardando preferencias',
    nameRequired: 'Nombre requerido',
    profileUpdated: 'Perfil actualizado',
    errorSaving: 'Error al guardar',
    fillFields: 'Completa los campos',
    passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
    passwordsNoMatch: 'Las contraseñas no coinciden',
    passwordUpdated: 'Contraseña actualizada',
    errorUpdatingPassword: 'Error al actualizar contraseña',
    name: 'Nombre',
    firstName: 'Nombre',
    lastName: 'Apellido',
    user: 'Usuario',
    email: 'Email',
    saveChanges: 'Guardar cambios',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    updatePassword: 'Actualizar contraseña',
    rankingChanges: 'Cambios en el ranking',
    receiveAlertsWhenBrandsChange: 'Recibe alertas cuando tus marcas cambien de posición',
    newMentions: 'Nuevas menciones',
    notificationsWhenNewMentions: 'Notificaciones cuando se detecten nuevas menciones',
    weeklyReports: 'Informes semanales',
    weeklyPerformanceSummary: 'Resumen semanal de rendimiento por email',
    productUpdates: 'Actualizaciones del producto',
    newsAboutFeatures: 'Noticias sobre nuevas funciones y mejoras',
    freePlan: 'Plan Gratuito',
    tokensUsedThisMonth: '0 / 10,000 tokens usados este mes',
    upgradeToPro: 'Actualizar a Pro',
    billingHistory: 'Historial de facturación',
    noInvoicesAvailable: 'No hay facturas disponibles',
    settingsDescription: 'Gestiona tu cuenta y preferencias',
    personalInformation: 'Información Personal',
    personalInfoDescription: 'Actualiza tus datos personales y perfil público.',
    changeAvatar: 'Cambiar Avatar',
    passwordSecurity: 'Contraseña y Seguridad',
    passwordSecurityDescription: 'Gestiona tu contraseña y configuración de seguridad.',
    emailNotifications: 'Notificaciones por Email',
    emailNotificationsDescription: 'Elige qué actualizaciones quieres recibir.',
    currentPlan: 'Plan Actual',
    currentPlanDescription: 'Gestiona tu suscripción y detalles de facturación.',
    activeStatus: 'Activo',
    basicFeatures: 'Funciones básicas para uso personal',
    appearanceTitle: 'Apariencia',
    appearanceDescription: 'Personaliza la apariencia de la aplicación.',
    errorLoadingUser: 'Error al cargar el usuario',
    notificationPrefsSaved: 'Preferencias de notificaciones guardadas',
    errorSavingNotificationPrefs: 'Error al guardar preferencias de notificaciones',
    profileUpdatedSuccess: 'Perfil actualizado correctamente',
    changesSaved: 'Tus cambios han sido guardados',
    errorUpdatingProfile: 'Error al actualizar perfil',
    tryAgain: 'Inténtalo de nuevo',
    completePasswordFields: 'Por favor completa todos los campos de contraseña',
    passwordUpdatedSuccess: 'Contraseña actualizada correctamente',
    languageChangedTo: 'Idioma cambiado a',

    // Cookie Consent
    cookieTitle: 'Valoramos tu privacidad',
    cookieDescription: 'Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. Al hacer clic en "Aceptar", consientes el uso de todas las cookies. Puedes leer más en nuestra ',
    cookiePolicy: 'Política de Cookies',
    cookieAccept: 'Aceptar',
    cookieDecline: 'Rechazar',

    // Command Palette
    cmdDashboard: 'Ir al Dashboard',
    cmdSearch: 'Búsqueda',
    cmdNotifications: 'Notificaciones',
    cmdSettings: 'Configuración',
    cmdUpgrade: 'Actualizar Plan',
    cmdShortcuts: 'Ver Atajos',
    cmdTheme: 'Cambiar Tema',
    cmdPlaceholder: 'Buscar atajos de teclado...',
    cmdNoResults: 'No se encontraron atajos.',
    cmdNavigation: 'Navegación',
    cmdHelp: 'Ayuda',
    cmdAppearance: 'Apariencia',

    // Upgrade page
    upgradePlan: 'Actualizar Plan',
    upgradeToProUnlock: 'Actualiza a Pro y desbloquea insights',
    upgradeDescription: 'Más consultas, análisis avanzados, prioridades de soporte y exportes. Todo pensado para escalar tu investigación de marca.',
    startUpgrade: 'Empezar actualización',
    backToPanel: 'Volver al panel',
    yourPlan: 'Tu plan',
    freeBasicTrial: 'Prueba básica — limitado a 100 consultas/mes',
    upgrade: 'Actualizar',
    whyPro: 'Por qué Pro',
    whyProDescription: 'Accede a mayor cuota de consultas, historial extendido y análisis por modelo.',
    support: 'Soporte',
    supportDescription: 'Canal dedicado y tiempos de respuesta prioritarios para incidencias y configuraciones.',
    exports: 'Exportes',
    exportsDescription: 'Exporta reportes en CSV/PDF y conecta con tus pipelines de datos.',
    proBasic: 'Pro Básico',
    proBasicFeature1: '1,000 consultas/mes',
    proBasicFeature2: 'Análisis por modelo',
    proBasicFeature3: 'Soporte por email',
    proPlus: 'Pro Plus',
    proPlusFeature1: '5,000 consultas/mes',
    proPlusFeature2: 'Historial extendido 12 meses',
    proPlusFeature3: 'Soporte prioritario',
    enterprise: 'Enterprise',
    contact: 'Contacto',
    enterpriseFeature1: 'Consultas ilimitadas',
    enterpriseFeature2: 'SLA y soporte dedicado',
    enterpriseFeature3: 'Integración personalizada',
    select: 'Seleccionar',
    contactUs: 'Contactar',
    perMonth: '/mes',

    // Brand pages
    brandSummary: 'Resumen de Marca',
    scorePending: 'Puntuación pendiente',
    noCompetitorsTracked: 'Sin competidores rastreados',
    analysisRequired: 'Se requiere análisis para identificar competidores potenciales.',
    analysisInProgress: 'El análisis está en progreso. Te avisaremos cuando existan sugerencias.',
    noRecommendationsFound: 'No se encontraron recomendaciones específicas.',
    startAnalysisForRecs: 'Inicia un análisis para obtener recomendaciones.',

    // Crawlers page
    robotsTxtStatus: 'Estado de Robots.txt',
    analyzingCrawlPermissions: 'Analizando permisos de rastreo...',
    aiCrawlerPermissions: 'Permisos de Rastreadores IA',
    verifyingRobotsTxt: 'Verificando permisos de robots.txt...',
    noPermissionsData: 'No se encontraron datos de permisos.',
    verifyingRobotsPermissions: 'Verificando permisos de robots.txt...',
    noPermissionsDataFound: 'No se encontraron datos de permisos.',
    analysisInProgressNotify: 'El análisis está en progreso. Te avisaremos cuando existan sugerencias.',

    // Dashboard page
    averagePositionShort: 'POSICIÓN PROM.',
    dashboardOverallVisibility: 'Puntuación general de visibilidad en todos los motores de IA',
    dashboardAvgPositionDesc: 'Posición promedio en los resultados de búsqueda',
    dashboardInclusionRateDesc: 'Porcentaje de consultas donde aparece tu marca',
    dashboardUnlockTracking: 'Desbloquear Seguimiento Avanzado',
    dashboardUpgradeMessage: 'Mejora tu plan para rastrear el rendimiento en personas, regiones e idiomas.',
    dashboardCompetitionPerformance: 'Rendimiento de la Competencia',
    dashboardLive: 'En vivo',
    dashboardModelPerformance: 'Rendimiento del Modelo',
    dashboardNoData: 'Sin datos',

    // Notifications page detailed
    airbnbRankingImprovement: 'Airbnb subió 3 posiciones en GPT-5 para consultas de "recomendaciones de viaje".',
    vercelNewMention: 'Vercel fue mencionado en Claude-4-sonnet para "herramientas de desarrollo web".',
    competitionChange: 'Cambio en la competencia',
    daysAgo1: 'Hace 1d',
    bookingVsExpedia: 'Booking.com superó a Expedia en el ranking de "sitios de reserva de hoteles".',
    stravaNewRecord: 'Strava alcanza nuevo récord',
    stravaReachedPosition: 'Strava alcanzó la posición #1 en Grok-3 para "aplicaciones de fitness".',
    weeklyReportAvailable: 'Informe semanal disponible',
    daysAgo3: 'Hace 3d',
    weeklyReportReady: 'Tu informe semanal de rendimiento está listo para revisar.',
    viewReport: 'Ver informe',

    // Competitors page (Detailed)
    competitorsTracked: 'Competidores Trackeados',
    inYourIndustry: 'En tu industria',
    yourPosition: 'Tu Posición',
    movedUpPositions: 'Cambio de posición',
    visibilityGap: 'Gap de Visibilidad',
    vsIndustryLeader: 'vs. líder del sector',
    opportunities: 'Oportunidades',
    keywordsToImprove: 'Keywords para mejorar',
    analyzePerformanceVsCompetitors: 'Analiza tu rendimiento frente a la competencia en motores de IA',
    addNewCompetitor: 'Agregar Nuevo Competidor',
    enterCompetitorData: 'Ingresa los datos del competidor que deseas analizar',
    competitorNameLabel: 'Nombre del Competidor',
    competitorNamePlaceholder: 'Ej: Empresa XYZ',
    domainLabel: 'Dominio',
    domainPlaceholder: 'Ej: empresaxyz.com',
    add: 'Agregar',
    searchCompetitors: 'Buscar competidores...',
    competitor: 'Competidor',
    domain: 'Dominio',
    aiMentions: 'Menciones IA',
    avgPositionShort: 'Pos. Promedio',
    strengths: 'Fortalezas',
    gapAnalysis: 'Análisis de Brechas',
    identifyAreasWhereCompetitors: 'Identifica áreas donde los competidores te superan',
    contentQuality: 'Calidad de Contenido',
    them: 'Ellos',
    you: 'Tú',
    domainAuthority: 'Autoridad de Dominio',
    keywordCoverage: 'Cobertura de Keywords',
    errorTitle: 'Error',
    pleaseCompleteAllFields: 'Por favor completa todos los campos',
    competitorAdded: 'Competidor agregado',
    competitorAddedToList: '{name} se agregó a tu lista de competidores',

    // Keywords page (Detailed)
    trackedKeywords: 'Keywords Trackeadas',
    sinceLastMonth: 'desde el mes pasado',
    averageVisibility: 'Visibilidad Promedio',
    thisMonth: 'este mes',
    top3Positions: 'Top 3 Posiciones',
    ofYourKeywords: 'de tus keywords',
    potentialImprovements: 'Mejoras Potenciales',
    opportunitiesIdentified: 'Oportunidades identificadas',
    keywordManagement: 'Gestión de Keywords',
    trackKeywordPerformance: 'Rastrea el rendimiento de tus keywords en motores de IA',
    addNewKeyword: 'Agregar Nueva Keyword',
    enterKeywordToTrack: 'Ingresa la keyword que deseas trackear en los motores de IA',
    keywordLabel: 'Keyword',
    keywordPlaceholder: 'Ej: software de gestión',
    searchKeywords: 'Buscar keywords...',
    aiVisibility: 'Visibilidad IA',
    aiModels: 'Modelos IA',
    pleaseEnterKeyword: 'Por favor ingresa una keyword',
    keywordAdded: 'Keyword agregada',
    keywordAddedToTracking: '"{keyword}" se agregó a tu lista de trackeo',

    // Sidebar
    closeMenu: 'Cerrar menú',
    almostReachedLimit: 'Casi alcanzas tu límite',
    tokensUsed: 'tokens usados',
    upgradeToProArrow: 'Actualizar a Pro →',
    logoutButton: 'Cerrar sesión',

    // Brand pages
    brandNotFound: 'Marca no encontrada',
    backToBrand: 'Volver a la marca',
    lastVisit: 'Última visita',
    lastCrawl: 'Último rastreo',
    crawlFrequency: 'Frecuencia de rastreo',
    dailyCrawls: 'Rastreos diarios',
    pagesIndexed: 'Páginas indexadas',
    crawlStatus: 'Estado de rastreo',
    model: 'Modelo',
    hourAgo: 'Hace 1 hora',
    minutesAgo: 'Hace {n} minutos',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',

    // Crawlers page
    aiCrawlersMonitor: 'Monitor de Crawlers de IA',
    trackBotsVisiting: 'Rastrea qué bots de IA están visitando tu sitio web y qué contenido están indexando',
    activeCrawlers: 'Crawlers Activos',
    visitsToday: 'Visitas Hoy',
    pagesIndexedShort: 'Páginas Indexadas',
    weeklyTrend: 'Tendencia Semanal',
    gptBotVisited: 'GPTBot visitó tu sitio hace 2 horas',
    gptBotInsight: 'Esto indica que OpenAI está actualizando su base de conocimiento. Es probable que tu contenido reciente aparezca en GPT-5 en los próximos días.',
    crawlerActivity: 'Actividad de Crawlers',
    frequency: 'Frecuencia',
    pagesVisited: 'Páginas visitadas',
    topPages: 'Páginas principales',
    avgCrawlTime: 'Tiempo promedio de rastreo',
    everyDays: 'Cada {n} días',
    infrequent: 'Poco frecuente',
    every3Days: 'Cada 3 días',
    daysAgo2: 'Hace 2 días',
    oct13Date: '13 Oct 2025, 22:10',

    // Queries page
    queriesManagement: 'Gestión de Consultas',
    trackPerformanceAcrossAI: 'Rastrea el rendimiento de tus consultas a través de modelos de IA',
    queryTemplates: 'Plantillas de Consulta',
    queriesLowercase: 'Consultas',
    comparison: 'Comparación',
    definition: 'Definición',
    recommendation: 'Recomendación',
    tutorial: 'Tutorial',
    topX: 'Top X',
    review: 'Review',
    category: 'Categoría',
    query: 'Consulta',
    status: 'Estado',
    frequencyShort: 'Frecuencia',
    lastRun: 'Última ejecución',
    nextRun: 'Próxima ejecución',
    mentionsShort: 'Menciones',
    avgPos: 'Pos. Prom.',
    paused: 'Pausado',

    // Overview page
    actionableInsights: 'Acciones Recomendadas',
    pendingActions: '{n} pendientes',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    priority: 'Prioridad',
    action: 'Acción',
    reason: 'Razón',
    estimatedImpact: 'Impacto estimado',
    visibilityLowercase: 'visibilidad',
    mentionsLowercase: 'menciones',
    competitorAnalysis: 'Análisis de Competidores',
    trackCompetitors: 'Trackear competidores',
    vsYou: 'vs. Ti',
    includedIn: 'Incluido en',
    responses: 'respuestas',
    topQueries: 'Top Consultas',
    potentialCompetitors: 'Competidores Potenciales',
    addCompetitors: 'Agregar Competidores',

    // Additional crawlers translations
    activityTimeline: 'Timeline de Actividad (Últimas 24h)',
    indexedPages: 'Indexó {n} páginas nuevas',
    visitedHomepage: 'Visited homepage',
    scannedDocumentation: 'Escaneó documentación',
    deepCrawling: 'Crawling profundo',

    // Additional queries translations
    queryBuilder: 'Query Builder',
    createStrategicQueries: 'Crea y gestiona queries estratégicas para monitorear tu visibilidad en IA',
    newQuery: 'Nueva Query',
    categories: 'categorías',
    generateQueriesAutomatically: 'Genera queries automáticamente basadas en estrategias probadas de IA-Visibility',
    useTemplate: 'Usar plantilla',
    totalQueries: 'Total Queries',
    activeQueries: 'Queries Activas',
    queriesPaused: 'Queries Pausadas',
    avgMentionRate: 'Tasa de Mención Prom.',
    allQueries: 'Todas las Queries',
    pause: 'Pausar',
    resume: 'Reanudar',
    duplicate: 'Duplicar',
    delete: 'Eliminar',
    models: 'modelos',
    lastExecution: 'Última ejecución',
    nextExecution: 'Próxima ejecución',
    filter: 'Filtrar',
    pages: 'páginas',

    // ==========================================
    // AUTH PAGES
    // ==========================================
    authLogin: 'Iniciar Sesión',
    authLoginDescription: 'Accede a tu cuenta de Mentha AEO',
    authEmail: 'Email',
    authEmailPlaceholder: 'tu@email.com',
    authPassword: 'Contraseña',
    authPasswordPlaceholder: '••••••••',
    authConfirmPassword: 'Confirmar Contraseña',
    authForgotPassword: '¿Olvidaste tu contraseña?',
    authLoggingIn: 'Iniciando sesión...',
    authLoginButton: 'Iniciar Sesión',
    authOrContinueWith: 'O continúa con',
    authGoogle: 'Google',
    authNoAccount: '¿No tienes cuenta?',
    authSignUp: 'Regístrate',
    authHaveAccount: '¿Ya tienes cuenta?',
    authSignIn: 'Inicia sesión',

    authSignUpTitle: 'Crear Cuenta',
    authSignUpDescription: 'Únete a Mentha AEO y optimiza tu presencia en IA',
    authFullName: 'Nombre Completo',
    authFullNamePlaceholder: 'Tu nombre completo',
    authCreatingAccount: 'Creando cuenta...',
    authCreateAccount: 'Crear Cuenta',

    authSignUpSuccess: '¡Registro Exitoso!',
    authSignUpSuccessMessage: 'Revisa tu email para confirmar tu cuenta. Serás redirigido al login en unos segundos...',

    authForgotTitle: '¿Olvidaste tu contraseña?',
    authForgotDescription: 'Introduce tu email y te enviaremos un enlace para restablecerla.',
    authSendingLink: 'Enviando...',
    authSendLink: 'Enviar enlace',
    authBackToLogin: 'Volver al login',
    authEmailSentTitle: '¡Enlace enviado!',
    authEmailSentDescription: 'Revisa tu correo electrónico. Si no llega, revisa la bandeja de spam.',

    authResetTitle: 'Restablecer Contraseña',
    authResetDescription: 'Introduce tu nueva contraseña.',
    authNewPassword: 'Nueva contraseña',
    authNewPasswordPlaceholder: 'Mínimo 8 caracteres',
    authSaving: 'Guardando...',
    authResetButton: 'Restablecer contraseña',
    authResetSuccess: '¡Contraseña actualizada!',
    authResetSuccessMessage: 'Tu contraseña ha sido actualizada correctamente.',
    authGoToLogin: 'Ir al login',
    authInvalidLink: 'No se detectó un enlace de recuperación válido. Por favor solicita uno desde la pantalla de recuperación.',
    authRequestLink: 'Solicitar enlace',
    authPasswordsNoMatch: 'Las contraseñas no coinciden',
    authPasswordTooWeak: 'La contraseña no cumple los requisitos mínimos',

    // ==========================================
    // BLOG
    // ==========================================
    blogTitle: 'El Blog de Mentha',
    blogDescription: 'Insights, estrategias y guías para la nueva era de la Optimización para Motores de Respuesta.',
    blogReadArticle: 'Leer Artículo',
    blogBackToBlog: 'Volver al Blog',
    blogReadyToOptimize: '¿Listo para optimizar tu futuro?',
    blogStartOptimizing: 'Empieza a optimizar tu marca para la búsqueda IA hoy con la plataforma de visibilidad IA de Mentha.',
    blogGetStartedFree: 'Comenzar Gratis',

    // ==========================================
    // DASHBOARD
    // ==========================================
    dashboardTitle: 'Dashboard',
    dashboardDescription: 'Resumen de tu visibilidad en motores de IA',
    dashboardRankScore: 'Puntuación',
    dashboardAvgPosition: 'Pos. Promedio',
    dashboardInclusionRate: 'Tasa de Inclusión',
    dashboardTracking: 'Activo',
    dashboardInactive: 'Inactivo',
    dashboardVisibilityTrend: 'Tendencia de Visibilidad',
    dashboardVisibilityTrendDescription: 'Tu puntuación de visibilidad IA a lo largo del tiempo',
    dashboardNoHistoricalData: 'Aún no hay datos históricos disponibles',
    dashboardRecommendedActions: 'Acciones Recomendadas',
    dashboardImproveStanding: 'Mejora tu posición',
    dashboardNoActionsYet: 'Aún no hay acciones recomendadas.',
    dashboardCompetitors: 'Competidores',
    dashboardCompetitorsDescription: 'Comparativa con tu competencia',
    dashboardNoCompetitors: 'Sin competidores rastreados.',
    dashboardTopKeywords: 'Top Keywords',
    dashboardHighOpportunity: 'Términos de alta oportunidad',
    dashboardNoKeywords: 'No se encontraron keywords.',
    dashboardRecentActivity: 'Actividad Reciente',
    dashboardRecentActivityDescription: 'Últimos rastreos de crawlers de IA',
    dashboardNoCrawlerActivity: 'Sin actividad reciente de crawlers.',
    dashboardNotifications: 'Notificaciones',

    // ==========================================
    // AEO ANALYSIS
    // ==========================================
    aeoTitle: 'Análisis AEO',
    aeoNewAnalysis: 'Nuevo Análisis',
    aeoDescription: 'Analiza contenido para optimizar tu visibilidad en motores de IA',
    aeoDomain: 'Dominio',
    aeoDomainPlaceholder: 'ejemplo.com',
    aeoAnalysisType: 'Tipo de Análisis',
    aeoContent: 'Contenido',
    aeoFullDomain: 'Dominio Completo',
    aeoKeywords: 'Keywords',
    aeoCompetition: 'Competencia',
    aeoAIModel: 'Modelo de IA',
    aeoChatGPT: 'ChatGPT (GPT-4o)',
    aeoClaude: 'Claude (Sonnet)',
    aeoContentToAnalyze: 'Contenido a Analizar',
    aeoContentPlaceholder: 'Pega aquí el contenido que quieres analizar...',
    aeoAnalyzing: 'Analizando...',
    aeoAnalyzeWithAI: 'Analizar con IA',
    aeoResults: 'Resultados del Análisis',
    aeoResultsDescription: 'Tu puntuación AEO y recomendaciones',
    aeoResultsPlaceholder: 'Los resultados aparecerán aquí',
    aeoInstructions: 'Completa el formulario y haz clic en "Analizar con IA" para obtener tu puntuación AEO',
    aeoScore: 'Puntuación AEO',
    aeoStrengths: 'Fortalezas',
    aeoWeaknesses: 'Debilidades',
    aeoActions: 'Acciones',
    aeoSuggestedKeywords: 'Keywords Sugeridas',
    aeoRecentAnalyses: 'Análisis Recientes',
    aeoHistoryDescription: 'Historial de análisis realizados',
    aeoNoHistory: 'No hay análisis previos. Realiza tu primer análisis AEO arriba.',
    aeoUnknownDomain: 'Dominio desconocido',
    aeoView: 'Ver',
    aeoFillAllFields: 'Por favor completa el dominio y el contenido',

    // ==========================================
    // SETTINGS PAGE - ORGANIZATION TAB
    // ==========================================
    organization: 'Organización',
    companyDetails: 'Detalles de Empresa',
    currentPlanLabel: 'Plan Actual',
    renewsOn: 'Renueva el',
    teamMembers: 'Miembros del Equipo',
    peopleWithAccess: 'Personas con acceso a este espacio de trabajo.',
    invite: 'Invitar',
    remove: 'Eliminar',
    inviteFunctionalityInDev: 'Funcionalidad de invitación en desarrollo.',
    errorUploadingImage: 'Error al subir la imagen',

    // ==========================================
    // ADMIN - USERS PAGE
    // ==========================================
    adminUserManagement: 'Gestión de Usuarios',
    adminUsers: 'usuarios',
    searchByEmailOrName: 'Buscar por email o nombre...',
    plan: 'Plan',
    all: 'Todos',
    state: 'Estado',
    actives: 'Activos',
    suspended: 'Suspendidos',
    sortBy: 'Ordenar por',
    registrationDate: 'Fecha registro',
    lastLogin: 'Último login',
    userColumn: 'Usuario',
    brandsColumn: 'Marcas',
    country: 'País',
    registration: 'Registro',
    actionsColumn: 'Acciones',
    noName: 'Sin nombre',
    never: 'Nunca',
    suspendedStatus: 'Suspendido',
    reactivateAccount: 'Reactivar cuenta',
    suspend: 'Suspender',
    noUsersFound: 'No se encontraron usuarios',
    showing: 'Mostrando',
    to: 'a',
    ofTotal: 'de',
    usersLabel: 'usuarios',
    page: 'Página',
    ofPages: 'de',
    userDetails: 'Detalles del Usuario',
    company: 'Empresa',
    industry: 'Industria',
    role: 'Rol',
    onboardingStatus: 'Estado del Onboarding',
    completed: 'Completado',
    step: 'Paso',
    brandsLabel: 'Marcas',
    suspendUser: 'Suspender Usuario',
    suspendUserDescription: 'El usuario no podrá acceder a la plataforma hasta que sea reactivado.',
    suspendReason: 'Motivo de la suspensión',
    suspendReasonPlaceholder: 'Describe el motivo de la suspensión...',
    suspending: 'Suspendiendo...',
    deleteUserPermanently: '¿Eliminar usuario permanentemente?',
    deleteUserWarning: 'Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario, incluyendo sus marcas, análisis y configuraciones.',
    deleteUser: 'Eliminar Usuario',
    errorLoadingUsers: 'Error al cargar usuarios',
    errorLoadingUserDetails: 'Error al cargar detalles del usuario',
    userSuspendedSuccess: 'Usuario suspendido correctamente',
    errorSuspendingUser: 'Error al suspender usuario',
    userReactivatedSuccess: 'Usuario reactivado correctamente',
    errorReactivatingUser: 'Error al reactivar usuario',
    userDeletedSuccess: 'Usuario eliminado correctamente',
    errorDeletingUser: 'Error al eliminar usuario',

    // ==========================================
    // ADMIN - CATEGORIES PAGE
    // ==========================================
    adminCategories: 'Categorías',
    categoriesCount: 'categorías',
    categoriesInactive: 'Inactivas',
    newCategory: 'Nueva',
    noCategories: 'No hay categorías',
    createFirstCategory: 'Crea tu primera categoría para el onboarding',
    newCategoryTitle: 'Nueva Categoría',
    createNewIndustryCategory: 'Crea una nueva categoría de industria',
    categoryName: 'Nombre',
    categoryNamePlaceholder: 'Ej: Technology',
    slug: 'Slug',
    slugPlaceholder: 'Ej: technology',
    descriptionLabel: 'Descripción',
    descriptionPlaceholder: 'Descripción de la categoría...',
    color: 'Color',
    order: 'Orden',
    creating: 'Creando...',
    createCategory: 'Crear Categoría',
    editCategory: 'Editar Categoría',
    modifyCategoryDetails: 'Modifica los detalles de la categoría',
    saveChangesBtn: 'Guardar Cambios',
    deleteCategory: '¿Eliminar categoría?',
    deleteCategoryWarning: 'Esta acción no se puede deshacer. La categoría será eliminada permanentemente.',
    errorLoadingCategories: 'Error al cargar categorías',
    nameAndSlugRequired: 'Nombre y slug son requeridos',
    categoryCreatedSuccess: 'Categoría creada correctamente',
    errorCreatingCategory: 'Error al crear categoría',
    categoryUpdatedSuccess: 'Categoría actualizada correctamente',
    errorUpdatingCategory: 'Error al actualizar categoría',
    categoryDeletedSuccess: 'Categoría eliminada correctamente',
    errorDeletingCategory: 'Error al eliminar categoría',
    categoryActivated: 'Categoría activada',
    categoryDeactivated: 'Categoría desactivada',
  },
  en: {
    // ==========================================
    // LANDING PAGE
    // ==========================================

    // Navbar
    navFeatures: 'Features',
    navAIEngines: 'AI Engines',
    navPricing: 'Pricing',
    navFAQs: 'FAQs',
    navLogin: 'Login',
    navSignUp: 'Sign Up',

    // Hero
    heroTagline: '✨ The Future of SEO is Here',
    heroTitle: 'Dominate the',
    heroTitleHighlight: 'AI Search',
    heroTitleEnd: 'Landscape',
    heroDescription: 'Traditional SEO is fading. Mentha helps B2B brands optimize for the new era of search engines—ChatGPT, Claude, Perplexity, and Gemini.',
    heroStartTrial: 'Start Free Trial',
    heroAnalyzeSite: 'Analyze Your Site',
    // Onboarding
    onboardingTitle: 'Optimize your brand for the',
    onboardingTitleHighlight: 'Generative Engine Era',
    onboardingDescription: 'Join thousands of forward-thinking companies mastering their presence on ChatGPT, Claude, Gemini, and more.',

    // Introduction
    introTag: 'The Paradigm Shift',
    introTitle: 'Your SEO deserves better.',
    introDescription: 'Search behavior is changing. Users are asking questions, not searching keywords. Your optimization strategy needs to evolve from keywords to entities and context.',
    introHighlight: "That's why we built Mentha.",

    // Features
    featuresTag: 'Features',
    featuresTitle: 'Where AI meets',
    featuresTitleHighlight: 'visibility',
    featureAEOTitle: 'AEO Analysis',
    featureAEODescription: 'Deep dive into how AI models interpret your content and brand entities.',
    featureCompetitorTitle: 'Competitor Intel',
    featureCompetitorDescription: 'Benchmark your share of voice against key market rivals in AI responses.',
    featureBrandTitle: 'Brand Protection',
    featureBrandDescription: 'Monitor sentiment and accuracy of AI-generated responses about your brand.',
    featureTagAEO: 'AEO Analysis',
    featureTagBrand: 'Brand Monitoring',
    featureTagCompetitor: 'Competitor Intel',
    featureTagSmart: 'Smart Recommendations',
    featureTagEntity: 'Entity Tracking',
    featureTagSentiment: 'Sentiment Analysis',

    // Integrations
    integrationsTag: 'AI Engines',
    integrationsTitle: 'Optimized for',
    integrationsTitleHighlight: 'all',
    integrationsTitleSuffix: 'major AI',
    integrationsDescription: 'Mentha analyzes how your brand appears across the leading AI platforms. Track your visibility where it matters most.',
    integrationOpenAI: 'ChatGPT and GPT-4o powered search and responses.',
    integrationClaude: "Anthropic's advanced AI assistant with nuanced understanding.",
    integrationPerplexity: 'AI-powered answer engine with real-time web search.',
    integrationGemini: "Google's multimodal AI model for diverse tasks.",

    // Pricing
    pricingTag: 'Pricing',
    pricingTitle: 'Simple,',
    pricingTitleHighlight: 'transparent',
    pricingDescription: 'Choose the plan that fits your growth stage. No hidden fees.',
    pricingStarter: 'Starter',
    pricingStarterPrice: 'Free',
    pricingStarterDescription: 'For individuals exploring AEO.',
    pricingStarterFeature1: '10 Analyses/month',
    pricingStarterFeature2: 'Basic Brand Tracking',
    pricingStarterFeature3: 'Community Support',
    pricingStarterFeature4: 'Single AI Engine',
    pricingStarterCTA: 'Get Started',
    pricingPro: 'Pro',
    pricingProPrice: 'Coming Soon',
    pricingProDescription: 'For growing brands and agencies.',
    pricingProFeature1: 'Unlimited Analyses',
    pricingProFeature2: 'All AI Engines',
    pricingProFeature3: 'Competitor Tracking',
    pricingProFeature4: 'Priority Support',
    pricingProFeature5: 'API Access',
    pricingProFeature6: 'Custom Reports',
    pricingProCTA: 'Coming Soon',
    pricingMostPopular: 'Most Popular',
    pricingEnterprise: 'Enterprise',
    pricingEnterprisePrice: 'Custom',
    pricingEnterpriseDescription: 'For large organizations.',
    pricingEnterpriseFeature1: 'Custom AI Models',
    pricingEnterpriseFeature2: 'Dedicated Account Manager',
    pricingEnterpriseFeature3: 'SLA Guarantee',
    pricingEnterpriseFeature4: 'White Label Options',
    pricingEnterpriseFeature5: 'Advanced Analytics',
    pricingEnterpriseFeature6: 'SSO & Security',
    pricingEnterpriseCTA: 'Contact Sales',

    // FAQs
    faqsTag: 'FAQs',
    faqsTitle: "Questions? We've got",
    faqsTitleHighlight: 'answers',
    faqQuestion1: 'What is AEO and how is it different from SEO?',
    faqAnswer1: 'AEO (Answer Engine Optimization) focuses on optimizing your content for AI-powered search engines like ChatGPT, Claude, and Perplexity. Unlike traditional SEO that targets ranking in 10 blue links, AEO aims to make your brand the definitive answer in AI responses.',
    faqQuestion2: 'Which AI platforms does Mentha support?',
    faqAnswer2: 'Mentha currently supports OpenAI (ChatGPT), Anthropic (Claude), Perplexity, and Google Gemini. We continuously add new platforms as they emerge in the AI search landscape.',
    faqQuestion3: 'How does brand monitoring work?',
    faqAnswer3: "Mentha regularly queries AI platforms about your brand and tracks how you're mentioned, the sentiment of responses, and your visibility compared to competitors. You'll receive alerts when significant changes occur.",
    faqQuestion4: 'Can I see how competitors appear in AI responses?',
    faqAnswer4: 'Yes! Our competitor intelligence feature lets you track how rivals appear in AI-generated answers, compare share of voice, and identify opportunities to improve your positioning.',
    faqQuestion5: 'Is there a free trial available?',
    faqAnswer5: 'Absolutely! Start with our free tier that includes 10 analyses per month. Upgrade to Pro for unlimited analyses and advanced features like competitor tracking and API access.',

    // Call to Action
    ctaText: 'Start for free',

    // Footer
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms & Conditions',
    footerBlog: 'Blog',
    footerRights: 'All rights reserved.',

    // Privacy Policy Page
    privacyPolicy: 'Privacy Policy',
    privacyLastUpdated: 'Last updated:',
    privacySection1Title: '1. Information We Collect',
    privacySection1Text: 'We collect information you provide directly (such as name, email, billing data) and data automatically collected when you use the service (usage logs, IP address, cookies).',
    privacySection2Title: '2. Use of Information',
    privacySection2Text: 'We use your information to:',
    privacySection2Item1: 'Provide, maintain, and improve our services.',
    privacySection2Item2: 'Process transactions and send related notifications.',
    privacySection2Item3: 'Analyze trends and usage to optimize the user experience.',
    privacySection2Item4: 'Detect and prevent fraud or abuse.',
    privacySection3Title: '3. Sharing Information',
    privacySection3Text: 'We do not sell your personal data. We only share information with third-party service providers (such as hosting, payment processing) who need access to perform work on our behalf and under strict confidentiality obligations.',
    privacySection4Title: '4. Data Security',
    privacySection4Text: 'We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.',
    privacySection5Title: '5. Your Rights (GDPR/CCPA)',
    privacySection5Text: 'Depending on your location, you may have rights to access, correct, delete, or restrict the use of your personal data. To exercise these rights, contact us at privacy@mentha.ai.',
    privacySection6Title: '6. Data Retention',
    privacySection6Text: 'We retain your personal data as long as your account is active or as needed to provide you services, comply with legal obligations, resolve disputes, and enforce our agreements.',
    privacySection7Title: '7. International Transfers',
    privacySection7Text: 'Your data may be transferred and processed on servers located outside your country of residence. We take steps to ensure your data is treated securely and in accordance with this policy.',

    // Terms & Conditions Page
    termsAndConditions: 'Terms & Conditions',
    termsLastUpdated: 'Last updated:',
    termsSection1Title: '1. Introduction',
    termsSection1Text: 'Welcome to Mentha ("we", "our" or "the Platform"). By accessing or using our website and services, you agree to be legally bound by these Terms and Conditions ("Terms"). If you do not agree with any of these terms, you should not use our services.',
    termsSection2Title: '2. Service Description',
    termsSection2Text: 'Mentha is an AI Engine Optimization (AEO) platform that provides analysis, tracking, and recommendation tools to improve brand visibility in generative language models.',
    termsSection3Title: '3. User Accounts',
    termsSection3Text: 'To access certain features, you must register and create an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these terms.',
    termsSection4Title: '4. Subscriptions and Payments',
    termsSection4Text: 'Some services are offered under paid subscription models. By subscribing, you agree to pay the applicable fees according to the selected plan. Payments are processed through secure providers (Stripe). Subscriptions renew automatically unless canceled before the end of the current period.',
    termsSection5Title: '5. Intellectual Property',
    termsSection5Text: 'All content, software, and technology of Mentha are the exclusive property of us or our licensors. You retain ownership of the data you upload to the platform, but you grant us a license to process it in order to provide the service.',
    termsSection6Title: '6. Limitation of Liability',
    termsSection6Text: 'Mentha is provided "as is". We do not guarantee specific results in AI engine positioning, as these depend on third-party algorithms that change constantly. To the maximum extent permitted by law, we will not be liable for indirect or consequential damages.',
    termsSection7Title: '7. Modifications',
    termsSection7Text: 'We may update these Terms occasionally. We will notify you of significant changes by sending a notice to the email address associated with your account or by posting a visible notice on our site.',
    termsSection8Title: '8. Contact',
    termsSection8Text: 'If you have questions about these Terms, contact us at legal@mentha.ai.',

    // ==========================================
    // APP PAGES
    // ==========================================

    // Navigation
    dashboard: 'Dashboard',
    brands: 'Brands',
    keywords: 'Keywords',
    competitors: 'Competitors',
    search: 'Search',
    notifications: 'Notifications',
    notificationsDescription: 'We will notify you when there are important updates for your brands.',
    settings: 'Settings',

    // Settings
    profile: 'Profile',
    security: 'Security',
    billing: 'Billing',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',

    // User menu
    myAccount: 'My Account',
    logout: 'Log out',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    searchPlaceholder: 'Search...',
    searchBrands: 'Search brands, queries, models...',

    // Search page
    searchTitle: 'Search',
    searchDescription: 'Find brands, queries and insights in your panel.',
    recentSearches: 'Recent Searches',
    popularSearches: 'Popular Searches',
    noRecentSearches: 'No recent searches',
    noPopularSearches: 'No popular searches',
    noBrandsFound: 'No brands found',
    quickAccess: 'Quick Access',
    queries: 'queries',
    searches: 'searches',
    hoursAgo: '{n} hours ago',
    yesterday: 'Yesterday',
    daysAgo: '{n} days ago',

    // Dashboard
    rankingMovements: 'Ranking movements this week.',
    brandOverview: 'Brand Overview',
    competitorOverview: 'Competitor Overview',
    notableChanges: 'Notable Changes',
    rankingImproved: 'Ranking improved for',
    newMention: 'New mention detected for',
    performanceImprovement: 'Performance improvement for',
    visibilityIncreased: 'increased visibility in',
    trackBrand: 'Track your brand',
    invisibleInAI: 'Being invisible in AI hurts more than a 404 error',
    averagePosition: 'Average position',
    inclusionRate: 'Inclusion rate',
    bestModel: 'Best model',
    brand: 'Brand',
    position: 'Position',

    // Brand pages
    overview: 'Overview',
    overviewTooltip: 'General dashboard with key metrics, insights and your brand status',
    keywordsTooltip: 'Analyze how your brand appears in AI responses for different keywords',
    searchPerformanceTooltip: 'Performance metrics in traditional search engines (Google, Bing)',
    competitionTooltip: 'Compare your AI visibility against your competitors',
    crawlersTooltip: 'Monitor which AI bots are crawling your website',
    brandQueries: 'Queries',
    aiCrawlers: 'AI Crawlers',
    analysisPending: 'Analysis pending...',
    deleteBrand: 'Delete Brand',
    areYouSure: 'Are you absolutely sure?',
    deleteWarning: 'This action cannot be undone. This will permanently delete the brand {name} and all associated data including keywords, competitors, and analysis history.',
    deleting: 'Deleting...',

    // Brand info
    airbnbDescription: 'Global vacation rental platform connecting travelers with unique accommodations and local experiences.',
    airbnbLocation: 'San Francisco, USA',
    stravaDescription: 'Social fitness network for athletes to track, analyze and share their workouts and activities.',
    stravaLocation: 'San Francisco, USA',
    vercelDescription: 'Frontend cloud platform to build, deploy and scale modern web applications with optimal performance.',
    vercelLocation: 'San Francisco, USA',
    revolutDescription: 'Digital banking app offering currency exchange, money transfers and financial management tools.',
    revolutLocation: 'London, United Kingdom',

    // Time
    hoursAgo2: '2 hours ago',
    hoursAgo5: '5 hours ago',
    hoursAgo234: '234 searches',
    hoursAgo189: '189 searches',
    hoursAgo156: '156 searches',
    hoursAgo142: '142 searches',

    // Popular searches text
    bestBrandsAI: 'Best brands in AI',
    modelRanking: 'Model ranking',
    competitorComparison: 'Competitor comparison',
    mentionTrends: 'Mention trends',

    // Recent searches text
    airbnbPerformance: 'Airbnb performance',
    stravaComparison: 'Strava vs competitors comparison',
    vercelRanking: 'Vercel ranking in GPT-5',
    revolutMentions: 'Revolut fintech mentions',

    // Sidebar
    createBrand: 'Create brand',
    panel: 'Dashboard',
    aeoAnalysis: 'AEO Analysis',
    keywordsAI: 'AI Keywords',
    competition: 'Competition',

    // Common words
    in: 'in',
    of: 'of',
    for: 'for',

    // Competitors page
    competitorsTitle: 'Competitors',
    addCompetitor: 'Add Competitor',
    competitorName: 'Competitor Name',
    competitorDomain: 'Domain',
    visibilityScore: 'Visibility Score',
    mentions: 'Mentions',
    avgPosition: 'Avg Position',
    trend: 'Trend',
    actions: 'Actions',
    noCompetitors: 'No competitors added',

    // Keywords page
    keywordsTitle: 'Keywords',
    addKeyword: 'Add Keyword',
    keyword: 'Keyword',
    visibility: 'Visibility',
    difficulty: 'Difficulty',
    volume: 'Volume',
    noKeywords: 'No keywords added',

    // Notifications
    notificationsTitle: 'Notifications',
    markAllRead: 'Mark all as read',
    markAsRead: 'Mark as read',
    today: 'Today',
    thisWeek: 'This week',
    ago: 'ago',
    rankingImprovement: 'Ranking improvement for',
    newMentionDetected: 'New mention detected for',
    noNotifications: 'No notifications',

    // Settings page
    configuration: 'Settings',
    quickSettings: 'Quick settings',
    closeSettings: 'Close settings',
    close: 'Close',
    openFullSettings: 'Open full settings',
    changeAppTheme: 'Change the app theme',
    advancedAppearance: 'Advanced appearance settings.',
    saving: 'Saving...',
    updating: 'Updating...',
    preferencesSaved: 'Preferences saved',
    errorSavingPreferences: 'Error saving preferences',
    nameRequired: 'Name required',
    profileUpdated: 'Profile updated',
    errorSaving: 'Error saving',
    fillFields: 'Fill in the fields',
    passwordMinLength: 'Password must be at least 6 characters',
    passwordsNoMatch: 'Passwords do not match',
    passwordUpdated: 'Password updated',
    errorUpdatingPassword: 'Error updating password',
    name: 'Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    user: 'User',
    email: 'Email',
    saveChanges: 'Save changes',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    updatePassword: 'Update password',
    rankingChanges: 'Ranking changes',
    receiveAlertsWhenBrandsChange: 'Receive alerts when your brands change position',
    newMentions: 'New mentions',
    notificationsWhenNewMentions: 'Notifications when new mentions are detected',
    weeklyReports: 'Weekly reports',
    weeklyPerformanceSummary: 'Weekly performance summary by email',
    productUpdates: 'Product updates',
    newsAboutFeatures: 'News about new features and improvements',
    freePlan: 'Free Plan',
    tokensUsedThisMonth: '0 / 10,000 tokens used this month',
    upgradeToPro: 'Upgrade to Pro',
    billingHistory: 'Billing history',
    noInvoicesAvailable: 'No invoices available',

    // Upgrade page
    upgradePlan: 'Upgrade Plan',
    upgradeToProUnlock: 'Upgrade to Pro and unlock insights',
    upgradeDescription: 'More queries, advanced analysis, priority support and exports. All designed to scale your brand research.',
    startUpgrade: 'Start upgrade',
    backToPanel: 'Back to panel',
    yourPlan: 'Your plan',
    freeBasicTrial: 'Basic trial — limited to 100 queries/month',
    upgrade: 'Upgrade',
    whyPro: 'Why Pro',
    whyProDescription: 'Access higher query quota, extended history and per-model analysis.',
    support: 'Support',
    supportDescription: 'Dedicated channel and priority response times for issues and configurations.',
    exports: 'Exports',
    exportsDescription: 'Export reports in CSV/PDF and connect with your data pipelines.',
    proBasic: 'Pro Basic',
    proBasicFeature1: '1,000 queries/month',
    proBasicFeature2: 'Per-model analysis',
    proBasicFeature3: 'Email support',
    proPlus: 'Pro Plus',
    proPlusFeature1: '5,000 queries/month',
    proPlusFeature2: '12-month extended history',
    proPlusFeature3: 'Priority support',
    enterprise: 'Enterprise',
    contact: 'Contact',
    enterpriseFeature1: 'Unlimited queries',
    enterpriseFeature2: 'SLA and dedicated support',
    enterpriseFeature3: 'Custom integration',
    select: 'Select',
    contactUs: 'Contact',
    perMonth: '/month',

    // Brand pages
    brandSummary: 'Brand Summary',
    scorePending: 'Score pending',
    noCompetitorsTracked: 'No competitors tracked',
    analysisRequired: 'Analysis required to identify potential competitors.',
    analysisInProgress: 'Analysis is in progress. We will notify you when suggestions are available.',
    noRecommendationsFound: 'No specific recommendations found.',
    startAnalysisForRecs: 'Start an analysis to get recommendations.',

    // Crawlers page
    robotsTxtStatus: 'Robots.txt Status',
    analyzingCrawlPermissions: 'Analyzing crawl permissions...',
    aiCrawlerPermissions: 'AI Crawler Permissions',
    verifyingRobotsTxt: 'Verifying robots.txt permissions...',
    noPermissionsData: 'No permissions data found.',
    verifyingRobotsPermissions: 'Verifying robots.txt permissions...',
    noPermissionsDataFound: 'No permissions data found.',
    analysisInProgressNotify: 'Analysis is in progress. We will notify you when suggestions are available.',

    // Dashboard page
    averagePositionShort: 'AVG POSITION',
    dashboardOverallVisibility: 'Overall visibility score across all AI engines',
    dashboardAvgPositionDesc: 'Average ranking position in search results',
    dashboardInclusionRateDesc: 'Percentage of queries where your brand appears',
    dashboardUnlockTracking: 'Unlock Advanced Tracking',
    dashboardUpgradeMessage: 'Upgrade your brand plan to track performance across personas, regions, and languages.',
    dashboardCompetitionPerformance: 'Competition Performance',
    dashboardLive: 'Live',
    dashboardModelPerformance: 'Model Performance',
    dashboardNoData: 'No data',

    // Notifications page detailed
    airbnbRankingImprovement: 'Airbnb moved up 3 positions in GPT-5 for "travel recommendations" queries.',
    vercelNewMention: 'Vercel was mentioned in Claude-4-sonnet for "web development tools".',
    competitionChange: 'Competition change',
    daysAgo1: '1d ago',
    bookingVsExpedia: 'Booking.com surpassed Expedia in the "hotel booking sites" ranking.',
    stravaNewRecord: 'Strava reaches new record',
    stravaReachedPosition: 'Strava reached position #1 in Grok-3 for "fitness apps".',
    weeklyReportAvailable: 'Weekly report available',
    daysAgo3: '3d ago',
    weeklyReportReady: 'Your weekly performance report is ready to review.',
    viewReport: 'View report',

    // Competitors page (Detailed)
    competitorsTracked: 'Tracked Competitors',
    inYourIndustry: 'In your industry',
    yourPosition: 'Your Position',
    movedUpPositions: 'Position change',
    visibilityGap: 'Visibility Gap',
    vsIndustryLeader: 'vs. industry leader',
    opportunities: 'Opportunities',
    keywordsToImprove: 'Keywords to improve',
    analyzePerformanceVsCompetitors: 'Analyze your performance against competitors in AI engines',
    addNewCompetitor: 'Add New Competitor',
    enterCompetitorData: 'Enter the competitor data you want to analyze',
    competitorNameLabel: 'Competitor Name',
    competitorNamePlaceholder: 'E.g: Company XYZ',
    domainLabel: 'Domain',
    domainPlaceholder: 'E.g: companyxyz.com',
    add: 'Add',
    searchCompetitors: 'Search competitors...',
    competitor: 'Competitor',
    domain: 'Domain',
    aiMentions: 'AI Mentions',
    avgPositionShort: 'Avg Position',
    strengths: 'Strengths',
    gapAnalysis: 'Gap Analysis',
    identifyAreasWhereCompetitors: 'Identify areas where competitors surpass you',
    contentQuality: 'Content Quality',
    them: 'Them',
    you: 'You',
    domainAuthority: 'Domain Authority',
    keywordCoverage: 'Keyword Coverage',
    errorTitle: 'Error',
    pleaseCompleteAllFields: 'Please complete all fields',
    competitorAdded: 'Competitor added',
    competitorAddedToList: '{name} was added to your competitors list',
    failedToLoadCompetitors: 'Failed to load competitors',
    failedToAddCompetitor: 'Failed to add competitor',

    // Keywords page (Detailed)
    trackedKeywords: 'Tracked Keywords',
    sinceLastMonth: 'since last month',
    averageVisibility: 'Average Visibility',
    thisMonth: 'this month',
    top3Positions: 'Top 3 Positions',
    ofYourKeywords: 'of your keywords',
    potentialImprovements: 'Potential Improvements',
    opportunitiesIdentified: 'Opportunities identified',
    keywordManagement: 'Keyword Management',
    trackKeywordPerformance: 'Track your keywords performance in AI engines',
    addNewKeyword: 'Add New Keyword',
    enterKeywordToTrack: 'Enter the keyword you want to track in AI engines',
    keywordLabel: 'Keyword',
    keywordPlaceholder: 'E.g: management software',
    searchKeywords: 'Search keywords...',
    aiVisibility: 'AI Visibility',
    aiModels: 'AI Models',
    pleaseEnterKeyword: 'Please enter a keyword',
    keywordAdded: 'Keyword added',
    keywordAddedToTracking: '"{keyword}" was added to your tracking list',
    keywordsDescription: 'Manage and track your SEO keywords',
    totalKeywords: 'Total Keywords',
    avgVisibility: 'Avg. Visibility',
    highDifficulty: 'High Difficulty',
    opportunity: 'Opportunity',
    sort: 'Sort',
    trend7d: 'Trend (7d)',
    loadingKeywords: 'Loading keywords...',
    noKeywordsFoundSearch: 'No keywords found matching your search.',
    viewDetails: 'View details',
    analyzeNow: 'Analyze now',
    deleteKeyword: 'Delete keyword',
    openMenu: 'Open menu',

    // Sidebar
    closeMenu: 'Close menu',
    almostReachedLimit: 'Almost reached your limit',
    tokensUsed: 'tokens used',
    upgradeToProArrow: 'Upgrade to Pro →',
    logoutButton: 'Log out',

    // Brand pages
    brandNotFound: 'Brand not found',
    backToBrand: 'Back to brand',
    lastVisit: 'Last visit',
    lastCrawl: 'Last crawl',
    crawlFrequency: 'Crawl frequency',
    dailyCrawls: 'Daily crawls',
    pagesIndexed: 'Pages indexed',
    crawlStatus: 'Crawl status',
    model: 'Model',
    hourAgo: '1 hour ago',
    minutesAgo: '{n} minutes ago',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',

    // Crawlers page
    aiCrawlersMonitor: 'AI Crawlers Monitor',
    trackBotsVisiting: 'Track which AI bots are visiting your website and what content they are indexing',
    activeCrawlers: 'Active Crawlers',
    visitsToday: 'Visits Today',
    pagesIndexedShort: 'Pages Indexed',
    weeklyTrend: 'Weekly Trend',
    gptBotVisited: 'GPTBot visited your site 2 hours ago',
    gptBotInsight: 'This indicates that OpenAI is updating its knowledge base. Your recent content is likely to appear in GPT-5 in the coming days.',
    crawlerActivity: 'Crawler Activity',
    frequency: 'Frequency',
    pagesVisited: 'Pages visited',
    topPages: 'Top pages',
    avgCrawlTime: 'Average crawl time',
    everyDays: 'Every {n} days',
    infrequent: 'Infrequent',
    every3Days: 'Every 3 days',
    daysAgo2: '2 days ago',
    oct13Date: 'Oct 13, 2025, 10:10 PM',

    // Queries page
    queriesManagement: 'Query Management',
    trackPerformanceAcrossAI: 'Track your queries performance across AI models',
    queryTemplates: 'Query Templates',
    queriesLowercase: 'Queries',
    comparison: 'Comparison',
    definition: 'Definition',
    recommendation: 'Recommendation',
    tutorial: 'Tutorial',
    topX: 'Top X',
    review: 'Review',
    category: 'Category',
    query: 'Query',
    status: 'Status',
    frequencyShort: 'Frequency',
    lastRun: 'Last run',
    nextRun: 'Next run',
    mentionsShort: 'Mentions',
    avgPos: 'Avg Pos',
    paused: 'Paused',

    // Overview page
    actionableInsights: 'Actionable Insights',
    pendingActions: '{n} pending',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    priority: 'Priority',
    action: 'Action',
    reason: 'Reason',
    estimatedImpact: 'Estimated impact',
    visibilityLowercase: 'visibility',
    mentionsLowercase: 'mentions',
    competitorAnalysis: 'Competitor Analysis',
    trackCompetitors: 'Track competitors',
    vsYou: 'vs. You',
    includedIn: 'Included in',
    responses: 'responses',
    topQueries: 'Top Queries',
    potentialCompetitors: 'Potential Competitors',
    addCompetitors: 'Add Competitors',

    // Additional crawlers translations
    activityTimeline: 'Activity Timeline (Last 24h)',
    indexedPages: 'Indexed {n} new pages',
    visitedHomepage: 'Visited homepage',
    scannedDocumentation: 'Scanned documentation',
    deepCrawling: 'Deep crawling',

    // Additional queries translations
    queryBuilder: 'Query Builder',
    createStrategicQueries: 'Create and manage strategic queries to monitor your AI visibility',
    newQuery: 'New Query',
    categories: 'categories',
    generateQueriesAutomatically: 'Generate queries automatically based on proven AI-Visibility strategies',
    useTemplate: 'Use template',
    totalQueries: 'Total Queries',
    activeQueries: 'Active Queries',
    queriesPaused: 'Queries Paused',
    avgMentionRate: 'Avg Mention Rate',
    allQueries: 'All Queries',
    pause: 'Pause',
    resume: 'Resume',
    duplicate: 'Duplicate',
    delete: 'Delete',
    models: 'models',
    lastExecution: 'Last execution',
    nextExecution: 'Next execution',
    filter: 'Filter',
    pages: 'pages',

    // ==========================================
    // AUTH PAGES
    // ==========================================
    authLogin: 'Log In',
    authLoginDescription: 'Access your Mentha AEO account',
    authEmail: 'Email',
    authEmailPlaceholder: 'you@email.com',
    authPassword: 'Password',
    authPasswordPlaceholder: '••••••••',
    authConfirmPassword: 'Confirm Password',
    authForgotPassword: 'Forgot your password?',
    authLoggingIn: 'Logging in...',
    authLoginButton: 'Log In',
    authOrContinueWith: 'Or continue with',
    authGoogle: 'Google',
    authNoAccount: "Don't have an account?",
    authSignUp: 'Sign up',
    authHaveAccount: 'Already have an account?',
    authSignIn: 'Sign in',

    authSignUpTitle: 'Create Account',
    authSignUpDescription: 'Join Mentha AEO and optimize your AI presence',
    authFullName: 'Full Name',
    authFullNamePlaceholder: 'Your full name',
    authCreatingAccount: 'Creating account...',
    authCreateAccount: 'Create Account',

    authSignUpSuccess: 'Registration Successful!',
    authSignUpSuccessMessage: 'Check your email to confirm your account. You will be redirected to login in a few seconds...',

    authForgotTitle: 'Forgot your password?',
    authForgotDescription: 'Enter your email and we will send you a link to reset it.',
    authSendingLink: 'Sending...',
    authSendLink: 'Send link',
    authBackToLogin: 'Back to login',
    authEmailSentTitle: 'Link sent!',
    authEmailSentDescription: 'Check your email. If it doesn\'t arrive, check your spam folder.',

    authResetTitle: 'Reset Password',
    authResetDescription: 'Enter your new password.',
    authNewPassword: 'New password',
    authNewPasswordPlaceholder: 'Minimum 8 characters',
    authSaving: 'Saving...',
    authResetButton: 'Reset password',
    authResetSuccess: 'Password updated!',
    authResetSuccessMessage: 'Your password has been updated successfully.',
    authGoToLogin: 'Go to login',
    authInvalidLink: 'No valid recovery link detected. Please request one from the recovery screen.',
    authRequestLink: 'Request link',
    authPasswordsNoMatch: 'Passwords do not match',
    authPasswordTooWeak: 'Password does not meet minimum requirements',

    // ==========================================
    // BLOG
    // ==========================================
    blogTitle: 'The Mentha Blog',
    blogDescription: 'Insights, strategies, and guides for the new era of Answer Engine Optimization.',
    blogReadArticle: 'Read Article',
    blogBackToBlog: 'Back to Blog',
    blogReadyToOptimize: 'Ready to optimize for the future?',
    blogStartOptimizing: 'Start optimizing your brand for AI search today with Mentha\'s AI visibility platform.',
    blogGetStartedFree: 'Get Started for Free',

    // ==========================================
    // DASHBOARD
    // ==========================================
    dashboardTitle: 'Dashboard',
    dashboardDescription: 'Overview of your AI engine visibility',
    dashboardRankScore: 'Rank Score',
    dashboardAvgPosition: 'Avg. Position',
    dashboardInclusionRate: 'Inclusion Rate',
    dashboardTracking: 'Tracking',
    dashboardInactive: 'Inactive',
    dashboardVisibilityTrend: 'Visibility Trend',
    dashboardVisibilityTrendDescription: 'Your AI visibility score over time',
    dashboardNoHistoricalData: 'No historical data available yet',
    dashboardRecommendedActions: 'Recommended Actions',
    dashboardImproveStanding: 'Improve your standing',
    dashboardNoActionsYet: 'No actions recommended yet.',
    dashboardCompetitors: 'Competitors',
    dashboardCompetitorsDescription: 'Comparison with your competition',
    dashboardNoCompetitors: 'No competitors tracked.',
    dashboardTopKeywords: 'Top Keywords',
    dashboardHighOpportunity: 'High opportunity terms',
    dashboardNoKeywords: 'No keywords found.',
    dashboardRecentActivity: 'Recent Activity',
    dashboardRecentActivityDescription: 'Latest AI crawler visits',
    dashboardNoCrawlerActivity: 'No recent crawler activity.',
    settingsDescription: 'Manage your account and preferences',
    personalInformation: 'Personal Information',
    personalInfoDescription: 'Update your personal details and public profile.',
    changeAvatar: 'Change Avatar',
    passwordSecurity: 'Password & Security',
    passwordSecurityDescription: 'Manage your password and security settings.',
    emailNotifications: 'Email Notifications',
    emailNotificationsDescription: 'Choose what updates you want to receive.',
    currentPlan: 'Current Plan',
    currentPlanDescription: 'Manage your subscription and billing details.',
    activeStatus: 'Active',
    basicFeatures: 'Basic features for personal use',
    appearanceTitle: 'Appearance',
    appearanceDescription: 'Customize the look and feel of the application.',
    errorLoadingUser: 'Error loading user',
    notificationPrefsSaved: 'Notification preferences saved',
    errorSavingNotificationPrefs: 'Error saving notification preferences',
    profileUpdatedSuccess: 'Profile updated successfully',
    changesSaved: 'Your changes have been saved',
    errorUpdatingProfile: 'Error updating profile',
    tryAgain: 'Try again',
    completePasswordFields: 'Please complete all password fields',
    passwordUpdatedSuccess: 'Password updated successfully',
    languageChangedTo: 'Language changed to',
    dashboardNotifications: 'Notifications',

    // Cookie Consent
    cookieTitle: 'We value your privacy',
    cookieDescription: 'We use cookies to improve your experience, analyze traffic, and personalize content. By clicking "Accept", you consent to the use of all cookies. You can read more in our ',
    cookiePolicy: 'Cookie Policy',
    cookieAccept: 'Accept',
    cookieDecline: 'Decline',

    // Command Palette
    cmdDashboard: 'Go to Dashboard',
    cmdSearch: 'Search',
    cmdNotifications: 'Notifications',
    cmdSettings: 'Settings',
    cmdUpgrade: 'Upgrade Plan',
    cmdShortcuts: 'View Shortcuts',
    cmdTheme: 'Change Theme',
    cmdPlaceholder: 'Search keyboard shortcuts...',
    cmdNoResults: 'No shortcuts found.',
    cmdNavigation: 'Navigation',
    cmdHelp: 'Help',
    cmdAppearance: 'Appearance',

    // ==========================================
    // AEO ANALYSIS
    // ==========================================
    aeoTitle: 'AEO Analysis',
    aeoNewAnalysis: 'New Analysis',
    aeoDescription: 'Analyze content to optimize your visibility in AI engines',
    aeoDomain: 'Domain',
    aeoDomainPlaceholder: 'example.com',
    aeoAnalysisType: 'Analysis Type',
    aeoContent: 'Content',
    aeoFullDomain: 'Full Domain',
    aeoKeywords: 'Keywords',
    aeoCompetition: 'Competition',
    aeoAIModel: 'AI Model',
    aeoChatGPT: 'ChatGPT (GPT-4o)',
    aeoClaude: 'Claude (Sonnet)',
    aeoContentToAnalyze: 'Content to Analyze',
    aeoContentPlaceholder: 'Paste the content you want to analyze here...',
    aeoAnalyzing: 'Analyzing...',
    aeoAnalyzeWithAI: 'Analyze with AI',
    aeoResults: 'Analysis Results',
    aeoResultsDescription: 'Your AEO score and recommendations',
    aeoResultsPlaceholder: 'Results will appear here',
    aeoInstructions: 'Fill the form and click "Analyze with AI" to get your AEO score',
    aeoScore: 'AEO Score',
    aeoStrengths: 'Strengths',
    aeoWeaknesses: 'Weaknesses',
    aeoActions: 'Actions',
    aeoSuggestedKeywords: 'Suggested Keywords',
    aeoRecentAnalyses: 'Recent Analyses',
    aeoHistoryDescription: 'History of performed analyses',
    aeoNoHistory: 'No previous analyses. Perform your first AEO analysis above.',
    aeoUnknownDomain: 'Unknown domain',
    aeoView: 'View',
    aeoFillAllFields: 'Please fill in the domain and content',

    // ==========================================
    // SETTINGS PAGE - ORGANIZATION TAB
    // ==========================================
    organization: 'Organization',
    companyDetails: 'Company Details',
    currentPlanLabel: 'Current Plan',
    renewsOn: 'Renews on',
    teamMembers: 'Team Members',
    peopleWithAccess: 'People with access to this workspace.',
    invite: 'Invite',
    remove: 'Remove',
    inviteFunctionalityInDev: 'Invite functionality in development.',
    errorUploadingImage: 'Error uploading image',

    // ==========================================
    // ADMIN - USERS PAGE
    // ==========================================
    adminUserManagement: 'User Management',
    adminUsers: 'users',
    searchByEmailOrName: 'Search by email or name...',
    plan: 'Plan',
    all: 'All',
    state: 'Status',
    actives: 'Active',
    suspended: 'Suspended',
    sortBy: 'Sort by',
    registrationDate: 'Registration date',
    lastLogin: 'Last login',
    userColumn: 'User',
    brandsColumn: 'Brands',
    country: 'Country',
    registration: 'Registration',
    actionsColumn: 'Actions',
    noName: 'No name',
    never: 'Never',
    suspendedStatus: 'Suspended',
    reactivateAccount: 'Reactivate account',
    suspend: 'Suspend',
    noUsersFound: 'No users found',
    showing: 'Showing',
    to: 'to',
    ofTotal: 'of',
    usersLabel: 'users',
    page: 'Page',
    ofPages: 'of',
    userDetails: 'User Details',
    company: 'Company',
    industry: 'Industry',
    role: 'Role',
    onboardingStatus: 'Onboarding Status',
    completed: 'Completed',
    step: 'Step',
    brandsLabel: 'Brands',
    suspendUser: 'Suspend User',
    suspendUserDescription: 'The user will not be able to access the platform until reactivated.',
    suspendReason: 'Suspension reason',
    suspendReasonPlaceholder: 'Describe the reason for suspension...',
    suspending: 'Suspending...',
    deleteUserPermanently: 'Delete user permanently?',
    deleteUserWarning: 'This action cannot be undone. All user data will be deleted, including brands, analyses, and settings.',
    deleteUser: 'Delete User',
    errorLoadingUsers: 'Error loading users',
    errorLoadingUserDetails: 'Error loading user details',
    userSuspendedSuccess: 'User suspended successfully',
    errorSuspendingUser: 'Error suspending user',
    userReactivatedSuccess: 'User reactivated successfully',
    errorReactivatingUser: 'Error reactivating user',
    userDeletedSuccess: 'User deleted successfully',
    errorDeletingUser: 'Error deleting user',

    // ==========================================
    // ADMIN - CATEGORIES PAGE
    // ==========================================
    adminCategories: 'Categories',
    categoriesCount: 'categories',
    categoriesInactive: 'Inactive',
    newCategory: 'New',
    noCategories: 'No categories',
    createFirstCategory: 'Create your first category for onboarding',
    newCategoryTitle: 'New Category',
    createNewIndustryCategory: 'Create a new industry category',
    categoryName: 'Name',
    categoryNamePlaceholder: 'E.g: Technology',
    slug: 'Slug',
    slugPlaceholder: 'E.g: technology',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Category description...',
    color: 'Color',
    order: 'Order',
    creating: 'Creating...',
    createCategory: 'Create Category',
    editCategory: 'Edit Category',
    modifyCategoryDetails: 'Modify category details',
    saveChangesBtn: 'Save Changes',
    deleteCategory: 'Delete category?',
    deleteCategoryWarning: 'This action cannot be undone. The category will be permanently deleted.',
    errorLoadingCategories: 'Error loading categories',
    nameAndSlugRequired: 'Name and slug are required',
    categoryCreatedSuccess: 'Category created successfully',
    errorCreatingCategory: 'Error creating category',
    categoryUpdatedSuccess: 'Category updated successfully',
    errorUpdatingCategory: 'Error updating category',
    categoryDeletedSuccess: 'Category deleted successfully',
    errorDeletingCategory: 'Error deleting category',
    categoryActivated: 'Category activated',
    categoryDeactivated: 'Category deactivated',
  },
} as const

// Storage keys
const LANGUAGE_KEY = 'language'
const LANGUAGE_MANUALLY_SET_KEY = 'language_manually_set'
const GEO_LANGUAGE_KEY = 'geo_language'

export function getTranslations(lang: Language = 'es') {
  return translations[lang] || translations.es
}

/**
 * Check if user manually selected a language (has priority over geolocation)
 */
export function isLanguageManuallySet(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(LANGUAGE_MANUALLY_SET_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Get the stored language from localStorage
 */
export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'es'
  try {
    const lang = localStorage.getItem(LANGUAGE_KEY) as Language
    return lang === 'en' || lang === 'es' ? lang : 'es'
  } catch {
    return 'es'
  }
}

/**
 * Set language manually (user preference - has priority)
 */
export function setLanguage(lang: Language) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
    localStorage.setItem(LANGUAGE_MANUALLY_SET_KEY, 'true')
    // Update HTML lang attribute
    document.documentElement.lang = lang
    // Trigger a custom event to notify components
    window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }))
  } catch {
    // ignore
  }
}

/**
 * Set language from geolocation (only if user hasn't manually set a preference)
 */
export function setGeoLanguage(lang: Language) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GEO_LANGUAGE_KEY, lang)
    // Only apply if no manual preference
    if (!isLanguageManuallySet()) {
      localStorage.setItem(LANGUAGE_KEY, lang)
      document.documentElement.lang = lang
      window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }))
    }
  } catch {
    // ignore
  }
}

/**
 * Detect user's country and set language accordingly
 * Spain (ES) -> Spanish
 * Rest of the world -> English
 */
export async function detectAndSetGeoLanguage(): Promise<Language> {
  if (typeof window === 'undefined') return 'es'

  // If user has manually set a language, respect that choice
  if (isLanguageManuallySet()) {
    return getLanguage()
  }

  try {
    // Use a geolocation API to detect country
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (!response.ok) throw new Error('Failed to fetch geolocation')

    const data = await response.json()
    const countryCode = data.country_code

    // Spain -> Spanish, rest of the world -> English
    const detectedLang: Language = countryCode === 'ES' ? 'es' : 'en'
    setGeoLanguage(detectedLang)

    return detectedLang
  } catch (error) {
    // If geolocation fails, default to Spanish
    console.warn('Geolocation detection failed, defaulting to Spanish:', error)
    return getLanguage()
  }
}

// Hook para usar traducciones en componentes
export function useTranslations() {
  const [lang, setLangState] = useState<Language>('es')
  const [t, setT] = useState(() => getTranslations('es'))
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeLanguage = async () => {
      // First, check if there's a stored language
      const storedLang = getLanguage()
      setLangState(storedLang)
      setT(getTranslations(storedLang))

      // If no manual preference, try to detect via geolocation
      if (!isLanguageManuallySet()) {
        const detectedLang = await detectAndSetGeoLanguage()
        setLangState(detectedLang)
        setT(getTranslations(detectedLang))
      }

      setIsInitialized(true)
    }

    initializeLanguage()

    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      const newLang = event.detail || getLanguage()
      setLangState(newLang)
      setT(getTranslations(newLang))
    }

    window.addEventListener('languagechange', handleLanguageChange as EventListener)

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange as EventListener)
    }
  }, [])

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang)
    setLangState(newLang)
    setT(getTranslations(newLang))
  }

  return { t, lang, setLanguage: changeLanguage, isInitialized }
}

export type { Language }

