import { describe, it, expect } from 'vitest';
import { transposeChord, transposeTextChords, getNextKey, ALL_KEYS } from '../utils/chordTransposer';

describe('1. Chord Transposition Engine Tests (Music Core Logic)', () => {

  it('1.1 Should transpose basic root notes correctly across semitones', () => {
    expect(getNextKey('C', 2)).toBe('D');
    expect(getNextKey('E', 3)).toBe('G');
    expect(getNextKey('A', 2)).toBe('B');
    expect(getNextKey('B', 1)).toBe('C');
    expect(getNextKey('G', -2)).toBe('F');
  });

  it('1.2 Should transpose complex chords with extensions (7M, m7, b5, 9)', () => {
    expect(transposeChord('C7M', 2)).toBe('D7M');
    expect(transposeChord('E', 3)).toBe('G');
    expect(transposeChord('F#m7(b5)', 2)).toBe('G#m7(b5)');
    expect(transposeChord('Bb9', 2)).toBe('C9');
    expect(transposeChord('C#m7', -2)).toBe('Bm7');
  });

  it('1.3 Should transpose slash chords (bass inversions e.g. D/F#)', () => {
    expect(transposeChord('D/F#', 2)).toBe('E/G#');
    expect(transposeTextChords('[D/F#]', 2)).toBe('[E/G#]');
    expect(transposeTextChords('[C/E]', 3)).toBe('[D#/G]');
  });

  it('1.4 Should transpose bracketed lyrics chord lines correctly', () => {
    const input = '[E] Sobre o trono de glória [B] Tu estás sentado [C#m] vestido de majestade [A]';
    const expectedTransposedBy3 = '[G] Sobre o trono de glória [D] Tu estás sentado [Em] vestido de majestade [C]';
    
    expect(transposeTextChords(input, 3)).toBe(expectedTransposedBy3);
  });

  it('1.5 Edge Case: Should handle empty strings, zero semitones and invalid inputs gracefully', () => {
    expect(transposeTextChords('', 3)).toBe('');
    expect(transposeTextChords('[E] Louvor', 0)).toBe('[E] Louvor');
    expect(transposeChord('PalavraSemNota', 2)).toBe('PalavraSemNota');
  });

  it('1.6 Chromatic Scale Integrity: Should contain all standard keys', () => {
    expect(ALL_KEYS).toContain('C');
    expect(ALL_KEYS).toContain('F#');
    expect(ALL_KEYS).toContain('Bb');
    expect(ALL_KEYS.length).toBe(17);
  });
});
