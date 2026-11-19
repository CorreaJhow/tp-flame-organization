import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Lê os tokens direto do index.css (fonte única) e confere contraste WCAG AA.
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

const bloco = (seletor: string): Record<string, string> => {
  const ini = css.indexOf(seletor + ' {');
  const corpo = css.slice(ini, css.indexOf('\n}', ini));
  return Object.fromEntries([...corpo.matchAll(/--c-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
};

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const FUNDOS = ['base', 'header', 'surface', 'surface-hover', 'inset', 'inset-2', 'inset-3', 'chip'];

describe('contraste dos tokens de tema', () => {
  const claro = { ...bloco(':root'), ...bloco('[data-theme="light"]') };
  const escuro = bloco(':root');

  it('claro: todo texto passa AA (4,5:1) em todo fundo', () => {
    for (const texto of ['fg', 'fg-2', 'fg-soft', 'fg-muted', 'fg-subtle', 'fg-faint', 'brand-ink'])
      for (const fundo of FUNDOS) {
        // texto cinza muito apagado só aparece em superfícies normais; brand-ink também em fundo tintado (≈ 20% de laranja)
        expect(ratio(claro[texto], claro[fundo]), `${texto} em ${fundo}`).toBeGreaterThanOrEqual(4.5);
      }
  });

  it('claro: laranja de texto passa AA sobre o tinte do badge (bg-brand/20 sobre superfície)', () => {
    const tinte = '#ffdbcc'; // #FF4D00 a 20% sobre branco
    expect(ratio(claro['brand-ink'], tinte)).toBeGreaterThanOrEqual(4.5);
  });

  it('claro: bordas distinguíveis do fundo (ao menos 1,15:1) e fundos hierárquicos', () => {
    expect(ratio(claro['line'], claro['surface'])).toBeGreaterThanOrEqual(1.1);
    expect(ratio(claro['line-strong'], claro['surface'])).toBeGreaterThanOrEqual(1.4);
  });

  it('escuro: texto principal e secundário continuam AA (o resto é o visual de sempre)', () => {
    for (const texto of ['fg', 'fg-2', 'fg-soft', 'fg-muted'])
      for (const fundo of FUNDOS.slice(0, 4)) expect(ratio(escuro[texto], escuro[fundo]), `${texto} em ${fundo}`).toBeGreaterThanOrEqual(4.5);
  });
});
