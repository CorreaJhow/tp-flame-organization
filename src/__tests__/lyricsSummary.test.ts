import { describe, it, expect } from 'vitest';
import { summarizeLyrics } from '../utils/lyricsSummary';

describe('summarizeLyrics', () => {
  it('junta blocos consecutivos iguais ignorando acordes, espaços, maiúsculas e pontuação final', () => {
    const text = `[Refrão]
[E]Santo é o [B]Senhor
Digno de louvor

[Refrão]
C   G
santo   é o Senhor!
DIGNO de louvor.`;
    expect(summarizeLyrics(text)).toEqual([
      { header: 'Refrão', lines: ['[E]Santo é o [B]Senhor', 'Digno de louvor'], count: 2 }
    ]);
  });

  it('não junta repetições separadas por outro bloco', () => {
    const text = `[Refrão]\nSanto\nDigno\n\n[Verso 2]\nOutra letra\nAqui\n\n[Refrão]\nSanto\nDigno`;
    expect(summarizeLyrics(text).map((b) => [b.header, b.count])).toEqual([
      ['Refrão', 1],
      ['Verso 2', 1],
      ['Refrão', 1]
    ]);
  });

  it('bloco sem título herda o título anterior se a letra for igual', () => {
    expect(summarizeLyrics(`[Refrão]\nSanto\nDigno\n\nSanto\nDigno\n\nSanto\nDigno`)).toEqual([
      { header: 'Refrão', lines: ['Santo', 'Digno'], count: 3 }
    ]);
  });

  it('títulos diferentes não se juntam', () => {
    expect(summarizeLyrics(`[Refrão]\nSanto\n\n[Final]\nSanto`)).toHaveLength(2);
  });

  it('cantores diferentes não se juntam', () => {
    const text = `[Voz: Larissa]\nSanto\nDigno\n\n[Voz: Bianca]\nSanto\nDigno`;
    expect(summarizeLyrics(text)).toHaveLength(2);
  });

  it('mesmo cantor se junta', () => {
    const text = `[Voz: Larissa]\nSanto\nDigno\n\n[Voz: Larissa]\nSanto\nDigno`;
    expect(summarizeLyrics(text)).toEqual([
      { lines: ['[Voz: Larissa]', 'Santo', 'Digno'], count: 2 }
    ]);
  });

  it('reduz repetição dentro do bloco só quando ele inteiro é repetição exata', () => {
    expect(summarizeLyrics('A letra\nB letra\nA letra\nB letra')).toEqual([
      { lines: ['A letra', 'B letra'], count: 2 }
    ]);
    expect(summarizeLyrics('Santo\nSanto\nSanto')).toEqual([{ lines: ['Santo'], count: 3 }]);
    expect(summarizeLyrics('A letra\nB letra\nA letra')[0].count).toBe(1);
    expect(summarizeLyrics('A letra\nB letra\nA letra')[0].lines).toHaveLength(3);
  });

  it('soma o (2x) escrito na cifra', () => {
    expect(summarizeLyrics(`[Refrão]\nSanto\nDigno\n(2x)\n\n[Refrão]\nSanto\nDigno`)[0].count).toBe(3);
    expect(summarizeLyrics(`[Refrão]\nSanto\nDigno\n\n(2x)\n\nSanto\nDigno`)[0].count).toBe(3);
  });

  it('entende a contagem escrita no título', () => {
    expect(summarizeLyrics(`[Refrão (4x)]\nSanto\nDigno`)[0]).toMatchObject({ header: 'Refrão', count: 4 });
    expect(summarizeLyrics(`[Refrão] (4x)\nSanto\nDigno`)[0]).toMatchObject({ header: 'Refrão', count: 4 });
  });

  it('bloco só de acordes sem título não aparece nem separa repetições', () => {
    expect(summarizeLyrics(`Santo\nDigno\n\nC  G  Am\n\nSanto\nDigno`)).toEqual([
      { lines: ['Santo', 'Digno'], count: 2 }
    ]);
  });

  it('o (2x) de um trecho só de acordes não vale para a letra anterior', () => {
    expect(summarizeLyrics(`Santo\nDigno\n\nC G\n(2x)`)[0].count).toBe(1);
  });

  it('seção instrumental com título aparece e separa repetições', () => {
    const blocks = summarizeLyrics(`[Refrão]\nSanto\n\n[Solo]\nC G\n\n[Refrão]\nSanto`);
    expect(blocks.map((b) => b.header)).toEqual(['Refrão', 'Solo', 'Refrão']);
  });

  it('mantém anotações na comparação: refrão com (Suave) não some', () => {
    expect(summarizeLyrics(`[Refrão]\nSanto\n\n[Refrão]\n(Suave)\nSanto`)).toHaveLength(2);
  });
});
