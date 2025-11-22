'use client'

import { useState, useEffect } from 'react'

type Language = 'es' | 'en'

const translations = {
  es: {
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
    
    // Keywords page
    keywordsTitle: 'Palabras Clave',
    addKeyword: 'Agregar Keyword',
    keyword: 'Keyword',
    visibility: 'Visibilidad',
    difficulty: 'Dificultad',
    volume: 'Volumen',
    noKeywords: 'No hay keywords agregadas',
    
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
    
    // Dashboard page
    averagePositionShort: 'POSICIÓN PROM.',
    
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
  },
  en: {
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
    
    // Dashboard page
    averagePositionShort: 'AVG POSITION',
    
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
    
    // Keywords page (Detailed)
    trackedKeywords: 'Keywords Trackeadas',
    sinceLastMonth: 'since last month',
    averageVisibility: 'Visibilidad Promedio',
    thisMonth: 'this month',
    top3Positions: 'Top 3 Positions',
    ofYourKeywords: 'of your keywords',
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
  },
} as const

export function getTranslations(lang: Language = 'es') {
  return translations[lang] || translations.es
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'es'
  try {
    const lang = localStorage.getItem('language') as Language
    return lang === 'en' || lang === 'es' ? lang : 'es'
  } catch {
    return 'es'
  }
}

export function setLanguage(lang: Language) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('language', lang)
    // Update HTML lang attribute
    document.documentElement.lang = lang
    // Trigger a custom event to notify components
    window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }))
  } catch {
    // ignore
  }
}

// Hook para usar traducciones en componentes
export function useTranslations() {
  const [lang, setLangState] = useState<Language>('es')
  const [t, setT] = useState(() => getTranslations('es'))

  useEffect(() => {
    const updateLang = () => {
      const currentLang = getLanguage()
      setLangState(currentLang)
      setT(getTranslations(currentLang))
    }

    updateLang()

    // Listen for language changes
    const handleLanguageChange = () => updateLang()
    window.addEventListener('languagechange', handleLanguageChange)

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange)
    }
  }, [])

  return { t, lang, setLanguage: (newLang: Language) => {
    setLanguage(newLang)
    setLangState(newLang)
    setT(getTranslations(newLang))
  }}
}

export type { Language }

