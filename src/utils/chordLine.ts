/**
 * Reconhecimento de acordes e classificação de linhas da cifra. Fica fora do
 * ChordViewer porque o resumo da letra (lyricsSummary.ts) e a detecção de vozes
 * (vocalColors.ts) precisam da mesma definição de "o que é acorde".
 */

// Aceita C, C#m, Db7, G/B, F#m7(b5), Bbadd9, Dsus4, Gm7(11), Am7(5+), G7(4/9)
export const CHORD_REGEX = /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|\+|\([^()\s]*\))*(?:\/[A-G][#b]?)?$/i;

export const isChord = (token: string): boolean => CHORD_REGEX.test(token);

export type LineKind =
  | 'blank'
  | 'header' // [Refrão], # Ponte
  | 'annotation' // (2x), (Suave)
  | 'comment' // // nota, * nota
  | 'chords' // C   G/B   Am7
  | 'bracketChords' // [Dm] [C] [A#]
  | 'lyrics';

export interface LineClassification {
  kind: LineKind;
  headerText?: string;
}

export function classifyLine(line: string): LineClassification {
  const trimmed = line.trim();
  if (!trimmed) return { kind: 'blank' };

  const bracketMatch = trimmed.match(/^\[([^\]]*)\]$/);
  const markdownMatch = trimmed.match(/^#{1,4}\s*(.*)$/);
  if (bracketMatch || markdownMatch) {
    const headerText = bracketMatch ? bracketMatch[1] : markdownMatch![1];
    // Um acorde sozinho entre colchetes, como [C], não é título de seção
    if (!isChord(headerText.replace(/\s+/g, ''))) {
      return { kind: 'header', headerText };
    }
  }

  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return { kind: 'annotation' };
  if (trimmed.startsWith('//') || trimmed.startsWith('* ')) return { kind: 'comment' };

  const tokens = trimmed.split(/\s+/);
  const chordCount = tokens.filter(isChord).length;
  if (chordCount / tokens.length >= 0.6) return { kind: 'chords' };

  if (tokens.every((t) => t.startsWith('[') && t.endsWith(']') && isChord(t.slice(1, -1)))) {
    return { kind: 'bracketChords' };
  }

  return { kind: 'lyrics' };
}

/** Tira os acordes entre colchetes da linha e mantém o resto, como seções. */
export function stripBracketChords(line: string): string {
  return line.replace(/\[([^\]]*)\]/g, (whole, inner: string) =>
    isChord(inner.replace(/\s+/g, '')) ? '' : whole
  );
}
