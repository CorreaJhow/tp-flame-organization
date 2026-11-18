import { describe, it, expect } from 'vitest';
import { getLastPlayedInfo } from './songHistory';
import { Culto, RepertorioItem, Versao } from '../types';

const v = (ID: string, ID_Musica: string) => ({ ID, ID_Musica }) as Versao;
const hoje = new Date().toISOString().slice(0, 10);

describe('getLastPlayedInfo', () => {
  const cultos = [{ ID: 'c1', Data: hoje, Nome_Evento: 'Culto' } as Culto];
  const rep = [{ ID: 'r1', ID_Culto: 'c1', ID_Versao: 'orig', Ordem: 1 } as RepertorioItem];
  const versoes = [v('orig', 'm1'), v('meio-tom', 'm1'), v('outra', 'm2')];

  it('versão duplicada herda a última execução da versão original', () => {
    expect(getLastPlayedInfo('meio-tom', cultos, rep, [], versoes).daysAgo).toBe(0);
  });
  it('outra música não é afetada', () => {
    expect(getLastPlayedInfo('outra', cultos, rep, [], versoes).formattedBadge).toBe('Nunca Tocada');
  });
});
