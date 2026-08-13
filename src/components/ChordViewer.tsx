import React from 'react';
import { transposeChord } from '../utils/chordTransposer';
import { extractVocalTag, getVocalConfig, isVoiceMatching, VocalConfig } from '../utils/vocalColors';
import { Mic, Users } from 'lucide-react';

interface ChordViewerProps {
  text?: string | null | any;
  semitones?: number;
  displayMode?: 'cifra' | 'letra';
  fontSizeStep?: number; // e.g. -1, 0, 1, 2, 3
  focusVoice?: string | null; // e.g. 'Larissa', 'Bianca', 'Leticia', 'Jhow', or null
  showVocalHighlights?: boolean;
  knownSingers?: string[];
  className?: string;
}

// Regex to check if a token looks like a chord (e.g., C, C#m, Db7, G/B, F#m7(b5), Bbadd9, Dsus4)
const CHORD_REGEX = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|[0-9])*(?:\/[A-G][#b]?)?$/i;

// Common section names that should be styled as section headers
const SECTION_KEYWORDS = [
  'INTRO', 'INTRODUCAO', 'INTRODUÇÃO',
  'VERSO', 'VERSE', 'VERSO 1', 'VERSO 2', 'VERSO 3', 'ESTROFE',
  'REFRÃO', 'REFRAO', 'CHORUS', 'PRE-REFRÃO', 'PRÉ-REFRÃO', 'PRE-CHORUS',
  'PONTE', 'BRIDGE', 'SOLO', 'INTERLÚDIO', 'INTERLUDIO',
  'OUTRO', 'FINAL', 'TAG', 'INSTRUÇÕES', 'OBSERVAÇÃO', 'MINISTRAÇÃO'
];

export const ChordViewer: React.FC<ChordViewerProps> = ({
  text,
  semitones = 0,
  displayMode = 'cifra',
  fontSizeStep = 0,
  focusVoice = null,
  showVocalHighlights = true,
  knownSingers = [],
  className = ''
}) => {
  const safeText = typeof text === 'string' ? text : text != null ? String(text) : '';
  if (!safeText.trim()) {
    return <p className="text-slate-500 italic text-xs">Nenhuma letra ou cifra cadastrada.</p>;
  }

  const isLetraMode = displayMode === 'letra';

  // Base font sizing classes depending on mode and font step
  const getFontSizeClass = () => {
    if (isLetraMode) {
      if (fontSizeStep <= -1) return 'text-base leading-snug';
      if (fontSizeStep === 0) return 'text-lg sm:text-xl leading-relaxed';
      if (fontSizeStep === 1) return 'text-xl sm:text-2xl leading-relaxed';
      if (fontSizeStep === 2) return 'text-2xl sm:text-3xl leading-relaxed';
      return 'text-3xl sm:text-4xl leading-loose';
    } else {
      if (fontSizeStep <= -1) return 'text-[11px] sm:text-xs';
      if (fontSizeStep === 0) return 'text-xs sm:text-sm';
      if (fontSizeStep === 1) return 'text-sm sm:text-base';
      if (fontSizeStep === 2) return 'text-base sm:text-lg';
      return 'text-lg sm:text-xl';
    }
  };

  const fontClass = getFontSizeClass();

  const lines = safeText.split('\n');

  // Track current block active singer(s) across lines if line is part of a vocal block
  let currentActiveSingers: string[] = [];

  // Helper to parse line content
  const renderLine = (rawLine: string, lineIndex: number) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      currentActiveSingers = []; // Blank line resets current singer block
      return <div key={lineIndex} className={isLetraMode ? "h-3" : "h-3.5"} />;
    }

    // 0. Check for Vocal Annotation Tag e.g. [Voz: Larissa & Leticia], [Larissa + Joey], (Voz: Bianca)
    const vocalInfo = extractVocalTag(rawLine, knownSingers);
    if (vocalInfo.singers.length > 0) {
      currentActiveSingers = vocalInfo.singers;
    }

    const effectiveSingers = vocalInfo.singers.length > 0 ? vocalInfo.singers : currentActiveSingers;
    const vocalConfigs: VocalConfig[] = showVocalHighlights 
      ? effectiveSingers.map(s => getVocalConfig(s)) 
      : [];

    // Check if this line is focused or dimmed
    const isFocused = isVoiceMatching(focusVoice, effectiveSingers);
    const isDimmed = Boolean(focusVoice && !isFocused);

    // If it's a standalone vocal tag line like "[Voz: Larissa & Leticia]"
    if (vocalInfo.singers.length > 0 && vocalInfo.isStandaloneTag) {
      if (!showVocalHighlights) return null;

      const isDuet = vocalInfo.singers.length > 1;

      return (
        <div
          key={lineIndex}
          className={`my-2 py-1.5 px-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-all ${
            isDuet 
              ? 'bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-cyan-950/40 border-slate-700/80 shadow-md'
              : vocalConfigs[0] 
              ? `${vocalConfigs[0].badgeBg} ${vocalConfigs[0].badgeBorder}` 
              : 'bg-slate-900 border-slate-700'
          } ${isFocused && focusVoice ? 'ring-2 ring-[#FF4D00]/60 scale-[1.01]' : ''} ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
        >
          <div className="flex items-center gap-2 flex-wrap font-black text-xs uppercase tracking-wider">
            {isDuet ? (
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Mic className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            )}

            <span className="text-slate-400 text-[11px] font-bold">
              {isDuet ? 'Dueto / Vozes:' : 'Voz:'}
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {vocalConfigs.map((cfg, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black uppercase border shadow-sm ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.hexColor }} />
                  {cfg.name}
                </span>
              ))}
            </div>
          </div>

          {focusVoice && isVoiceMatching(focusVoice, vocalInfo.singers) && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FF4D00] text-slate-950 shadow-sm flex items-center gap-1">
              ★ Sua Parte
            </span>
          )}
        </div>
      );
    }

    const lineToProcess = vocalInfo.singers.length > 0 ? vocalInfo.cleanLine : rawLine;
    const trimmedLine = lineToProcess.trim();

    if (!trimmedLine) {
      return <div key={lineIndex} className={isLetraMode ? "h-2" : "h-2.5"} />;
    }

    // 1. Check for Section Headers like [Intro], [Refrão], [Verso 1], # Intro, ## Ponte
    const bracketHeaderMatch = trimmedLine.match(/^\[(.*)\]$/);
    const markdownHeaderMatch = trimmedLine.match(/^#{1,4}\s*(.*)$/);

    if (bracketHeaderMatch || markdownHeaderMatch) {
      const headerText = bracketHeaderMatch ? bracketHeaderMatch[1] : markdownHeaderMatch![1];

      // Check if it's a section tag or just a single chord in brackets e.g. [C]
      const isSingleChord = CHORD_REGEX.test(headerText.replace(/\s+/g, ''));
      if (!isSingleChord) {
        currentActiveSingers = []; // Section header resets active singer block
        return (
          <div
            key={lineIndex}
            className={`my-3 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#FF4D00]/25 via-[#FF4D00]/10 to-transparent border-l-4 border-[#FF4D00] text-[#FF4D00] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm select-none ${
              isLetraMode ? 'text-sm sm:text-base my-4' : 'text-xs sm:text-sm'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
            <span>{headerText}</span>
          </div>
        );
      }
    }

    // 2. Check for Annotations / Parenthetical Notes like (2x), (Cantar 2x), (Entra Bateria), (Suave)
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      return (
        <div key={lineIndex} className={`my-1.5 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40 font-bold italic shadow-sm ${
            isLetraMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          }`}>
            💡 {trimmedLine}
          </span>
        </div>
      );
    }

    // 3. Check for Comments / Notes starting with // or *
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('* ')) {
      return (
        <div key={lineIndex} className={`my-1 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
          <span className="inline-block px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold text-xs italic">
            📝 {trimmedLine}
          </span>
        </div>
      );
    }

    // 4. Check if the entire line is a Cifra line (mostly chords separated by spaces e.g. C   G/B   Am7   F)
    const tokens = trimmedLine.split(/\s+/).filter(Boolean);
    const validChordCount = tokens.filter(t => CHORD_REGEX.test(t)).length;
    const isChordLine = tokens.length > 0 && validChordCount / tokens.length >= 0.6;

    if (isChordLine) {
      // In Modo Letra, hide pure chord lines completely!
      if (isLetraMode) {
        return null;
      }

      // Split preserving spaces to maintain tab alignment above lyrics
      const elements: React.ReactNode[] = [];
      let keyCounter = 0;

      const wordSpaceRegex = /(\S+|\s+)/g;
      let match;

      while ((match = wordSpaceRegex.exec(lineToProcess)) !== null) {
        const token = match[0];
        if (/\S/.test(token)) {
          if (CHORD_REGEX.test(token)) {
            const transposed = transposeChord(token, semitones);
            elements.push(
              <span
                key={keyCounter++}
                className="inline-block font-black text-[#FF4D00] bg-[#FF4D00]/15 border border-[#FF4D00]/50 px-1.5 py-0.5 rounded-md mx-0.5 text-xs sm:text-sm tracking-wider shadow-sm ring-1 ring-[#FF4D00]/20"
              >
                {transposed}
              </span>
            );
          } else {
            elements.push(<span key={keyCounter++}>{token}</span>);
          }
        } else {
          elements.push(
            <span key={keyCounter++} className="whitespace-pre">
              {token}
            </span>
          );
        }
      }

      return (
        <div key={lineIndex} className={`my-1 font-mono leading-relaxed ${fontClass} ${isDimmed ? 'opacity-30' : 'opacity-100'}`}>
          {elements}
        </div>
      );
    }

    // 5. Mixed Line with Bracketed Chords and/or Lyrics
    const parts = lineToProcess.split(/(\[[^\]]+\]|\([^)]+\))/g);

    // Multi-vocal badges on the line
    const vocalBadges = vocalConfigs.length > 0 && showVocalHighlights && vocalInfo.singers.length > 0 ? (
      <span className="inline-flex items-center gap-1 mr-2 align-middle">
        {vocalConfigs.map((cfg, cIdx) => (
          <span
            key={cIdx}
            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.hexColor }} />
            {cfg.name}
          </span>
        ))}
      </span>
    ) : null;

    // Line side border style (dual colored border or single border)
    let vocalLineStyle = 'my-0.5';
    if (vocalConfigs.length > 0 && showVocalHighlights) {
      if (vocalConfigs.length === 1) {
        vocalLineStyle = `${vocalConfigs[0].lineBorder} border-l-2 pl-2.5 my-1.5 rounded-r-lg ${isFocused && focusVoice ? `${vocalConfigs[0].activeBg} py-1.5 pr-2` : ''}`;
      } else {
        // Multi-singer / Duet border
        vocalLineStyle = `border-l-4 border-amber-400/90 pl-2.5 my-1.5 rounded-r-lg bg-gradient-to-r from-amber-950/20 via-pink-950/10 to-transparent ${isFocused && focusVoice ? 'py-1.5 pr-2 ring-1 ring-amber-400/30' : ''}`;
      }
    }

    return (
      <div
        key={lineIndex}
        className={`leading-relaxed transition-all ${vocalLineStyle} ${fontClass} ${
          isLetraMode ? 'font-sans text-slate-100 font-medium' : 'font-mono'
        } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
      >
        {vocalBadges}
        {parts.map((part, pIdx) => {
          if (!part) return null;

          // Bracketed item e.g. [G] or [Refrão]
          if (part.startsWith('[') && part.endsWith(']')) {
            const inner = part.slice(1, -1).trim();

            const upperInner = inner.toUpperCase();
            const isSectionTag = SECTION_KEYWORDS.some(k => upperInner.includes(k));

            if (isSectionTag) {
              return (
                <span
                  key={pIdx}
                  className="inline-block mx-1 my-0.5 px-2 py-0.5 rounded-md bg-[#FF4D00]/25 text-[#FF4D00] border border-[#FF4D00]/60 font-black text-xs uppercase tracking-wider shadow-sm"
                >
                  {inner}
                </span>
              );
            }

            // In Modo Letra, hide bracketed chords [G/B] completely!
            if (isLetraMode) {
              return null;
            }

            // Otherwise, it's a bracketed Chord e.g. [G/B]
            const transposed = transposeChord(inner, semitones);
            return (
              <span
                key={pIdx}
                className="inline-block mx-0.5 px-1.5 py-0.2 rounded bg-[#FF4D00] text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-md transform -translate-y-0.5"
              >
                {transposed}
              </span>
            );
          }

          // Parenthetical inline note e.g. (Suave)
          if (part.startsWith('(') && part.endsWith(')')) {
            return (
              <span
                key={pIdx}
                className="inline-block mx-1 text-[#FF4D00] font-bold italic bg-[#FF4D00]/10 border border-[#FF4D00]/30 px-1.5 py-0.2 rounded text-xs"
              >
                {part}
              </span>
            );
          }

          // Normal lyrics text
          return <span key={pIdx} className={isLetraMode ? "text-slate-100 font-semibold" : "text-slate-100"}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, idx) => renderLine(line, idx))}
    </div>
  );
};
