export interface VocalConfig {
  name: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  lineBorder: string;
  activeBg: string;
  glowClass: string;
  hexColor: string;
}

export const KNOWN_VOCALS: Record<string, VocalConfig> = {
  larissa: {
    name: 'Larissa',
    colorName: 'Rosa',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-500/40',
    lineBorder: 'border-l-pink-500',
    activeBg: 'bg-pink-950/30',
    glowClass: 'ring-1 ring-pink-500/30',
    hexColor: '#ec4899'
  },
  bianca: {
    name: 'Bianca',
    colorName: 'Roxo',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    lineBorder: 'border-l-purple-500',
    activeBg: 'bg-purple-950/30',
    glowClass: 'ring-1 ring-purple-500/30',
    hexColor: '#a855f7'
  },
  leticia: {
    name: 'Leticia',
    colorName: 'Ciano',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    lineBorder: 'border-l-cyan-500',
    activeBg: 'bg-cyan-950/30',
    glowClass: 'ring-1 ring-cyan-500/30',
    hexColor: '#06b6d4'
  },
  letícia: {
    name: 'Letícia',
    colorName: 'Ciano',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    lineBorder: 'border-l-cyan-500',
    activeBg: 'bg-cyan-950/30',
    glowClass: 'ring-1 ring-cyan-500/30',
    hexColor: '#06b6d4'
  },
  jhow: {
    name: 'Jhow',
    colorName: 'Âmbar',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    lineBorder: 'border-l-amber-500',
    activeBg: 'bg-amber-950/30',
    glowClass: 'ring-1 ring-amber-500/30',
    hexColor: '#f59e0b'
  },
  joey: {
    name: 'Joey',
    colorName: 'Âmbar',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    lineBorder: 'border-l-amber-500',
    activeBg: 'bg-amber-950/30',
    glowClass: 'ring-1 ring-amber-500/30',
    hexColor: '#f59e0b'
  },
  todos: {
    name: 'Todos',
    colorName: 'Esmeralda',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    lineBorder: 'border-l-emerald-500',
    activeBg: 'bg-emerald-950/30',
    glowClass: 'ring-1 ring-emerald-500/30',
    hexColor: '#10b981'
  },
  unissono: {
    name: 'Uníssono',
    colorName: 'Esmeralda',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    lineBorder: 'border-l-emerald-500',
    activeBg: 'bg-emerald-950/30',
    glowClass: 'ring-1 ring-emerald-500/30',
    hexColor: '#10b981'
  },
  dueto: {
    name: 'Dueto',
    colorName: 'Azul',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    lineBorder: 'border-l-blue-500',
    activeBg: 'bg-blue-950/30',
    glowClass: 'ring-1 ring-blue-500/30',
    hexColor: '#3b82f6'
  },
  ministro: {
    name: 'Ministro',
    colorName: 'Laranja',
    badgeBg: 'bg-[#FF4D00]/20',
    badgeText: 'text-[#FF4D00]',
    badgeBorder: 'border-[#FF4D00]/40',
    lineBorder: 'border-l-[#FF4D00]',
    activeBg: 'bg-[#FF4D00]/10',
    glowClass: 'ring-1 ring-[#FF4D00]/30',
    hexColor: '#FF4D00'
  },
  lead: {
    name: 'Vocal Lead',
    colorName: 'Laranja',
    badgeBg: 'bg-[#FF4D00]/20',
    badgeText: 'text-[#FF4D00]',
    badgeBorder: 'border-[#FF4D00]/40',
    lineBorder: 'border-l-[#FF4D00]',
    activeBg: 'bg-[#FF4D00]/10',
    glowClass: 'ring-1 ring-[#FF4D00]/30',
    hexColor: '#FF4D00'
  }
};

const DYNAMIC_PALETTES: VocalConfig[] = [
  {
    name: 'Voz 1',
    colorName: 'Rosa',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    badgeBorder: 'border-pink-500/40',
    lineBorder: 'border-l-pink-500',
    activeBg: 'bg-pink-950/30',
    glowClass: 'ring-1 ring-pink-500/30',
    hexColor: '#ec4899'
  },
  {
    name: 'Voz 2',
    colorName: 'Roxo',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    lineBorder: 'border-l-purple-500',
    activeBg: 'bg-purple-950/30',
    glowClass: 'ring-1 ring-purple-500/30',
    hexColor: '#a855f7'
  },
  {
    name: 'Voz 3',
    colorName: 'Ciano',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    lineBorder: 'border-l-cyan-500',
    activeBg: 'bg-cyan-950/30',
    glowClass: 'ring-1 ring-cyan-500/30',
    hexColor: '#06b6d4'
  },
  {
    name: 'Voz 4',
    colorName: 'Âmbar',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    lineBorder: 'border-l-amber-500',
    activeBg: 'bg-amber-950/30',
    glowClass: 'ring-1 ring-amber-500/30',
    hexColor: '#f59e0b'
  },
  {
    name: 'Voz 5',
    colorName: 'Azul',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    lineBorder: 'border-l-blue-500',
    activeBg: 'bg-blue-950/30',
    glowClass: 'ring-1 ring-blue-500/30',
    hexColor: '#3b82f6'
  },
  {
    name: 'Voz 6',
    colorName: 'Esmeralda',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    lineBorder: 'border-l-emerald-500',
    activeBg: 'bg-emerald-950/30',
    glowClass: 'ring-1 ring-emerald-500/30',
    hexColor: '#10b981'
  }
];

export function getVocalConfig(rawName: string): VocalConfig {
  const clean = rawName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (KNOWN_VOCALS[clean]) {
    return { ...KNOWN_VOCALS[clean], name: rawName.trim() };
  }

  // Check partial matches
  for (const [key, config] of Object.entries(KNOWN_VOCALS)) {
    if (clean.includes(key)) {
      return { ...config, name: rawName.trim() };
    }
  }

  // Generate consistent hash-based color from dynamic palettes
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTES.length;
  return { ...DYNAMIC_PALETTES[index], name: rawName.trim() };
}

export interface VocalParsedResult {
  singers: string[];
  rawSingerString: string | null;
  cleanLine: string;
  isStandaloneTag: boolean;
  isDuetOrGroup: boolean;
}

/**
 * Splits a vocal string like "Larissa & Leticia", "Larissa + Bianca", "Joey e Leticia", "Larissa, Bianca / Jhow"
 * into an array of individual singer names: ['Larissa', 'Leticia']
 */
export function splitSingers(rawString: string): string[] {
  if (!rawString) return [];
  // Split by & , + / and ' e ' / ' and '
  const tokens = rawString.split(/(?:\s*&\s*|\s*\+\s*|\s*\/\s*|\s*,\s*|\s+e\s+|\s+and\s+)/i);
  return tokens.map(t => t.trim()).filter(Boolean);
}

/**
 * Extracts vocal tag from line supporting multi-singers / duets:
 * "[Voz: Larissa & Leticia] Meu coração te adora"
 * "[Larissa + Joey] Tua graça"
 * "[Voz: Larissa, Bianca e Jhow]"
 * "(Voz: Larissa & Letícia)"
 * "@Larissa @Leticia"
 */
export function extractVocalTag(line: string, knownSingers: string[] = []): VocalParsedResult {
  const trimmed = line.trim();

  // Pattern 1: [Voz: Larissa & Leticia], [Vocal: Larissa + Bianca], [Vozes: Todos]
  const explicitMatch = trimmed.match(/^\[(?:voz|vocal|vozes|cantor|cantora|dueto|trio|lead|ministro)[:\s-]+([^\]]+)\]\s*(.*)$/i);
  if (explicitMatch) {
    const rawSinger = explicitMatch[1].trim();
    const singers = splitSingers(rawSinger);
    return {
      singers,
      rawSingerString: rawSinger,
      cleanLine: explicitMatch[2] ? explicitMatch[2].trim() : '',
      isStandaloneTag: !explicitMatch[2] || explicitMatch[2].trim() === '',
      isDuetOrGroup: singers.length > 1
    };
  }

  // Pattern 2: (Voz: Larissa & Leticia)
  const parenMatch = trimmed.match(/^\((?:voz|vocal|vozes|cantor|cantora|dueto)[:\s-]+([^)]+)\)\s*(.*)$/i);
  if (parenMatch) {
    const rawSinger = parenMatch[1].trim();
    const singers = splitSingers(rawSinger);
    return {
      singers,
      rawSingerString: rawSinger,
      cleanLine: parenMatch[2] ? parenMatch[2].trim() : '',
      isStandaloneTag: !parenMatch[2] || parenMatch[2].trim() === '',
      isDuetOrGroup: singers.length > 1
    };
  }

  // Pattern 3: @Larissa @Leticia at start of line
  const atMatch = trimmed.match(/^(@[a-zA-ZÀ-ÿ0-9_-]+(?:\s+@[a-zA-ZÀ-ÿ0-9_-]+)*)\s*(.*)$/);
  if (atMatch) {
    const rawTags = atMatch[1];
    const singers = rawTags.split(/\s+/).map(t => t.replace(/^@/, '').trim()).filter(Boolean);
    return {
      singers,
      rawSingerString: singers.join(' & '),
      cleanLine: atMatch[2] ? atMatch[2].trim() : '',
      isStandaloneTag: !atMatch[2] || atMatch[2].trim() === '',
      isDuetOrGroup: singers.length > 1
    };
  }

  // Pattern 4: Check if bracket tag matches one or more known singers e.g. [Larissa & Leticia] or [Larissa + Bianca]
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketMatch) {
    const candidateRaw = bracketMatch[1].trim();
    const candidates = splitSingers(candidateRaw);
    const knownLower = ['larissa', 'bianca', 'leticia', 'letícia', 'jhow', 'joey', 'todos', 'unissono', 'dueto', ...knownSingers.map(s => s.toLowerCase())];

    const allAreKnown = candidates.length > 0 && candidates.every(c => knownLower.includes(c.toLowerCase()) || knownLower.some(k => k.includes(c.toLowerCase())));

    if (allAreKnown) {
      return {
        singers: candidates,
        rawSingerString: candidateRaw,
        cleanLine: bracketMatch[2] ? bracketMatch[2].trim() : '',
        isStandaloneTag: !bracketMatch[2] || bracketMatch[2].trim() === '',
        isDuetOrGroup: candidates.length > 1
      };
    }
  }

  return {
    singers: [],
    rawSingerString: null,
    cleanLine: line,
    isStandaloneTag: false,
    isDuetOrGroup: false
  };
}

/**
 * Checks if a given singer name or focusVoice matches any singer in a list of singers
 */
export function isVoiceMatching(focusVoice: string | null | undefined, lineSingers: string[]): boolean {
  if (!focusVoice) return true;
  if (!lineSingers || lineSingers.length === 0) return true;

  const target = focusVoice.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return lineSingers.some(s => {
    const clean = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return clean === target || clean === 'todos' || clean === 'unissono' || (target === 'todos');
  });
}
