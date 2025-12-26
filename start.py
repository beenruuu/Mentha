#!/usr/bin/env python3
"""
Mentha Start Script
===================
Unified backend and frontend startup.

Runs both services with a single command and manages
automatic daily brand tracking.
"""

import os
import sys
import signal
import subprocess
import threading
import time
from pathlib import Path
from datetime import datetime
import schedule

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
        'banner_subtitle': 'Audit • Optimization • Control • Measurement',
        'starting_services': 'Starting services...',
        'missing_config': '❌ Missing configuration files:',
        'run_setup_first': 'Run first: python setup.py',
        'venv_not_found': '⚠ Virtual environment not found in backend.',
        'using_system_python': '  Using system Python:',
        'starting_backend': '🚀 Starting Backend (FastAPI) on port 8000...',
        'starting_frontend': '🎨 Starting Frontend (Next.js) on port 3000...',
        'running_daily_analysis': '📊 Running automatic daily analysis...',
        'time': 'Time',
        'analysis_completed': '✓ Daily analysis completed',
        'analysis_warnings': '⚠ Analysis finished with warnings:',
        'analysis_error': '❌ Daily analysis error:',
        'scheduler_configured': '⏰ Automatic tracking scheduled for',
        'daily': 'daily',
        'stopping_services': '🛑 Stopping services...',
        'services_stopped': '✓ Services stopped correctly',
        'config_verified': '✓ Configuration verified',
        'mentha_running': '✅ Mentha is running',
        'frontend_label': 'Frontend:',
        'backend_label': 'Backend:',
        'api_docs_label': 'API Docs:',
        'press_ctrl_c': 'Press Ctrl+C to stop services.',
        'process_terminated': '⚠ A process terminated unexpectedly',
    },
    'es': {
        'select_language': 'Select language / Selecciona idioma',
        'language_options': '  1. English\n  2. Español',
        'language_prompt': 'Ingresa opción (1 o 2)',
        'invalid_choice': 'Opción inválida. Usando español.',
        'banner_subtitle': 'Auditoría • Optimización • Control • Medición',
        'starting_services': 'Iniciando servicios...',
        'missing_config': '❌ Archivos de configuración faltantes:',
        'run_setup_first': 'Ejecuta primero: python setup.py',
        'venv_not_found': '⚠ No se encontró entorno virtual en backend.',
        'using_system_python': '  Usando Python del sistema:',
        'starting_backend': '🚀 Iniciando Backend (FastAPI) en puerto 8000...',
        'starting_frontend': '🎨 Iniciando Frontend (Next.js) en puerto 3000...',
        'running_daily_analysis': '📊 Ejecutando análisis diario automático...',
        'time': 'Hora',
        'analysis_completed': '✓ Análisis diario completado',
        'analysis_warnings': '⚠ Análisis finalizó con advertencias:',
        'analysis_error': '❌ Error en análisis diario:',
        'scheduler_configured': '⏰ Rastreo automático programado para las',
        'daily': 'diariamente',
        'stopping_services': '🛑 Deteniendo servicios...',
        'services_stopped': '✓ Servicios detenidos correctamente',
        'config_verified': '✓ Configuración verificada',
        'mentha_running': '✅ Mentha está corriendo',
        'frontend_label': 'Frontend:',
        'backend_label': 'Backend:',
        'api_docs_label': 'API Docs:',
        'press_ctrl_c': 'Presiona Ctrl+C para detener los servicios.',
        'process_terminated': '⚠ Un proceso terminó inesperadamente',
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


# Global processes for signal handling
processes = []
scheduler_running = True

def print_banner():
    """Print Mentha banner."""
    print(f"""
{Colors.GREEN}{Colors.BOLD}
    🌿 MENTHA - AI Brand Presence Platform
    ═══════════════════════════════════════
{Colors.ENDC}
    {t('banner_subtitle')}
    
    {Colors.CYAN}{t('starting_services')}{Colors.ENDC}
""")

def check_env_files(root_path: Path) -> bool:
    """Check that configuration files exist."""
    backend_env = root_path / "backend" / ".env"
    frontend_env = root_path / "frontend" / ".env.local"
    
    missing = []
    if not backend_env.exists():
        missing.append("backend/.env")
    if not frontend_env.exists():
        missing.append("frontend/.env.local")
    
    if missing:
        print(f"{Colors.FAIL}{t('missing_config')}{Colors.ENDC}")
        for f in missing:
            print(f"   - {f}")
        print(f"\n{Colors.WARNING}{t('run_setup_first')}{Colors.ENDC}")
        return False
    
    return True

def start_backend(root_path: Path):
    """Start the backend server."""
    backend_path = root_path / "backend"
    
    # Detect virtual environment
    if sys.platform == "win32":
        python_path = backend_path / "venv" / "Scripts" / "python.exe"
        if not python_path.exists():
            python_path = backend_path / "venv312" / "Scripts" / "python.exe"
    else:
        python_path = backend_path / "venv" / "bin" / "python"
        if not python_path.exists():
            python_path = backend_path / "venv312" / "bin" / "python"
    
    if not python_path.exists():
        print(f"{Colors.WARNING}{t('venv_not_found')}{Colors.ENDC}")
        print(f"{t('using_system_python')} {sys.executable}")
        python_path = sys.executable
    
    cmd = [
        str(python_path), "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ]
    
    print(f"{Colors.BLUE}{t('starting_backend')}{Colors.ENDC}")
    
    process = subprocess.Popen(
        cmd,
        cwd=str(backend_path),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(process)
    
    # Thread to read backend output
    def read_output():
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"{Colors.CYAN}[Backend]{Colors.ENDC} {line.rstrip()}")
    
    thread = threading.Thread(target=read_output, daemon=True)
    thread.start()
    
    return process

def start_frontend(root_path: Path):
    """Start the frontend server."""
    frontend_path = root_path / "frontend"
    
    # Detect package manager
    if (frontend_path / "pnpm-lock.yaml").exists():
        npm_cmd = "pnpm"
    elif (frontend_path / "yarn.lock").exists():
        npm_cmd = "yarn"
    else:
        npm_cmd = "npm"
    
    if sys.platform == "win32":
        cmd = [npm_cmd, "run", "dev"]
        shell = True
    else:
        cmd = [npm_cmd, "run", "dev"]
        shell = False
    
    print(f"{Colors.BLUE}{t('starting_frontend')}{Colors.ENDC}")
    
    process = subprocess.Popen(
        cmd,
        cwd=str(frontend_path),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=shell
    )
    processes.append(process)
    
    # Thread to read frontend output
    def read_output():
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"{Colors.GREEN}[Frontend]{Colors.ENDC} {line.rstrip()}")
    
    thread = threading.Thread(target=read_output, daemon=True)
    thread.start()
    
    return process

def run_daily_analysis():
    """Execute daily analysis for all brands."""
    print(f"\n{Colors.BOLD}{t('running_daily_analysis')}{Colors.ENDC}")
    print(f"   {t('time')}: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Call the analysis endpoint
    try:
        import requests
        response = requests.post(
            "http://localhost:8000/api/analysis/daily-audit",
            timeout=300
        )
        if response.status_code == 200:
            print(f"{Colors.GREEN}{t('analysis_completed')}{Colors.ENDC}")
        else:
            print(f"{Colors.WARNING}{t('analysis_warnings')} {response.status_code}{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.FAIL}{t('analysis_error')} {e}{Colors.ENDC}")


def setup_scheduler(root_path: Path):
    """Configure scheduler for daily analysis."""
    # Read configured time from backend .env
    backend_env = root_path / "backend" / ".env"
    hour = "03"
    minute = "00"
    
    if backend_env.exists():
        content = backend_env.read_text()
        for line in content.split('\n'):
            if line.startswith('DAILY_ANALYSIS_HOUR='):
                hour = line.split('=')[1].strip()
            if line.startswith('DAILY_ANALYSIS_MINUTE='):
                minute = line.split('=')[1].strip()
    
    schedule_time = f"{hour.zfill(2)}:{minute.zfill(2)}"
    
    print(f"{Colors.BLUE}{t('scheduler_configured')} {schedule_time} {t('daily')}{Colors.ENDC}")
    
    schedule.every().day.at(schedule_time).do(run_daily_analysis)
    
    def run_scheduler():
        global scheduler_running
        while scheduler_running:
            schedule.run_pending()
            time.sleep(60)
    
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()

def signal_handler(signum, frame):
    """Handle termination signals."""
    global scheduler_running
    print(f"\n\n{Colors.WARNING}{t('stopping_services')}{Colors.ENDC}")
    
    scheduler_running = False
    
    for process in processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            process.kill()
    
    print(f"{Colors.GREEN}{t('services_stopped')}{Colors.ENDC}")
    sys.exit(0)


def main():
    """Main entry point."""
    global current_lang
    
    # Language selection at startup
    current_lang = select_language()
    
    print_banner()
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Determine root directory
    root_path = Path(__file__).parent.resolve()
    
    # Verify configuration
    if not check_env_files(root_path):
        sys.exit(1)
    
    print(f"{Colors.GREEN}{t('config_verified')}{Colors.ENDC}\n")
    
    # Start services
    backend_process = start_backend(root_path)
    time.sleep(3)  # Wait for backend to start
    
    frontend_process = start_frontend(root_path)
    
    # Configure scheduler for daily analysis
    setup_scheduler(root_path)
    
    # Wait for services to be ready
    time.sleep(5)
    
    print(f"""
{Colors.GREEN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║  {t('mentha_running'):<56} ║
╚══════════════════════════════════════════════════════════════╝
{Colors.ENDC}

  {Colors.BOLD}{t('frontend_label')}{Colors.ENDC}  http://localhost:3000
  {Colors.BOLD}{t('backend_label')}{Colors.ENDC}   http://localhost:8000
  {Colors.BOLD}{t('api_docs_label')}{Colors.ENDC}  http://localhost:8000/docs

  {t('press_ctrl_c')}

{Colors.GREEN}═══════════════════════════════════════════════════════════════{Colors.ENDC}
""")
    
    # Keep the script running
    try:
        while True:
            # Check that processes are still alive
            for process in processes:
                if process.poll() is not None:
                    print(f"{Colors.WARNING}{t('process_terminated')}{Colors.ENDC}")
            time.sleep(5)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
