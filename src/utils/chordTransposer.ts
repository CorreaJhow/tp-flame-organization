// Utility to transpose musical keys and chords in text
const CHROMATIC_SCALE_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_SCALE_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const KEY_MAPPINGS: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

export const ALL_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

export function getNextKey(currentKey: string, semitones: number): string {
  const normalizedKey = currentKey.trim();
  const baseIndex = KEY_MAPPINGS[normalizedKey] ?? 0;
  let newIndex = (baseIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Use flats for flat keys, sharps for sharp keys
  if (normalizedKey.includes('b')) {
    return CHROMATIC_SCALE_FLATS[newIndex];
  }
  return CHROMATIC_SCALE_SHARPS[newIndex];
}

// Simple chord transposer inside lyrics lines bracketed or inline
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  // Regex to match root note + optional sharp/flat
  const regex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(regex);
  if (!match) return chord;

  const root = match[1];
  const extension = match[2];

  const newRoot = getNextKey(root, semitones);
  return newRoot + extension;
}

export function transposeTextChords(text: string, semitones: number): string {
  if (!text || semitones === 0) return text;

  // Replace chords in square brackets e.g. [G], [D/F#], [Em7] or standalone chord lines
  return text.replace(/\[([A-G][#b]?[^\]]*)\]/g, (_, chordInside) => {
    // Handle slashed chords e.g. D/F#
    const parts = chordInside.split('/');
    const transposedParts = parts.map((part: string) => transposeChord(part.trim(), semitones));
    return `[${transposedParts.join('/')}]`;
  });
}
