import { describe, it, expect } from 'vitest';
import { isCultoEncerrado, sortCultos } from '../utils/cultoOrder';
import { Culto } from '../types';

const culto = (ID: string, Data: string, Status: string = 'Agendado') =>
  ({ ID, Data, Status, Nome_Evento: ID }) as Culto;

const AGORA = new Date(2026, 10, 2, 21, 0); // 02/11/2026 21h

describe('sortCultos', () => {
  it('próximos, sem data e encerrados, cada grupo na ordem certa', () => {
    const lista = [
      culto('concluido-setembro', '2026-09-12T19:00', 'Concluído'),
      culto('futuro-longe', '2026-12-20T19:00'),
      culto('passado-sem-status', '2026-10-25T19:00', 'Confirmado'),
      culto('sem-data', ''),
      culto('futuro-perto', '2026-11-08T19:00', 'Confirmado')
    ];
    expect(sortCultos(lista, AGORA).map((c) => c.ID)).toEqual([
      'futuro-perto',
      'futuro-longe',
      'sem-data',
      'passado-sem-status',
      'concluido-setembro'
    ]);
  });

  it('não altera a lista original', () => {
    const lista = [culto('b', '2026-12-01T19:00'), culto('a', '2026-11-10T19:00')];
    sortCultos(lista, AGORA);
    expect(lista[0].ID).toBe('b');
  });
});

describe('isCultoEncerrado', () => {
  it('culto de hoje continua aberto depois do horário', () => {
    expect(isCultoEncerrado(culto('hoje', '2026-11-02T19:00'), AGORA)).toBe(false);
  });

  it('data sem hora de hoje não vira ontem por causa do fuso', () => {
    expect(isCultoEncerrado(culto('hoje', '2026-11-02'), AGORA)).toBe(false);
  });

  it('data passada encerra', () => {
    expect(isCultoEncerrado(culto('ontem', '2026-11-01T23:00'), AGORA)).toBe(true);
  });

  it.each(['Concluído', 'Realizado', 'Cancelado'])('status %s encerra mesmo com data futura', (status) => {
    expect(isCultoEncerrado(culto('x', '2026-12-01T19:00', status), AGORA)).toBe(true);
  });

  it.each(['Agendado', 'Em Preparação', 'Confirmado', 'Planejamento'])('status %s com data futura não encerra', (status) => {
    expect(isCultoEncerrado(culto('x', '2026-12-01T19:00', status), AGORA)).toBe(false);
  });
});
