function createThemeService() {
    let isDark = $state(false);

    function applyTheme(dark: boolean) {
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    function init() {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDark = stored === 'dark' || (stored === null && prefersDark);
        applyTheme(isDark);
    }

    function toggle() {
        isDark = !isDark;
        applyTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    return {
        get isDark() {
            return isDark;
        },
        init,
        toggle
    };
}

export const themeService = createThemeService();
