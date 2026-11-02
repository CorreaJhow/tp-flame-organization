/**
 * Letra "sucinta": mostra cada bloco repetido uma vez só, com a contagem, para
 * quem canta ver rápido quantas repetições tem. Só afeta a exibição; o texto
 * cadastrado continua igual.
 *
 * Regras:
 * - Um bloco termina em linha em branco ou título de seção.
 * - Na comparação, acordes, espaços, maiúsculas e pontuação de fim de linha
 *   são ignorados.
 * - Só blocos consecutivos se juntam: Refrão, V2, Refrão continua assim.
 * - Cantores ou títulos diferentes não se juntam. Bloco sem título herda o
 *   título do anterior se a letra for igual.
 * - Bloco inteiro em repetição exata também reduz: A B A B vira A B (2x).
 * - Um (2x) escrito na cifra soma: refrão com (2x) + o mesmo refrão = (3x).
 * - Bloco só de acordes e sem título não aparece e não separa repetições.
 */
import { classifyLine, stripBracketChords } from './chordLine';
import { extractVocalTag } from './vocalColors';

export interface LyricsBlock {
  header?: string;
  lines: string[];
  count: number;
}

interface ParsedBlock extends LyricsBlock {
  signatures: string[];
  hadChords: boolean;
  isCountOnly: boolean;
}

const COUNT_RE = /^[([]?\s*(?:(\d+)\s*(?:x|vezes)|x\s*(\d+))\s*[)\]]?$/i;

const parseCount = (text: string): number | null => {
  const match = text.trim().match(COUNT_RE);
  if (!match) return null;
  const value = parseInt(match[1] ?? match[2], 10);
  return value >= 1 ? value : null;
};

/** Separa "Refrão (2x)" em título e contagem. */
const splitHeaderCount = (header: string): { title: string; count: number | null } => {
  const match = header.match(/^(.*\S)\s+(\(?\s*(?:\d+\s*(?:x|vezes)|x\s*\d+)\s*\)?)$/i);
  if (!match) return { title: header.trim(), count: null };
  return { title: match[1].trim(), count: parseCount(match[2]) };
};

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.,;:!?…]+$/, '');

const headerKey = (header?: string): string => (header ?? '').trim().toLowerCase();

/** Menor período que explica a lista inteira: [a, b, a, b] tem período 2. */
const findPeriod = (items: string[]): number => {
  for (let period = 1; period <= items.length / 2; period++) {
    if (items.length % period === 0 && items.every((item, i) => item === items[i % period])) {
      return period;
    }
  }
  return items.length;
};

function parseBlocks(text: string, knownSingers: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;
  let activeSingers: string[] = [];

  const open = (header?: string, count = 1): ParsedBlock => {
    const block: ParsedBlock = { header, lines: [], signatures: [], count, hadChords: false, isCountOnly: false };
    blocks.push(block);
    return block;
  };

  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim()) {
      current = null;
      activeSingers = [];
      continue;
    }

    const vocal = extractVocalTag(rawLine, knownSingers);
    if (vocal.singers.length > 0) activeSingers = vocal.singers;
    const content = vocal.singers.length > 0 ? vocal.cleanLine : rawLine;
    const singersKey = [...activeSingers].map((s) => s.toLowerCase()).sort().join('+');

    if (vocal.singers.length > 0 && vocal.isStandaloneTag) {
      current ??= open();
      current.lines.push(rawLine);
      current.signatures.push(`voz:${singersKey}`);
      continue;
    }

    const { kind, headerText } = classifyLine(content);

    if (kind === 'header') {
      const { title, count } = splitHeaderCount(headerText ?? '');
      current = open(title, count ?? 1);
      activeSingers = [];
      continue;
    }

    // "[Refrão] (4x)" na mesma linha
    const inlineHeader = content.trim().match(/^\[([^\]]+)\]\s*(\(?\s*(?:\d+\s*(?:x|vezes)|x\s*\d+)\s*\)?)$/i);
    if (inlineHeader && classifyLine(`[${inlineHeader[1]}]`).kind === 'header') {
      current = open(inlineHeader[1].trim(), parseCount(inlineHeader[2]) ?? 1);
      activeSingers = [];
      continue;
    }

    const explicitCount = parseCount(content);
    if (explicitCount !== null) {
      current ??= Object.assign(open(), { isCountOnly: true });
      current.count = explicitCount;
      continue;
    }

    if (kind === 'chords' || kind === 'bracketChords') {
      current ??= open();
      current.hadChords = true;
      continue;
    }

    current ??= open();
    current.isCountOnly = false;
    current.lines.push(rawLine);
    current.signatures.push(`${singersKey}:${normalize(stripBracketChords(content))}`);
  }

  return blocks;
}

export function summarizeLyrics(text: string, knownSingers: string[] = []): LyricsBlock[] {
  const parsed = parseBlocks(text, knownSingers);
  const resolved: ParsedBlock[] = [];

  for (const block of parsed) {
    const hasLyrics = block.lines.length > 0;
    const previous = resolved[resolved.length - 1];

    // "(2x)" sozinho entre linhas em branco vale para o bloco anterior
    if (block.isCountOnly && !block.hadChords && !hasLyrics) {
      if (previous) previous.count += block.count - 1;
      continue;
    }

    // Trecho instrumental sem título: a cantora não vê nem precisa contar
    if (!hasLyrics && !block.header) continue;

    if (hasLyrics) {
      const period = findPeriod(block.signatures);
      if (period < block.signatures.length) {
        block.count *= block.signatures.length / period;
        block.lines = block.lines.slice(0, period);
        block.signatures = block.signatures.slice(0, period);
      }
    }

    const sameLyrics = previous && previous.signatures.join('\n') === block.signatures.join('\n');
    const compatibleHeader =
      block.header === undefined ? hasLyrics : headerKey(block.header) === headerKey(previous?.header);

    if (previous && sameLyrics && compatibleHeader) {
      previous.count += block.count;
      continue;
    }

    resolved.push(block);
  }

  return resolved.map(({ header, lines, count }) => ({ header, lines, count }));
}
