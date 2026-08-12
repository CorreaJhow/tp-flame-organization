import { Culto, RepertorioItem, HistoricoItem, Versao } from '../types';

export interface LastPlayedInfo {
  lastPlayedDate?: string;
  lastCultoName?: string;
  daysAgo?: number;
  isRecent: boolean; // Played within last 30 days
  formattedBadge: string;
}

export function getLastPlayedInfo(
  versaoId: string,
  cultos: Culto[],
  repertorio: RepertorioItem[],
  historico: HistoricoItem[] = []
): LastPlayedInfo {
  const now = new Date();
  let mostRecentTimestamp: number | null = null;
  let matchedCultoName: string | undefined = undefined;

  // 1. Check in Repertório of Cultos that are either completed or occurred in the past
  const setlistEntries = repertorio.filter((r) => r.ID_Versao === versaoId);

  for (const entry of setlistEntries) {
    const culto = cultos.find((c) => c.ID === entry.ID_Culto);
    if (culto && culto.Data) {
      const cultoDate = new Date(culto.Data);
      // Only consider cultos up to today or marked as 'Realizado' / past date
      if (!isNaN(cultoDate.getTime()) && cultoDate.getTime() <= now.getTime() + 86400000) {
        if (mostRecentTimestamp === null || cultoDate.getTime() > mostRecentTimestamp) {
          mostRecentTimestamp = cultoDate.getTime();
          matchedCultoName = culto.Nome_Evento;
        }
      }
    }
  }

  // 2. Check in Historico
  const histEntries = historico.filter((h) => h.ID_Versao === versaoId);
  for (const h of histEntries) {
    if (h.Data_Execucao) {
      const hDate = new Date(h.Data_Execucao);
      if (!isNaN(hDate.getTime())) {
        if (mostRecentTimestamp === null || hDate.getTime() > mostRecentTimestamp) {
          mostRecentTimestamp = hDate.getTime();
          const relatedCulto = cultos.find((c) => c.ID === h.ID_Culto);
          matchedCultoName = relatedCulto ? relatedCulto.Nome_Evento : 'Culto Anterior';
        }
      }
    }
  }

  if (mostRecentTimestamp === null) {
    return {
      isRecent: false,
      formattedBadge: 'Nunca Tocada'
    };
  }

  const diffMs = now.getTime() - mostRecentTimestamp;
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const dateObj = new Date(mostRecentTimestamp);
  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let badgeText = '';
  if (daysAgo === 0) {
    badgeText = 'Tocada Hoje!';
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

  // Considered recent if played within last 21 days
  const isRecent = daysAgo <= 21;

  return {
    lastPlayedDate: formattedDate,
    lastCultoName: matchedCultoName,
    daysAgo,
    isRecent,
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
