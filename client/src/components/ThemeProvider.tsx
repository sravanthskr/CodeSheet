import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const { theme, setTheme } = useThemeStore.getState();
      if (theme === 'system') {
        setTheme('system'); // This will trigger the theme update
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [initializeTheme]);

  return <>{children}</>;
}
