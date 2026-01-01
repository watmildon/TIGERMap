// Theme Management - Respects system/browser dark mode preference
// Automatically applies Bootstrap's data-bs-theme attribute based on prefers-color-scheme

(function() {
  'use strict';

  function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  function getPreferredTheme() {
    // Check if user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Set initial theme
  setTheme(getPreferredTheme());

  // Listen for changes to system preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    });
  }
})();
