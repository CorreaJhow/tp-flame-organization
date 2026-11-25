import { describe, it, expect } from 'vitest';
import { getLastPlayedInfo, getExecucoes, formatarData } from './songHistory';
import { Culto, HistoricoItem, RepertorioItem, Versao } from '../types';

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

describe('getExecucoes', () => {
  const vs = [
    { ID: 'orig', ID_Musica: 'm1', Tom: 'B', Modo: 'Menor' } as Versao,
    { ID: 'outra', ID_Musica: 'm2', Tom: 'C' } as Versao
  ];
  const cultos = [
    { ID: 'c1', Data: '2026-11-01', Nome_Evento: 'Culto 1' },
    { ID: 'c2', Data: '2026-10-01', Nome_Evento: 'Culto 2' },
    { ID: 'cx', Data: '2026-11-10', Nome_Evento: 'Cancelado', Status: 'Cancelado' }
  ] as Culto[];
  const rep = [
    { ID: 'r1', ID_Culto: 'c1', ID_Versao: 'orig', Ordem: 1, Tom_Culto: 'A' },
    { ID: 'r2', ID_Culto: 'c2', ID_Versao: 'orig', Ordem: 1 },
    { ID: 'r3', ID_Culto: 'cx', ID_Versao: 'orig', Ordem: 1 },
    { ID: 'r4', ID_Culto: 'c1', ID_Versao: 'outra', Ordem: 2 }
  ] as RepertorioItem[];
  const h = (x: Partial<HistoricoItem>) => ({ ID: 'h', ID_Versao: 'orig', Data_Execucao: '2026-09-01', ...x }) as HistoricoItem;

  it('ordena por data, tom diferente vs original, cancelado fora', () => {
    const r = getExecucoes('orig', cultos, rep, [], vs, new Date('2026-11-25'));
    expect(r.map((e) => e.cultoId)).toEqual(['c1', 'c2']);
    expect(r[0]).toMatchObject({ tom: 'A', tomOriginal: false, tomFormatado: 'Am' });
    expect(r[1]).toMatchObject({ tom: 'B', tomOriginal: true, tomFormatado: 'Bm' });
  });
  it('registro manual no mesmo culto do repertório conta uma vez só', () => {
    const r = getExecucoes('orig', cultos, rep, [h({ ID: 'h1', ID_Culto: 'c1', Data_Execucao: '2026-11-01' })], vs, new Date('2026-11-25'));
    expect(r.filter((e) => e.cultoId === 'c1')).toHaveLength(1);
  });
  it('manual sem culto entra, ordenado, com tom e evento; excluído e cancelado ficam fora', () => {
    const hist = [
      h({ ID: 'h2', Data_Execucao: '2026-10-15', Tom_Tocado: 'G', Evento: 'Retiro' }),
      h({ ID: 'h3', Data_Execucao: '2026-10-20', Excluido_Em: '2026-10-21' }),
      h({ ID: 'h4', ID_Culto: 'cx', Data_Execucao: '2026-11-10' })
    ];
    const r = getExecucoes('orig', cultos, rep, hist, vs, new Date('2026-11-25'));
    expect(r.map((e) => e.key)).toEqual(['r:r1', 'h:h2', 'r:r2']);
    expect(r[1]).toMatchObject({ evento: 'Retiro', tom: 'G', tomOriginal: false });
  });
  it('selo mostra o tom da última execução', () => {
    const d = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const hist = [h({ Data_Execucao: d, Tom_Tocado: 'E' })];
    expect(getLastPlayedInfo('orig', [], [], hist, vs).formattedBadge).toMatch(/^Tocada há 2 semanas \(.*\), em Em$/);
  });
  it('formatarData não desloca o dia', () => {
    expect(formatarData('2026-11-01')).toBe('01/11/2026');
  });
});
