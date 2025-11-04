"use client"

/**
 * ThemeScript: applies stored theme preference BEFORE React hydration to avoid flash.
 * This runs as a blocking script in the <head> to prevent FOUC (Flash of Unstyled Content).
 * Reads 'theme' from localStorage: 'light' | 'dark' | 'system' (default 'system').
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  try {
    const theme = localStorage.getItem('theme') || 'system';
    const applyTheme = (t) => {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (t === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // system
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    applyTheme(theme);
  } catch (e) {
    // ignore in restricted environments
  }
})();
        `.trim(),
      }}
    />
  )
}


