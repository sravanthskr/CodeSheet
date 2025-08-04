import { create } from 'zustand';

interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    
    const html = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  },
  
  initializeTheme: () => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    const theme = stored || 'system';
    get().setTheme(theme);
  }
}));
