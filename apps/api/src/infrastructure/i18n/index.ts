export type Language = 'en' | 'es';

let currentLang: Language = 'es'; // Default

export function setLanguage(lang: Language) {
    currentLang = lang;
}

export function getLanguage(): Language {
    return currentLang;
}

const dictionary: Record<string, Record<Language, string>> = {
    // MENUS
    'menu.main.title': {
        es: '🌱 MENTHA CLI - INTELIGENCIA AEO/GEO (V3.0 Enterprise)',
        en: '🌱 MENTHA CLI - AEO/GEO INTELLIGENCE (V3.0 Enterprise)'
    },
    'menu.main.select': {
        es: 'Selecciona una opción:',
        en: 'Select an option:'
    },
    'menu.option.create_project': {
        es: 'Crear nuevo proyecto',
        en: 'Create new project'
    },
    'menu.option.select_project': {
        es: 'Seleccionar proyecto activo',
        en: 'Select active project'
    },
    'menu.option.add_keyword': {
        es: 'Añadir keyword',
        en: 'Add keyword'
    },
    'menu.option.scan': {
        es: 'Ejecutar Scan (Real-time)',
        en: 'Run Scan (Real-time)'
    },
    'menu.option.view_results': {
        es: 'Ver últimos resultados',
        en: 'View latest results'
    },
    'menu.option.manage_entities': {
        es: 'Gestionar Entidades (Knowledge Graph)',
        en: 'Manage Entities (Knowledge Graph)'
    },
    'menu.option.exit': {
        es: 'Salir',
        en: 'Exit'
    },
    'menu.section.monitoring': {
        es: '🚀 DASHBOARD & MONITORING    (Keywords, Scan, Resultados)',
        en: '🚀 DASHBOARD & MONITORING    (Keywords, Scan, Results)'
    },
    'menu.section.kg': {
        es: '🧠 KNOWLEDGE GRAPH (AEO)     (Entidades, Claims, JSON-LD)',
        en: '🧠 KNOWLEDGE GRAPH (AEO)     (Entities, Claims, JSON-LD)'
    },
    'menu.section.eeat': {
        es: '⭐ AUTORIDAD (E-E-A-T)       (Autores, Clusters, Reviews)',
        en: '⭐ AUTHORITY (E-E-A-T)       (Authors, Clusters, Reviews)'
    },
    'menu.section.settings': {
        es: '⚙️ CONFIGURACIÓN             (Proyecto, Motor, Idioma)',
        en: '⚙️ SETTINGS                  (Project, Engine, Language)'
    },

    // MONITORING SUBMENU
    'menu.monitoring.title': { es: '🚀 DASHBOARD & MONITORING:', en: '🚀 DASHBOARD & MONITORING:' },
    'menu.monitoring.view_keywords': { es: '👁️  Ver Keywords', en: '👁️  View Keywords' },
    'menu.monitoring.add_keyword': { es: '➕  Añadir Nueva Keyword', en: '➕  Add New Keyword' },
    'menu.monitoring.run_scan': { es: '🔎  EJECUTAR SCAN (Tiempo Real)', en: '🔎  RUN SCAN NOW (Real-time)' },
    'menu.monitoring.view_results': { es: '📊  Ver Últimos Resultados', en: '📊  View Latest Results' },

    // KG SUBMENU
    'menu.kg.title': { es: '🧠 KNOWLEDGE GRAPH (Optimización AEO):', en: '🧠 KNOWLEDGE GRAPH (AEO Optimization):' },
    'menu.kg.entities': { es: '🏢  Gestionar Entidades (Identidad)', en: '🏢  Manage Entities (Identity)' },
    'menu.kg.claims': { es: '🗣️  Añadir Claims/Hechos', en: '🗣️  Add Claims/Facts' },
    'menu.kg.faqs': { es: '❓  Añadir FAQs', en: '❓  Add FAQs' },
    'menu.kg.llmstxt': { es: '📄  Generar llms.txt', en: '📄  Generate llms.txt' },

    // EEAT SUBMENU
    'menu.eeat.title': { es: '⭐ E-E-A-T (Autoridad y Confianza):', en: '⭐ E-E-A-T (Authority & Trust):' },
    'menu.eeat.authors': { es: '👤  Gestionar Autores/Expertos', en: '👤  Manage Authors/Experts' },
    'menu.eeat.clusters': { es: '📚  Clusters de Contenido (Autoridad Tópica)', en: '📚  Content Clusters (Topical Authority)' },
    'menu.eeat.reviews': { es: '⭐  Añadir Ratings/Reviews', en: '⭐  Add Ratings/Reviews' },

    // SETTINGS SUBMENU
    'menu.settings.title': { es: '⚙️ CONFIGURACIÓN:', en: '⚙️ SETTINGS:' },
    'menu.settings.select_project': { es: '📂  Seleccionar/Cambiar Proyecto Activo', en: '📂  Select/Switch Active Project' },
    'menu.settings.create_project': { es: '➕  Crear Nuevo Proyecto', en: '➕  Create New Project' },
    'menu.settings.change_engine': { es: '🤖  Cambiar Motor IA (Defecto: OpenAI)', en: '🤖  Change AI Engine (Default: OpenAI)' },
    'menu.settings.delete_project': { es: '🗑️  Borrar Proyecto (Zona de Peligro)', en: '🗑️  Delete Project (Danger Zone)' },

    // COMMON
    'menu.back': { es: '0. 🔙  Volver al Menú Principal', en: '0. 🔙  Back to Main Menu' },

    // PROMPTS
    'prompt.select_language': {
        es: 'Selecciona Idioma / Select Language [es/en] (default: es): ',
        en: 'Select Language / Selecciona Idioma [es/en] (default: es): '
    },
    'prompt.enter_to_continue': {
        es: 'Presiona Enter para continuar...',
        en: 'Press Enter to continue...'
    },

    // MESSAGES
    'msg.project_created': {
        es: '✅ Proyecto creado:',
        en: '✅ Project created:'
    },
    'msg.no_keywords': {
        es: '\n❌ No hay keywords',
        en: '\n❌ No keywords found'
    },
    'msg.scan_complete': {
        es: '💾 Resultado guardado con análisis completo',
        en: '💾 Result saved with full analysis'
    },
    'msg.qa_hallucination': {
        es: '🚨 ALUCINACIÓN DETECTADA: La IA podría estar inventando productos/hechos.',
        en: '🚨 HALLUCINATION DETECTED: AI might be inventing products/facts.'
    },
    'msg.qa_ok': {
        es: '✅ Veracidad: OK',
        en: '✅ Veracity: OK'
    }
};

export function t(key: string, params?: Record<string, string>): string {
    const entry = dictionary[key];
    if (!entry) return key;

    let text = entry[currentLang];

    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }

    return text;
}
