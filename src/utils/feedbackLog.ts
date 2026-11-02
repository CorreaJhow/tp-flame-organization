/**
 * Formato dos feedbacks gravados em Logs (Acao = 'FEEDBACK'). Tudo que monta
 * ou lê os prefixos passa por aqui, inclusive os registros antigos [SUGESTAO].
 */
export type FeedbackKind = 'melhoria' | 'outra' | 'bug' | 'musica' | 'sugestao' | 'desconhecido';

export interface ParsedFeedback {
  kind: FeedbackKind;
  de?: string;
  mensagem: string;
  musica?: string;
  link?: string;
}

const PREFIXOS: Record<string, FeedbackKind> = {
  'SUGESTAO:MELHORIA': 'melhoria',
  'SUGESTAO:OUTRA': 'outra',
  SUGESTAO: 'sugestao',
  BUG: 'bug',
  MUSICA: 'musica'
};

const comAutor = (nome: string, resto: string): string => {
  const autor = nome.trim();
  return `${autor ? `De: ${autor} - ` : ''}${resto.trim()}`;
};

export const formatSugestao = (tipo: 'melhoria' | 'outra', nome: string, mensagem: string): string =>
  `[SUGESTAO:${tipo === 'melhoria' ? 'MELHORIA' : 'OUTRA'}] ${comAutor(nome, mensagem)}`;

export const formatBug = (nome: string, mensagem: string): string => `[BUG] ${comAutor(nome, mensagem)}`;

export const formatMusica = (nome: string, musica: string, link: string): string =>
  `[MUSICA] De: ${nome.trim()} - Nome: ${musica.trim()} - Link: ${link.trim()}`;

const HOSTS_DE_MUSICA = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'open.spotify.com',
  'spotify.link'
]);

/** Devolve o link pronto para gravar, ou null se não for YouTube ou Spotify. */
export function normalizeMusicLink(input: string): string | null {
  const texto = input.trim();
  if (!texto || /\s/.test(texto)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(texto) ? texto : `https://${texto}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!HOSTS_DE_MUSICA.has(url.hostname.toLowerCase())) return null;
    if (url.pathname === '/' && !url.search) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseFeedback(texto: string): ParsedFeedback {
  const prefixo = texto.match(/^\[([A-Z:]+)\]\s*([\s\S]*)$/);
  const kind = prefixo ? PREFIXOS[prefixo[1]] : undefined;
  if (!prefixo || !kind) return { kind: 'desconhecido', mensagem: texto };

  const corpo = prefixo[2];

  if (kind === 'musica') {
    const match = corpo.match(/^De: ([\s\S]*?) - Nome: ([\s\S]*) - Link: (\S+)$/);
    if (match) {
      return {
        kind,
        de: match[1],
        musica: match[2],
        // O texto do log é livre: link fora da lista não vira link clicável
        link: normalizeMusicLink(match[3]) ?? undefined,
        mensagem: match[3]
      };
    }
    return { kind, mensagem: corpo };
  }

  const autor = corpo.match(/^De: ([\s\S]*?) - ([\s\S]*)$/);
  return autor ? { kind, de: autor[1], mensagem: autor[2] } : { kind, mensagem: corpo };
}
