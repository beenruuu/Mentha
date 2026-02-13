#!/usr/bin/env python3
"""
Mentha Setup Script
===================
Automated development environment configuration.

This script prompts for required environment variables and generates
.env files for backend and frontend services.
"""

import os
import sys
from pathlib import Path

# Terminal colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


# Internationalization strings
TRANSLATIONS = {
    'en': {
        'select_language': 'Select language / Selecciona idioma',
        'language_options': '  1. English\n  2. Español',
        'language_prompt': 'Enter choice (1 or 2)',
        'invalid_choice': 'Invalid choice. Using English.',
        'banner_subtitle': 'Environment Configuration',
        'project_dir': '📁 Project directory',
        'section_general': '1. General Configuration',
        'environment': 'Environment',
        'app_url': 'Application URL',
        'api_url': 'API URL',
        'section_supabase': '2. Supabase (Required)',
        'supabase_url': 'Supabase URL',
        'supabase_anon': 'Supabase Anon Key',
        'supabase_service': 'Supabase Service Role Key',
        'section_ai': '3. AI Providers',
        'ai_note': 'At least one is required for brand analysis.',
        'openai_key': 'OpenAI API Key',
        'anthropic_key': 'Anthropic API Key',
        'google_key': 'Google API Key (Gemini)',
        'perplexity_key': 'Perplexity API Key',
        'openrouter_key': 'OpenRouter API Key (alternative)',
        'no_ai_warning': '⚠ No AI provider configured. Brand analysis requires at least one.',
        'configure_stripe': 'Configure Stripe for payments?',
        'section_stripe': '4. Stripe (Optional)',
        'stripe_pub': 'Stripe Publishable Key',
        'stripe_secret': 'Stripe Secret Key',
        'stripe_webhook': 'Stripe Webhook Secret',
        'configure_qdrant': 'Configure Qdrant for embeddings?',
        'section_qdrant': '5. Qdrant Vector DB (Optional)',
        'qdrant_url': 'Qdrant URL',
        'qdrant_key': 'Qdrant API Key',
        'qdrant_collection': 'Qdrant Collection',
        'section_scheduler': '6. Daily Automatic Tracking',
        'analysis_hour': 'Execution hour (00-23)',
        'analysis_minute': 'Execution minute (00-59)',
        'generating_files': 'Generating configuration files...',
        'configuring_backend': '📦 Configuring Backend...',
        'configuring_frontend': '🎨 Configuring Frontend...',
        'created': 'Created',
        'found': 'Found',
        'not_found': 'Not found',
        'field_required': 'This field is required.',
        'success_title': '✅ Configuration completed successfully',
        'next_steps': 'Next steps:',
        'step_install': 'Install dependencies:',
        'step_backend': '# Backend',
        'step_frontend': '# Frontend',
        'step_database': 'Configure database:',
        'step_db_detail': '- Run schema in Supabase: supabase/schema.sql',
        'step_db_migrations': '- Run necessary migrations',
        'step_start': 'Start the application:',
        'ready_message': 'Ready to audit your brand presence in AIs! 🌿',
        'cancelled': 'Configuration cancelled.',
        'yes_no_yes': 'Y/n',
        'yes_no_no': 'y/N',
    },
    'es': {
        'select_language': 'Select language / Selecciona idioma',
        'language_options': '  1. English\n  2. Español',
        'language_prompt': 'Ingresa opción (1 o 2)',
        'invalid_choice': 'Opción inválida. Usando español.',
        'banner_subtitle': 'Configuración del Entorno',
        'project_dir': '📁 Directorio del proyecto',
        'section_general': '1. Configuración General',
        'environment': 'Entorno',
        'app_url': 'URL de la aplicación',
        'api_url': 'URL del API',
        'section_supabase': '2. Supabase (Requerido)',
        'supabase_url': 'Supabase URL',
        'supabase_anon': 'Supabase Anon Key',
        'supabase_service': 'Supabase Service Role Key',
        'section_ai': '3. Proveedores de IA',
        'ai_note': 'Al menos uno es requerido para el análisis de marcas.',
        'openai_key': 'OpenAI API Key',
        'anthropic_key': 'Anthropic API Key',
        'google_key': 'Google API Key (Gemini)',
        'perplexity_key': 'Perplexity API Key',
        'openrouter_key': 'OpenRouter API Key (alternativa)',
        'no_ai_warning': '⚠ Ningún proveedor de IA configurado. El análisis requiere al menos uno.',
        'configure_stripe': '¿Configurar Stripe para pagos?',
        'section_stripe': '4. Stripe (Opcional)',
        'stripe_pub': 'Stripe Publishable Key',
        'stripe_secret': 'Stripe Secret Key',
        'stripe_webhook': 'Stripe Webhook Secret',
        'configure_qdrant': '¿Configurar Qdrant para embeddings?',
        'section_qdrant': '5. Qdrant Vector DB (Opcional)',
        'qdrant_url': 'Qdrant URL',
        'qdrant_key': 'Qdrant API Key',
        'qdrant_collection': 'Qdrant Collection',
        'section_scheduler': '6. Rastreo Automático Diario',
        'analysis_hour': 'Hora de ejecución (00-23)',
        'analysis_minute': 'Minuto de ejecución (00-59)',
        'generating_files': 'Generando archivos de configuración...',
        'configuring_backend': '📦 Configurando Backend...',
        'configuring_frontend': '🎨 Configurando Frontend...',
        'created': 'Creado',
        'found': 'Encontrado',
        'not_found': 'No encontrado',
        'field_required': 'Este campo es requerido.',
        'success_title': '✅ Configuración completada exitosamente',
        'next_steps': 'Próximos pasos:',
        'step_install': 'Instalar dependencias:',
        'step_backend': '# Backend',
        'step_frontend': '# Frontend',
        'step_database': 'Configurar base de datos:',
        'step_db_detail': '- Ejecuta el schema en Supabase: supabase/schema.sql',
        'step_db_migrations': '- Ejecuta las migraciones necesarias',
        'step_start': 'Iniciar la aplicación:',
        'ready_message': '¡Listo para auditar la presencia de tu marca en IAs! 🌿',
        'cancelled': 'Configuración cancelada.',
        'yes_no_yes': 'S/n',
        'yes_no_no': 's/N',
    }
}

# Current language (set after selection)
current_lang = 'en'


def t(key: str) -> str:
    """Get translated string for current language."""
    return TRANSLATIONS.get(current_lang, TRANSLATIONS['en']).get(key, key)


def select_language() -> str:
    """Prompt user to select language at startup."""
    print(f"\n{Colors.CYAN}{TRANSLATIONS['en']['select_language']}{Colors.ENDC}")
    print(TRANSLATIONS['en']['language_options'])
    choice = input(f"{Colors.CYAN}{TRANSLATIONS['en']['language_prompt']}: {Colors.ENDC}").strip()
    
    if choice == '1':
        return 'en'
    elif choice == '2':
        return 'es'
    else:
        print(f"{Colors.WARNING}{TRANSLATIONS['en']['invalid_choice']}{Colors.ENDC}")
        return 'en'


def print_header():
    """Print Mentha banner."""
    print(f"""
{Colors.GREEN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🌿 MENTHA - AI Brand Presence Platform                    ║
║                                                              ║
║   {t('banner_subtitle'):<52} ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}
""")

def get_input(prompt: str, default: str = "", required: bool = True, is_secret: bool = False) -> str:
    """Prompt user for input with optional default value."""
    default_text = f" [{default}]" if default else ""
    full_prompt = f"{Colors.CYAN}{prompt}{default_text}: {Colors.ENDC}"
    
    if is_secret:
        import getpass
        value = getpass.getpass(full_prompt)
    else:
        value = input(full_prompt)
    
    if not value and default:
        return default
    
    if required and not value:
        print(f"{Colors.FAIL}{t('field_required')}{Colors.ENDC}")
        return get_input(prompt, default, required, is_secret)
    
    return value


def get_yes_no(prompt: str, default: bool = True) -> bool:
    """Prompt for yes/no confirmation."""
    default_text = t('yes_no_yes') if default else t('yes_no_no')
    full_prompt = f"{Colors.CYAN}{prompt} [{default_text}]: {Colors.ENDC}"
    value = input(full_prompt).strip().lower()
    
    if not value:
        return default
    return value in ('s', 'si', 'sí', 'y', 'yes', '1', 'true')

def generate_backend_env(config: dict) -> str:
    """Generate backend .env file content."""
    return f"""# Mentha Backend Environment Configuration
# Generated by setup.py

# ===================
# Environment
# ===================
ENVIRONMENT={config.get('environment', 'development')}

# ===================
# Supabase Configuration
# ===================
SUPABASE_URL={config.get('supabase_url', '')}
SUPABASE_SERVICE_KEY={config.get('supabase_service_key', '')}
SUPABASE_ANON_KEY={config.get('supabase_anon_key', '')}

# ===================
# AI Provider API Keys
# ===================
OPENAI_API_KEY={config.get('openai_api_key', '')}
ANTHROPIC_API_KEY={config.get('anthropic_api_key', '')}
GOOGLE_API_KEY={config.get('google_api_key', '')}
PERPLEXITY_API_KEY={config.get('perplexity_api_key', '')}
OPENROUTER_API_KEY={config.get('openrouter_api_key', '')}

# ===================
# Vector Database (Optional)
# ===================
QDRANT_URL={config.get('qdrant_url', '')}
QDRANT_API_KEY={config.get('qdrant_api_key', '')}
QDRANT_COLLECTION_NAME={config.get('qdrant_collection', 'mentha_embeddings')}

# ===================
# CORS Configuration
# ===================
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ===================
# Scheduler Configuration
# ===================
DAILY_ANALYSIS_HOUR={config.get('analysis_hour', '03')}
DAILY_ANALYSIS_MINUTE={config.get('analysis_minute', '00')}
"""

def generate_frontend_env(config: dict) -> str:
    """Generate frontend .env.local file content."""
    return f"""# Mentha Frontend Environment Configuration
# Generated by setup.py

# ===================
# Public Configuration
# ===================
NEXT_PUBLIC_APP_URL={config.get('app_url', 'http://localhost:3000')}
NEXT_PUBLIC_API_URL={config.get('api_url', 'http://localhost:8000')}

# ===================
# Supabase
# ===================
NEXT_PUBLIC_SUPABASE_URL={config.get('supabase_url', '')}
NEXT_PUBLIC_SUPABASE_ANON_KEY={config.get('supabase_anon_key', '')}
SUPABASE_SERVICE_ROLE_KEY={config.get('supabase_service_key', '')}

# ===================
# Stripe (Optional)
# ===================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY={config.get('stripe_publishable_key', '')}
STRIPE_SECRET_KEY={config.get('stripe_secret_key', '')}
STRIPE_WEBHOOK_SECRET={config.get('stripe_webhook_secret', '')}

# ===================
# Feature Flags
# ===================
NEXT_PUBLIC_DEMO_MODE_ENABLED=true
"""

def setup_backend(root_path: Path, config: dict):
    """Configure backend environment."""
    print(f"\n{Colors.BLUE}{t('configuring_backend')}{Colors.ENDC}")
    
    backend_path = root_path / "backend"
    env_path = backend_path / ".env"
    
    # Generate .env file
    env_content = generate_backend_env(config)
    env_path.write_text(env_content)
    print(f"  {Colors.GREEN}✓{Colors.ENDC} {t('created')}: {env_path}")
    
    # Check if requirements.txt exists
    requirements_path = backend_path / "requirements.txt"
    if requirements_path.exists():
        print(f"  {Colors.GREEN}✓{Colors.ENDC} {t('found')}: requirements.txt")
    else:
        print(f"  {Colors.WARNING}⚠{Colors.ENDC} {t('not_found')}: requirements.txt")


def setup_frontend(root_path: Path, config: dict):
    """Configure frontend environment."""
    print(f"\n{Colors.BLUE}{t('configuring_frontend')}{Colors.ENDC}")
    
    frontend_path = root_path / "frontend"
    env_path = frontend_path / ".env.local"
    
    # Generate .env.local file
    env_content = generate_frontend_env(config)
    env_path.write_text(env_content)
    print(f"  {Colors.GREEN}✓{Colors.ENDC} {t('created')}: {env_path}")

def main():
    """Main entry point."""
    global current_lang
    
    # Language selection at startup
    current_lang = select_language()
    
    print_header()
    
    # Determine root directory
    root_path = Path(__file__).parent.resolve()
    print(f"{Colors.BLUE}{t('project_dir')}: {root_path}{Colors.ENDC}\n")
    
    config = {}
    
    # === General Configuration ===
    print(f"{Colors.BOLD}{t('section_general')}{Colors.ENDC}")
    print("-" * 40)
    config['environment'] = get_input(t('environment'), "development", required=False)
    config['app_url'] = get_input(t('app_url'), "http://localhost:3000")
    config['api_url'] = get_input(t('api_url'), "http://localhost:8000")
    
    # === Supabase ===
    print(f"\n{Colors.BOLD}{t('section_supabase')}{Colors.ENDC}")
    print("-" * 40)
    config['supabase_url'] = get_input(t('supabase_url'))
    config['supabase_anon_key'] = get_input(t('supabase_anon'), is_secret=True)
    config['supabase_service_key'] = get_input(t('supabase_service'), is_secret=True)
    
    # === AI Providers ===
    print(f"\n{Colors.BOLD}{t('section_ai')}{Colors.ENDC}")
    print("-" * 40)
    print(f"{Colors.WARNING}{t('ai_note')}{Colors.ENDC}\n")
    
    config['openai_api_key'] = get_input(t('openai_key'), required=False, is_secret=True)
    config['anthropic_api_key'] = get_input(t('anthropic_key'), required=False, is_secret=True)
    config['google_api_key'] = get_input(t('google_key'), required=False, is_secret=True)
    config['perplexity_api_key'] = get_input(t('perplexity_key'), required=False, is_secret=True)
    config['openrouter_api_key'] = get_input(t('openrouter_key'), required=False, is_secret=True)
    
    # Verify at least one AI provider is configured
    ai_keys = [config.get(k) for k in ['openai_api_key', 'anthropic_api_key', 'google_api_key', 'perplexity_api_key', 'openrouter_api_key']]
    if not any(ai_keys):
        print(f"\n{Colors.WARNING}{t('no_ai_warning')}{Colors.ENDC}")
    
    # === Stripe (optional) ===
    if get_yes_no(f"\n{t('configure_stripe')}", default=False):
        print(f"\n{Colors.BOLD}{t('section_stripe')}{Colors.ENDC}")
        print("-" * 40)
        config['stripe_publishable_key'] = get_input(t('stripe_pub'), required=False)
        config['stripe_secret_key'] = get_input(t('stripe_secret'), required=False, is_secret=True)
        config['stripe_webhook_secret'] = get_input(t('stripe_webhook'), required=False, is_secret=True)
    
    # === Qdrant (optional) ===
    if get_yes_no(f"\n{t('configure_qdrant')}", default=False):
        print(f"\n{Colors.BOLD}{t('section_qdrant')}{Colors.ENDC}")
        print("-" * 40)
        config['qdrant_url'] = get_input(t('qdrant_url'), required=False)
        config['qdrant_api_key'] = get_input(t('qdrant_key'), required=False, is_secret=True)
        config['qdrant_collection'] = get_input(t('qdrant_collection'), "mentha_embeddings", required=False)
    
    # === Scheduler ===
    print(f"\n{Colors.BOLD}{t('section_scheduler')}{Colors.ENDC}")
    print("-" * 40)
    config['analysis_hour'] = get_input(t('analysis_hour'), "03", required=False)
    config['analysis_minute'] = get_input(t('analysis_minute'), "00", required=False)
    
    # === Generate files ===
    print(f"\n{Colors.BOLD}{t('generating_files')}{Colors.ENDC}")
    print("=" * 50)
    
    setup_backend(root_path, config)
    setup_frontend(root_path, config)
    
    # === Final summary ===
    print(f"""
{Colors.GREEN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║  {t('success_title'):<56} ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}

{Colors.BOLD}{t('next_steps')}{Colors.ENDC}

1. {t('step_install')}
   {Colors.CYAN}{t('step_backend')}{Colors.ENDC}
   cd backend && python -m venv venv && .\\venv\\Scripts\\activate && pip install -r requirements.txt

   {Colors.CYAN}{t('step_frontend')}{Colors.ENDC}
   cd frontend && pnpm install

2. {t('step_database')}
   {t('step_db_detail')}
   {t('step_db_migrations')}

3. {t('step_start')}
   {Colors.CYAN}python start.py{Colors.ENDC}

{Colors.GREEN}{t('ready_message')}{Colors.ENDC}
""")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}{t('cancelled')}{Colors.ENDC}")
        sys.exit(1)
