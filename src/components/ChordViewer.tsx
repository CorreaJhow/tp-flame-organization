import React from 'react';
import { transposeChord } from '../utils/chordTransposer';

interface ChordViewerProps {
  text: string;
  semitones?: number;
  className?: string;
}

// Regex to check if a token looks like a chord (e.g., C, C#m, Db7, G/B, F#m7(b5), Bbadd9, Dsus4)
const CHORD_REGEX = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|[0-9])*(?:\/[A-G][#b]?)?$/i;

// Common section names that should be styled as section headers
const SECTION_KEYWORDS = [
  'INTRO', 'INTRODUCAO', 'INTRODUÇÃO',
  'VERSO', 'VERSE', 'VERSO 1', 'VERSO 2', 'VERSO 3',
  'REFRÃO', 'REFRAO', 'CHORUS', 'PRE-REFRÃO', 'PRÉ-REFRÃO', 'PRE-CHORUS',
  'PONTE', 'BRIDGE', 'SOLO', 'INTERLÚDIO', 'INTERLUDIO',
  'OUTRO', 'FINAL', 'TAG', 'INSTRUÇÕES', 'OBSERVAÇÃO'
];

export const ChordViewer: React.FC<ChordViewerProps> = ({
  text,
  semitones = 0,
  className = ''
}) => {
  if (!text) {
    return <p className="text-slate-500 italic text-xs">Nenhuma letra ou cifra cadastrada.</p>;
  }

  const lines = text.split('\n');

  // Helper to parse line content
  const renderLine = (line: string, lineIndex: number) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={lineIndex} className="h-3" />;
    }

    // 1. Check for Section Headers like [Intro], [Refrão], [Verso 1], # Intro, ## Ponte
    const bracketHeaderMatch = trimmed.match(/^\[(.*)\]$/);
    const markdownHeaderMatch = trimmed.match(/^#{1,4}\s*(.*)$/);

    if (bracketHeaderMatch || markdownHeaderMatch) {
      const headerText = bracketHeaderMatch ? bracketHeaderMatch[1] : markdownHeaderMatch![1];
      const upperHeader = headerText.toUpperCase();

      // Check if it's a section tag or just a single chord in brackets e.g. [C]
      const isSingleChord = CHORD_REGEX.test(headerText.replace(/\s+/g, ''));
      if (!isSingleChord) {
        return (
          <div
            key={lineIndex}
            className="my-3 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#FF4D00]/25 via-[#FF4D00]/10 to-transparent border-l-4 border-[#FF4D00] text-[#FF4D00] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm select-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
            <span>{headerText}</span>
          </div>
        );
      }
    }

    // 2. Check for Annotations / Parenthetical Notes like (2x), (Cantar 2x), (Entra Bateria), (Suave)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return (
        <div key={lineIndex} className="my-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40 font-bold italic text-xs sm:text-sm shadow-sm">
            💡 {trimmed}
          </span>
        </div>
      );
    }

    // 3. Check for Comments / Notes starting with // or *
    if (trimmed.startsWith('//') || trimmed.startsWith('* ')) {
      return (
        <div key={lineIndex} className="my-1">
          <span className="inline-block px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold text-xs italic">
            📝 {line}
          </span>
        </div>
      );
    }

    // 4. Check if the entire line is a Cifra line (mostly chords separated by spaces e.g. C   G/B   Am7   F)
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const validChordCount = tokens.filter(t => CHORD_REGEX.test(t)).length;
    const isChordLine = tokens.length > 0 && validChordCount / tokens.length >= 0.6;

    if (isChordLine) {
      // Split preserving spaces to maintain tab alignment above lyrics
      const elements: React.ReactNode[] = [];
      let currentPos = 0;

      // Regex matching words or spaces
      const wordSpaceRegex = /(\S+|\s+)/g;
      let match;
      let keyCounter = 0;

      while ((match = wordSpaceRegex.exec(line)) !== null) {
        const token = match[0];
        if (/\S/.test(token)) {
          // It's a word/chord
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
          // Preserve whitespace spacing
          elements.push(
            <span key={keyCounter++} className="whitespace-pre">
              {token}
            </span>
          );
        }
      }

      return (
        <div key={lineIndex} className="my-1 font-mono leading-relaxed">
          {elements}
        </div>
      );
    }

    // 5. Mixed Line with Bracketed Chords e.g., "Te louvarei [G] pra sempre [D/F#]"
    // Process bracketed tokens e.g. [C], [G/B], [Refrão], (suave)
    const parts = line.split(/(\[[^\]]+\]|\([^)]+\))/g);

    return (
      <div key={lineIndex} className="my-0.5 leading-relaxed font-mono text-xs sm:text-sm">
        {parts.map((part, pIdx) => {
          if (!part) return null;

          // Bracketed item e.g. [G] or [Refrão]
          if (part.startsWith('[') && part.endsWith(']')) {
            const inner = part.slice(1, -1).trim();

            // Check if inner is a section name (e.g. [Refrão], [Ponte])
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
          return <span key={pIdx} className="text-slate-100">{part}</span>;
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
