import { describe, it, expect } from 'vitest';
import { matchMusica, sortMusicasAZ } from './songSearch';
import { Musica, Versao } from '../types';

const m = (Nome: string) => ({ ID: Nome, Nome, Artista: 'X', Categoria: 'Adoração' }) as Musica;
const v = (Letra: string) => ({ ID: 'v', ID_Musica: 'a', Nome_Versao: 'Original', Tom: 'A', Letra }) as Versao;

describe('songSearch', () => {
  it('ordena A-Z ignorando acento e caixa', () => {
    expect(sortMusicasAZ([m('Zélia'), m('árvore'), m('Bom')]).map((x) => x.Nome)).toEqual(['árvore', 'Bom', 'Zélia']);
  });
  it('acha pelo nome sem acento', () => {
    expect(matchMusica(m('Construção'), [], 'construcao')).toEqual({});
  });
  it('acha na letra ignorando acordes e devolve trecho', () => {
    const r = matchMusica(m('Eu Vou Construir'), [v('[A]Sobre a [D]rocha firmei meu chão')], 'rocha firmei');
    expect(r?.trecho).toContain('rocha firmei');
  });
  it('não acha o que não existe', () => {
    expect(matchMusica(m('Bom'), [v('abc')], 'zzz')).toBeNull();
  });
});
