import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushTableActionToGoogleSheets } from '../services/googleSheetsApi';

/**
 * Cobertura do caminho OAuth direto (Google Sheets API v4).
 *
 * Diferente do Apps Script, a Sheets API não tem noção de "conflito" —
 * pushTableActionToGoogleSheets precisa comparar o Atualizado_Em na mão,
 * no cliente, antes de decidir se sobrescreve uma linha. Sem teste dedicado,
 * um erro nessa comparação (índice de coluna errado, comparação de data
 * invertida) passaria despercebido pela suíte de storage.test.ts, que só
 * exercita este arquivo indiretamente e só quando getAccessToken() devolve
 * um token real — o que nunca acontece em ambiente de teste.
 */
describe('googleSheetsApi — pushTableActionToGoogleSheets', () => {
  const HEADERS = ['ID', 'Nome', 'Artista', 'Categoria', 'Atualizado_Em', 'Atualizado_Por', 'Excluido_Em'];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockReadThenAction(existingRow: any[], actionMock: (url: string, opts: any) => any) {
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === undefined || opts?.method === 'GET') {
        // Leitura da aba inteira para localizar a linha pelo ID.
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ values: [HEADERS, existingRow] })
        });
      }
      return Promise.resolve(actionMock(url, opts));
    }) as any;
  }

  it('recusa a escrita quando a linha na planilha é mais recente que o payload (conflito)', async () => {
    const putSpy = vi.fn();
    mockReadThenAction(
      ['id-1', 'Nome Antigo', 'Artista', 'Adoração', '2026-08-21T18:00:00.000Z', 'Pedro', ''],
      (url, opts) => { putSpy(url, opts); return { ok: true }; }
    );

    const result = await pushTableActionToGoogleSheets('token', 'sheet-id', 'Musicas', 'update', {
      ID: 'id-1',
      Nome: 'Minha edição atrasada',
      Artista: 'Artista',
      Categoria: 'Adoração',
      Atualizado_Em: '2026-08-21T17:00:00.000Z', // mais antigo que o remoto
      Atualizado_Por: 'Ana'
    });

    expect(result).toBe('conflict');
    expect(putSpy).not.toHaveBeenCalled(); // a escrita nunca foi tentada
  });

  it('aceita a escrita quando o payload é mais recente que a linha na planilha', async () => {
    const putSpy = vi.fn();
    mockReadThenAction(
      ['id-1', 'Nome Antigo', 'Artista', 'Adoração', '2026-08-21T17:00:00.000Z', 'Pedro', ''],
      (url, opts) => { putSpy(url, opts); return { ok: true }; }
    );

    const result = await pushTableActionToGoogleSheets('token', 'sheet-id', 'Musicas', 'update', {
      ID: 'id-1',
      Nome: 'Edição nova de verdade',
      Artista: 'Artista',
      Categoria: 'Adoração',
      Atualizado_Em: '2026-08-21T18:00:00.000Z', // mais novo que o remoto
      Atualizado_Por: 'Ana'
    });

    expect(result).toBe('ok');
    expect(putSpy).toHaveBeenCalledTimes(1);
  });

  it('grava normalmente quando faltar Atualizado_Em em qualquer um dos lados', async () => {
    const putSpy = vi.fn();
    mockReadThenAction(
      ['id-1', 'Nome Antigo', 'Artista', 'Adoração', '', 'Pedro', ''], // remoto sem timestamp
      (url, opts) => { putSpy(url, opts); return { ok: true }; }
    );

    const result = await pushTableActionToGoogleSheets('token', 'sheet-id', 'Musicas', 'update', {
      ID: 'id-1',
      Nome: 'Edição',
      Atualizado_Em: '2026-08-21T18:00:00.000Z',
      Atualizado_Por: 'Ana'
    });

    expect(result).toBe('ok');
    expect(putSpy).toHaveBeenCalledTimes(1);
  });
});
