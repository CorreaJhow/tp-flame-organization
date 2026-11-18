import { describe, it, expect } from 'vitest';
import { keyOffset } from './chordTransposer';

describe('keyOffset', () => {
  it('lá → ré = 5 semitons; igual = 0; desconhecido = 0', () => {
    expect(keyOffset('A', 'D')).toBe(5);
    expect(keyOffset('A', 'A')).toBe(0);
    expect(keyOffset('A', '')).toBe(0);
  });
});
