import { describe, it, expect } from 'vitest';
import { classifyLine, isChord, stripBracketChords } from '../utils/chordLine';
import { extractVocalTag } from '../utils/vocalColors';

describe('CHORD_REGEX', () => {
  it.each(['C', 'C#m', 'Db7', 'G/B', 'D/F#', 'F#m7(b5)', 'Bbadd9', 'Dsus4', 'C7M', 'Gm7(11)', 'Am7(5+)', 'G7(4/9)', 'C+', 'E7(#9)/G#'])(
    'reconhece %s',
    (chord) => expect(isChord(chord)).toBe(true)
  );

  it.each(['Santo', 'Refrão', 'Deus', 'H7', 'Gm7(', 'Am7)', 'C(a b)'])('recusa %s', (token) =>
    expect(isChord(token)).toBe(false)
  );
});

describe('classifyLine', () => {
  it('título de seção', () => {
    expect(classifyLine('[Refrão]')).toEqual({ kind: 'header', headerText: 'Refrão' });
    expect(classifyLine('## Ponte')).toEqual({ kind: 'header', headerText: 'Ponte' });
  });

  it('vários acordes entre colchetes não viram título', () => {
    expect(classifyLine('[Dm] [C] [A#]').kind).toBe('bracketChords');
    expect(classifyLine('[Gm7(11)] [Am7(5+)]').kind).toBe('bracketChords');
  });

  it('um acorde sozinho entre colchetes não vira título', () => {
    expect(classifyLine('[C]').kind).toBe('bracketChords');
    expect(classifyLine('[Am7(5+)]').kind).toBe('bracketChords');
  });

  it('linha de acordes com parênteses e + deixa de ser letra', () => {
    expect(classifyLine('Gm7(11)   C   Am7(5+)').kind).toBe('chords');
  });

  it('anotação, comentário, letra e linha vazia', () => {
    expect(classifyLine('(2x)').kind).toBe('annotation');
    expect(classifyLine('// entra bateria').kind).toBe('comment');
    expect(classifyLine('[E] Sobre o trono [B] Tu estás').kind).toBe('lyrics');
    expect(classifyLine('   ').kind).toBe('blank');
  });

  it('stripBracketChords tira acordes e mantém o resto', () => {
    expect(stripBracketChords('San[C]to [Refrão] [Am7(5+)]é')).toBe('Santo [Refrão] é');
  });
});

describe('acordes não são confundidos com cantores', () => {
  it.each(['[E] Sobre o trono', '[A]', '[C] [G] [Am]', '[B] Santo', '[D/F#] Santo', '[C + G]'])('%s', (line) => {
    expect(extractVocalTag(line).singers).toEqual([]);
  });

  it('nomes continuam funcionando', () => {
    expect(extractVocalTag('[Larissa & Leticia] Tua graça').singers).toEqual(['Larissa', 'Leticia']);
    expect(extractVocalTag('[Voz: Bianca]').singers).toEqual(['Bianca']);
    expect(extractVocalTag('[Lari] Santo').singers).toEqual(['Lari']);
  });
});
