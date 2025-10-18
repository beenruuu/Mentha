// Mock data para análisis AEO
export const mockAnalysisResult = {
  score: 85,
  strengths: [
    'Contenido bien estructurado con encabezados claros',
    'Uso efectivo de palabras clave relevantes',
    'Información actualizada y precisa',
    'Buena densidad de keywords sin sobre-optimización',
    'Lenguaje natural que facilita la comprensión por IA'
  ],
  weaknesses: [
    'Falta de datos estructurados (Schema.org)',
    'Ausencia de preguntas frecuentes (FAQ)',
    'Contenido podría ser más conciso',
    'Falta de ejemplos específicos y casos de uso',
    'Pocas referencias a fuentes autoritativas'
  ],
  recommendations: [
    {
      title: 'Implementar Schema.org',
      description: 'Agrega datos estructurados para mejorar la comprensión de la IA',
      priority: 'high',
      category: 'technical',
      effort: 'medium',
      impact: 'high'
    },
    {
      title: 'Crear sección de FAQ',
      description: 'Las IAs favorecen contenido en formato pregunta-respuesta',
      priority: 'high',
      category: 'content',
      effort: 'low',
      impact: 'high'
    },
    {
      title: 'Optimizar longitud de contenido',
      description: 'Reduce párrafos largos y mejora la escanabilidad',
      priority: 'medium',
      category: 'content',
      effort: 'low',
      impact: 'medium'
    },
    {
      title: 'Agregar ejemplos prácticos',
      description: 'Incluye casos de uso reales y ejemplos específicos',
      priority: 'medium',
      category: 'content',
      effort: 'medium',
      impact: 'high'
    },
    {
      title: 'Incluir citas y referencias',
      description: 'Enlaces a fuentes autorizadas mejoran la credibilidad',
      priority: 'low',
      category: 'content',
      effort: 'low',
      impact: 'medium'
    }
  ],
  keywords: [
    'optimización de motores IA',
    'visibilidad ChatGPT',
    'SEO para Claude',
    'contenido para Perplexity',
    'marketing AI-first',
    'generative engine optimization',
    'búsqueda conversacional',
    'AI content strategy'
  ]
}

export const mockKeywordData = [
  {
    id: 1,
    keyword: 'AI optimization tools',
    volume: 12500,
    difficulty: 68,
    aiVisibility: 85,
    position: 3,
    trend: 'up',
    change: '+12%',
    mentions: {
      chatgpt: true,
      claude: true,
      perplexity: false,
      gemini: true,
    },
  },
  {
    id: 2,
    keyword: 'SEO for AI search',
    volume: 8900,
    difficulty: 72,
    aiVisibility: 78,
    position: 5,
    trend: 'up',
    change: '+8%',
    mentions: {
      chatgpt: true,
      claude: false,
      perplexity: true,
      gemini: true,
    },
  },
  {
    id: 3,
    keyword: 'generative engine optimization',
    volume: 4200,
    difficulty: 45,
    aiVisibility: 92,
    position: 1,
    trend: 'stable',
    change: '0%',
    mentions: {
      chatgpt: true,
      claude: true,
      perplexity: true,
      gemini: true,
    },
  },
  {
    id: 4,
    keyword: 'ChatGPT visibility',
    volume: 6700,
    difficulty: 55,
    aiVisibility: 81,
    position: 4,
    trend: 'up',
    change: '+15%',
    mentions: {
      chatgpt: true,
      claude: true,
      perplexity: false,
      gemini: false,
    },
  },
  {
    id: 5,
    keyword: 'AI content strategy',
    volume: 9300,
    difficulty: 62,
    aiVisibility: 76,
    position: 6,
    trend: 'down',
    change: '-3%',
    mentions: {
      chatgpt: true,
      claude: true,
      perplexity: true,
      gemini: true,
    },
  },
]

export const mockCompetitorData = [
  {
    id: 1,
    name: 'Semrush',
    domain: 'semrush.com',
    visibilityScore: 94,
    mentions: 142,
    avgPosition: 2.1,
    trend: 'up',
    change: '+8%',
    strengths: ['Content Quality', 'Technical SEO', 'Backlinks', 'Brand Authority'],
  },
  {
    id: 2,
    name: 'Ahrefs',
    domain: 'ahrefs.com',
    visibilityScore: 91,
    mentions: 138,
    avgPosition: 2.5,
    trend: 'up',
    change: '+5%',
    strengths: ['Link Analysis', 'Keyword Research', 'Site Audit', 'Rank Tracking'],
  },
  {
    id: 3,
    name: 'Moz',
    domain: 'moz.com',
    visibilityScore: 87,
    mentions: 115,
    avgPosition: 3.2,
    trend: 'stable',
    change: '0%',
    strengths: ['Local SEO', 'Domain Authority', 'Community', 'Education'],
  },
  {
    id: 4,
    name: 'BrightEdge',
    domain: 'brightedge.com',
    visibilityScore: 78,
    mentions: 89,
    avgPosition: 4.1,
    trend: 'down',
    change: '-3%',
    strengths: ['Enterprise Features', 'Data Studio', 'Recommendations', 'Integration'],
  },
]

export const mockBrandData = [
  {
    id: 'demo-brand-1',
    name: 'Mi Marca Demo',
    domain: 'ejemplo.com',
    visibilityScore: 78,
    avgPosition: 3.5,
    totalMentions: 45,
    lastAnalysis: new Date().toISOString(),
  }
]

export const mockAnalysisHistory = [
  {
    id: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
    analysis_type: 'content',
    score: 85,
    status: 'completed',
    ai_model: 'chatgpt',
    input_data: {
      domain: 'ejemplo.com',
      content: 'Análisis de contenido de ejemplo...'
    }
  },
  {
    id: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 día atrás
    analysis_type: 'domain',
    score: 72,
    status: 'completed',
    ai_model: 'claude',
    input_data: {
      domain: 'ejemplo.com'
    }
  },
  {
    id: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 días atrás
    analysis_type: 'keyword',
    score: 91,
    status: 'completed',
    ai_model: 'chatgpt',
    input_data: {
      domain: 'ejemplo.com',
      keywords: ['AI optimization', 'SEO']
    }
  },
]

export const mockUserData = {
  id: 'demo-user-123',
  email: 'demo@mentha.com',
  full_name: 'Usuario Demo',
  subscription: {
    plan_name: 'pro',
    status: 'active',
    current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  }
}
