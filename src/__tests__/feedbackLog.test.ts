import { describe, it, expect } from 'vitest';
import { formatBug, formatMusica, formatSugestao, normalizeMusicLink, parseFeedback } from '../utils/feedbackLog';

describe('formato dos feedbacks', () => {
  it('monta os prefixos', () => {
    expect(formatSugestao('melhoria', 'Ana', 'Ideia')).toBe('[SUGESTAO:MELHORIA] De: Ana - Ideia');
    expect(formatSugestao('outra', '', 'Ideia')).toBe('[SUGESTAO:OUTRA] Ideia');
    expect(formatBug('', 'Quebrou')).toBe('[BUG] Quebrou');
  });

  it('lê de volta o que monta', () => {
    expect(parseFeedback(formatSugestao('melhoria', 'Ana', 'Ideia'))).toEqual({ kind: 'melhoria', de: 'Ana', mensagem: 'Ideia' });
    expect(parseFeedback(formatSugestao('outra', '', 'Ideia'))).toEqual({ kind: 'outra', mensagem: 'Ideia' });
    expect(parseFeedback(formatBug('Ana', 'Quebrou'))).toEqual({ kind: 'bug', de: 'Ana', mensagem: 'Quebrou' });
  });

  it('registros antigos continuam legíveis', () => {
    expect(parseFeedback('[SUGESTAO] De: Gabriel (Violão) - Contagem regressiva')).toEqual({
      kind: 'sugestao',
      de: 'Gabriel (Violão)',
      mensagem: 'Contagem regressiva'
    });
    expect(parseFeedback('[BUG] tela preta')).toEqual({ kind: 'bug', mensagem: 'tela preta' });
  });

  it('música guarda nome, autor e link, mesmo com " - " no nome', () => {
    const link = 'https://youtu.be/abc123';
    expect(parseFeedback(formatMusica('Larissa', 'Santo - Ao Vivo', link))).toEqual({
      kind: 'musica',
      de: 'Larissa',
      musica: 'Santo - Ao Vivo',
      link,
      mensagem: link
    });
  });

  it('link fora da lista gravado no log não vira clicável', () => {
    const parsed = parseFeedback('[MUSICA] De: X - Nome: Y - Link: javascript:alert(1)');
    expect(parsed.link).toBeUndefined();
  });

  it('prefixo desconhecido mostra o texto original', () => {
    expect(parseFeedback('texto solto')).toEqual({ kind: 'desconhecido', mensagem: 'texto solto' });
    expect(parseFeedback('[OUTRO] x')).toEqual({ kind: 'desconhecido', mensagem: '[OUTRO] x' });
  });
});

describe('normalizeMusicLink', () => {
  it.each([
    'https://www.youtube.com/watch?v=abc',
    'https://youtu.be/abc',
    'https://music.youtube.com/watch?v=abc',
    'https://m.youtube.com/watch?v=abc',
    'https://open.spotify.com/track/abc',
    'https://spotify.link/abc'
  ])('aceita %s', (url) => expect(normalizeMusicLink(url)).toBe(url));

  it('completa o https quando falta', () => {
    expect(normalizeMusicLink('youtu.be/abc')).toBe('https://youtu.be/abc');
  });

  it.each([
    '',
    'não é link',
    'https://example.com/musica',
    'https://youtube.com.golpe.com/watch',
    'javascript:alert(1)',
    'ftp://youtu.be/abc',
    'https://www.youtube.com/'
  ])('recusa "%s"', (url) => expect(normalizeMusicLink(url)).toBeNull());
});
