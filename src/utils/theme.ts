import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export const THEME_KEY = 'tp_flame_theme_v1';
const THEME_EVENT = 'tp-flame-theme';
// Mesmas cores do fundo do app em cada tema (barra do navegador/PWA).
const THEME_COLOR: Record<Theme, string> = { dark: '#080808', light: '#f4f4f5' };

/** Padrão é escuro; qualquer valor estranho ou storage indisponível cai nele. */
export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // sem storage (janela privada): o tema vale só até recarregar
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Tema atual + função de trocar; todos os componentes que usam ficam em sincronia. */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, set] = useState<Theme>(() => readTheme());
  useEffect(() => {
    const sync = () => set(readTheme());
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener('storage', sync); // outra aba mudou
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
