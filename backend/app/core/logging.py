"""
Shared logging utilities with ANSI color codes for terminal output.
Provides consistent colored log output across all backend services.
"""


class Colors:
    """ANSI color codes for terminal output."""
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    GRAY = "\033[90m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def log_info(emoji: str, message: str, color: str = Colors.CYAN) -> None:
    """Log info message with emoji and color."""
    print(f"{color}{emoji} {message}{Colors.RESET}")


def log_success(emoji: str, message: str) -> None:
    """Log success message with emoji and green color."""
    print(f"{Colors.GREEN}{emoji} {message}{Colors.RESET}")


def log_error(emoji: str, message: str) -> None:
    """Log error message with emoji and red color."""
    print(f"{Colors.RED}{emoji} {message}{Colors.RESET}")


def log_warning(emoji: str, message: str) -> None:
    """Log warning message with emoji and yellow color."""
    print(f"{Colors.YELLOW}{emoji} {message}{Colors.RESET}")


def log_phase(phase_num: int, phase_name: str) -> None:
    """Log a phase header."""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}  PHASE {phase_num}: {phase_name}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{'='*60}{Colors.RESET}\n")
