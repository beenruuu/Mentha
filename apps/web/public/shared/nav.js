/**
 * Shared Navigation Logic for Mentha Web App
 */

function initNavigation() {
    const dockButtons = document.querySelectorAll('.dock-btn');

    dockButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (page) {
                // Determine the correct path based on current location
                const currentPath = window.location.pathname;
                let targetPath = '';

                if (page === 'dashboard') targetPath = '/dashboard/';
                else targetPath = `/${page}/`;

                if (currentPath !== targetPath) {
                    window.location.href = targetPath;
                }
            }
        });
    });
}

// Export or just run
document.addEventListener('DOMContentLoaded', initNavigation);
