import { describe, it, expect, beforeEach } from 'vitest';
import { readTheme, setTheme, THEME_KEY } from './theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '<meta name="theme-color" content="#080808">';
  });

  it('padrão é escuro', () => {
    expect(readTheme()).toBe('dark');
  });
  it('valor inválido no storage cai no escuro', () => {
    localStorage.setItem(THEME_KEY, 'azul');
    expect(readTheme()).toBe('dark');
  });
  it('setTheme grava, aplica no <html> e troca o theme-color', () => {
    setTheme('light');
    expect(readTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#f4f4f5');
  });
});
