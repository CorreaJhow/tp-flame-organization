import { formatKeyDisplay } from './chordTransposer';
import { Culto, RepertorioItem, HistoricoItem, Versao } from '../types';

export interface LastPlayedInfo {
  lastPlayedDate?: string;
  lastCultoName?: string;
  lastTom?: string; // tom em que foi tocada da última vez (já formatado, ex.: "Bm")
  daysAgo?: number;
  isRecent: boolean; // Played within last 30 days
  formattedBadge: string;
}

/** dd/mm/aaaa; datas ISO só-dia não passam por Date (UTC mostraria o dia anterior no Brasil). */
export function formatarData(data: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export interface Execucao {
  key: string;
  data: string; // Data_Execucao / Data do culto, como gravada
  timestamp: number;
  tom: string; // tom em que foi tocada, já resolvido (nunca vazio quando a versão existe)
  tomFormatado: string;
  tomOriginal: boolean;
  evento?: string;
  obs?: string;
  historicoId?: string; // só nos registros manuais (editáveis)
  cultoId?: string;
}

/**
 * Une repertório (cultos não cancelados, já ocorridos) e registros manuais do Historico para a
 * música inteira (qualquer versão), sem duplicar: registro manual que aponta para um culto que já
 * tem a música no repertório conta uma vez só (vale o repertório). Mais recente primeiro.
 */
export function getExecucoes(
  versaoId: string,
  cultos: Culto[],
  repertorio: RepertorioItem[],
  historico: HistoricoItem[] = [],
  // Todas as versões cadastradas: a música conta como tocada em qualquer versão/tom dela.
  todasVersoes: Versao[] = [],
  now: Date = new Date()
): Execucao[] {
  const musicaId = todasVersoes.find((v) => v.ID === versaoId)?.ID_Musica;
  const ids = new Set([versaoId, ...todasVersoes.filter((v) => musicaId && v.ID_Musica === musicaId).map((v) => v.ID)]);
  const out: Execucao[] = [];
  const cultosComRepertorio = new Set<string>();

  const montar = (e: Omit<Execucao, 'tom' | 'tomFormatado' | 'tomOriginal'>, versaoDoItem: string, tomEscolhido?: string) => {
    const versao = todasVersoes.find((v) => v.ID === versaoDoItem);
    const tom = tomEscolhido || versao?.Tom || '';
    out.push({
      ...e,
      tom,
      tomFormatado: tom ? formatKeyDisplay(tom, versao?.Modo) : '',
      tomOriginal: !tomEscolhido || tomEscolhido === versao?.Tom
    });
  };

  for (const entry of repertorio.filter((r) => ids.has(r.ID_Versao))) {
    const culto = cultos.find((c) => c.ID === entry.ID_Culto);
    if (!culto || !culto.Data || culto.Status === 'Cancelado') continue;
    const ts = new Date(culto.Data).getTime();
    // Só cultos até hoje (ou amanhã, por causa do fuso).
    if (isNaN(ts) || ts > now.getTime() + 86400000) continue;
    cultosComRepertorio.add(culto.ID);
    montar(
      { key: `r:${entry.ID}`, data: culto.Data, timestamp: ts, evento: culto.Nome_Evento, obs: entry.Observacao_Culto, cultoId: culto.ID },
      entry.ID_Versao,
      entry.Tom_Culto
    );
  }

  for (const h of historico.filter((x) => ids.has(x.ID_Versao) && !x.Excluido_Em)) {
    if (h.ID_Culto && cultosComRepertorio.has(h.ID_Culto)) continue;
    const ts = new Date(h.Data_Execucao).getTime();
    if (isNaN(ts)) continue;
    const culto = h.ID_Culto ? cultos.find((c) => c.ID === h.ID_Culto) : undefined;
    if (culto?.Status === 'Cancelado') continue;
    montar(
      { key: `h:${h.ID}`, data: h.Data_Execucao, timestamp: ts, evento: h.Evento || culto?.Nome_Evento, obs: h.Obs, historicoId: h.ID, cultoId: h.ID_Culto },
      h.ID_Versao,
      h.Tom_Tocado
    );
  }

  return out.sort((a, b) => b.timestamp - a.timestamp);
}

export function getLastPlayedInfo(
  versaoId: string,
  cultos: Culto[],
  repertorio: RepertorioItem[],
  historico: HistoricoItem[] = [],
  todasVersoes: Versao[] = []
): LastPlayedInfo {
  const now = new Date();
  const last = getExecucoes(versaoId, cultos, repertorio, historico, todasVersoes, now)[0];

  if (!last) {
    return {
      isRecent: false,
      formattedBadge: 'Nunca Tocada'
    };
  }

  const diffMs = now.getTime() - last.timestamp;
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const formattedDate = formatarData(last.data);

  let badgeText = '';
  if (daysAgo === 0) {
    badgeText = 'Tocada Hoje';
  } else if (daysAgo === 1) {
    badgeText = `Tocada Ontem (${formattedDate})`;
  } else if (daysAgo < 7) {
    badgeText = `Tocada há ${daysAgo} dias (${formattedDate})`;
  } else if (daysAgo < 30) {
    const weeks = Math.floor(daysAgo / 7);
    badgeText = `Tocada há ${weeks} semana${weeks > 1 ? 's' : ''} (${formattedDate})`;
  } else {
    const months = Math.floor(daysAgo / 30);
    badgeText = `Tocada há ${months} mês${months > 1 ? 'es' : ''} (${formattedDate})`;
  }
  if (last.tomFormatado) badgeText += `, em ${last.tomFormatado}`;

  return {
    lastPlayedDate: formattedDate,
    lastCultoName: last.evento || (last.historicoId ? 'Culto Anterior' : undefined),
    lastTom: last.tomFormatado || undefined,
    daysAgo,
    // Considered recent if played within last 21 days
    isRecent: daysAgo <= 21,
    formattedBadge: badgeText
  };
}

export function getEmbedUrl(url: string, tipo?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (cleanUrl.includes('v=')) {
      videoId = cleanUrl.split('v=')[1]?.split('&')[0] || '';
    } else if (cleanUrl.includes('embed/')) {
      videoId = cleanUrl.split('embed/')[1]?.split('?')[0] || '';
    }
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0`;
    }
  }

  // Spotify
  if (cleanUrl.includes('spotify.com')) {
    if (cleanUrl.includes('track/')) {
      const trackId = cleanUrl.split('track/')[1]?.split('?')[0] || '';
      if (trackId) return `https://open.spotify.com/embed/track/${trackId}`;
    }
  }

  return null;
}
