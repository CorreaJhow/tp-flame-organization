import { Musica, Versao } from '../types';

/** minúsculas, sem acento. */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Letra sem os acordes entre colchetes, numa linha só. */
const letraLimpa = (letra?: string) => (letra || '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();

export const sortMusicasAZ = (musicas: Musica[]): Musica[] =>
  [...musicas].sort((a, b) => a.Nome.localeCompare(b.Nome, 'pt-BR', { sensitivity: 'base' }));

export interface SongMatch {
  /** Trecho da letra quando o termo só foi achado nela (senão undefined). */
  trecho?: string;
}

/** null = não bate. Procura em nome, artista, categoria, versões (tom/nome) e letra. */
export function matchMusica(musica: Musica, versoes: Versao[], query: string): SongMatch | null {
  const q = norm(query.trim());
  if (!q) return {};
  const campos = [musica.Nome, musica.Artista, musica.Categoria, ...versoes.flatMap((v) => [v.Tom, v.Nome_Versao])];
  if (campos.some((c) => norm(c || '').includes(q))) return {};

  for (const v of versoes) {
    const letra = letraLimpa(v.Letra);
    const i = norm(letra).indexOf(q);
    // norm() mantém o comprimento (só tira diacríticos combinados), então o índice vale na letra original
    if (i >= 0) {
      const ini = Math.max(0, i - 25);
      return { trecho: `${ini > 0 ? '…' : ''}${letra.slice(ini, i + q.length + 40)}…` };
    }
  }
  return null;
}
