import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../services/storage';

describe('2. Local Storage & Sync Engine Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.resetToDefaults();
    vi.restoreAllMocks();
  });

  it('2.1 Should return default GAS endpoint URL correctly when no local custom value is stored', () => {
    const endpoint = storage.getGasEndpoint();
    expect(endpoint).toContain('script.google.com/macros/s/AKfycbyM3rjR09i9uFi-JaE1dac3CNbTWEejhmcUdh54A2C6iHzBGndlmR5LEqT2YJN495hI/exec');
  });

  it('2.2 Should allow updating and retrieving custom GAS Endpoint URL', () => {
    const customUrl = 'https://script.google.com/macros/s/CUSTOM_DEPLOYMENT_ID/exec';
    storage.setGasEndpoint(customUrl);
    expect(storage.getGasEndpoint()).toBe(customUrl);
  });

  it('2.3 Should initialize default songs and allow fetching songs list', () => {
    const songs = storage.getMusicas();
    expect(Array.isArray(songs)).toBe(true);
    expect(songs.length).toBeGreaterThan(0);
    expect(songs[0]).toHaveProperty('ID');
    expect(songs[0]).toHaveProperty('Nome');
  });

  it('2.4 Should add a new song with version and set pending sync flag to true', () => {
    const result = storage.addMusicaWithVersao(
      {
        Nome: 'Vitorioso És',
        Artista: 'Gabriel Guedes',
        Categoria: 'Celebração'
      },
      {
        Nome_Versao: 'Versão Principal',
        Tom: 'G',
        Letra: '[G] Vitorioso És [D] Sobre a morte [Em] Venceste [C]',
        Estrutura: 'INTRO - V1 - REFRÃO',
        Obs: 'Tocar forte'
      }
    );

    expect(result.musica.ID).toBeDefined();
    expect(result.musica.Nome).toBe('Vitorioso És');
    expect(result.versao.ID).toBeDefined();
    expect(storage.hasPendingSync()).toBe(true);
    expect(storage.getPendingCount()).toBeGreaterThan(0);
  });

  it('2.5 Should add a new member (Integrante) and preserve locally across sync pulls', async () => {
    // 1. Add new member
    const newMember = storage.addIntegrante({
      Nome: 'Gabriel Pastor',
      Funcao: 'Ministro / Vocal',
      Email: 'gabriel@tpflame.org',
      Telefone: '(11) 99999-8888',
      Ativo: true
    });

    expect(newMember.ID).toBeDefined();
    expect(storage.hasPendingSync()).toBe(true);
    expect(storage.getIntegrantes().some(i => i.Nome === 'Gabriel Pastor')).toBe(true);

    // 2. Simulate GAS returning only initial remote members (simulating older remote sheet)
    global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (typeof url === 'string' && url.includes('action=getAll')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: {
              musicas: [],
              versoes: [],
              integrantes: [
                { ID: 'remote-1', Nome: 'Davi Silva', Funcao: 'Vocal / Violão', Email: 'davi@tpflame.org' }
              ]
            }
          })
        });
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    // 3. Trigger sync
    const syncRes = await storage.syncWithGas();
    expect(syncRes.success).toBe(true);

    // 4. Verify ZERO data loss: locally added member MUST still exist!
    const membersAfterSync = storage.getIntegrantes();
    expect(membersAfterSync.some(i => i.Nome === 'Gabriel Pastor')).toBe(true);
    expect(membersAfterSync.some(i => i.Nome === 'Davi Silva')).toBe(true);
  });

  it('2.6 Should retrieve cultos and handle pending sync queue transitions', () => {
    const cultos = storage.getCultos();
    expect(Array.isArray(cultos)).toBe(true);

    storage.clearSyncQueue();
    expect(storage.hasPendingSync()).toBe(false);

    storage.addCulto({
      Data: '2026-08-15T19:00',
      Nome_Evento: 'Culto Especial',
      Status: 'Agendado'
    });
    expect(storage.hasPendingSync()).toBe(true);
  });

  it('2.7 Should clear all data when clearAllData is executed', () => {
    storage.clearAllData();

    const songs = storage.getMusicas();
    expect(songs.length).toBe(0);
    expect(storage.getGasEndpoint()).toContain('script.google.com');
    expect(storage.hasPendingSync()).toBe(false);
  });
});

/**
 * Invariantes da Fase 1. Cada teste aqui corresponde a um bug que chegou a
 * produção e causou duplicação ou perda de dado. Se algum voltar a falhar,
 * a regressão é de perda de cifra — não é flakiness.
 */
describe('3. Invariantes do motor de sincronização', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.resetToDefaults();
    storage.clearSyncQueue();
    vi.restoreAllMocks();
  });

  it('3.1 Uma mutação enfileira uma vez só e não escreve por fora da fila', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: 'success' }) });
    global.fetch = fetchSpy as any;

    storage.addCulto({
      Data: '2026-09-01T19:00',
      Nome_Evento: 'Culto Teste',
      Status: 'Agendado'
    });

    // O envio é agendado (debounce), nunca disparado de dentro da mutação.
    expect(fetchSpy).not.toHaveBeenCalled();

    const cultoItems = storage.getSyncQueue().filter((q) => q.table === 'Cultos');
    expect(cultoItems.length).toBe(1);
    expect(cultoItems[0].action).toBe('insert');
  });

  it('3.2 Escrita não confirmada mantém o item na fila e conta a tentativa', async () => {
    // Servidor responde 200 mas com status de erro no corpo — exatamente o
    // caso que o modo no-cors tratava como sucesso.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'error', message: 'Planilha ocupada' })
    }) as any;

    storage.addIntegrante({
      Nome: 'Teste Falha',
      Funcao: 'Baixo',
      Email: 'teste@tpflame.org',
      Ativo: true
    });

    const before = storage.getPendingCount();
    expect(before).toBeGreaterThan(0);

    const res = await storage.flushQueue();

    expect(res.pushed).toBe(0);
    expect(res.failed).toBe(before);
    expect(storage.getPendingCount()).toBe(before);
    expect(storage.getSyncQueue().every((q) => (q.attempts || 0) >= 1)).toBe(true);
    expect(storage.getIntegrantes().some((i) => i.Nome === 'Teste Falha')).toBe(true);
  });

  it('3.3 Escrita confirmada remove o item da fila', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success' })
    }) as any;

    storage.addCulto({ Data: '2026-09-02T19:00', Nome_Evento: 'Culto OK', Status: 'Agendado' });
    const before = storage.getPendingCount();

    const res = await storage.flushQueue();

    expect(res.pushed).toBe(before);
    expect(res.failed).toBe(0);
    expect(storage.getPendingCount()).toBe(0);
  });

  it('3.4 Planilha vazia não pode apagar a biblioteca local', async () => {
    storage.addMusicaWithVersao(
      { Nome: 'Cifra Importante', Artista: 'Banda', Categoria: 'Adoração' },
      { Nome_Versao: 'Principal', Tom: 'G', Letra: '[G] teste', Estrutura: 'V1', Obs: '' }
    );

    // Fila drenada com sucesso: sem a trava, o merge não teria nada protegendo
    // as músicas locais quando o pull voltasse vazio.
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('action=getAll')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            data: { musicas: [], versoes: [], integrantes: [], cultos: [] }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success' }) });
    }) as any;

    await storage.syncWithGas();

    expect(storage.getMusicas().some((m) => m.Nome === 'Cifra Importante')).toBe(true);
  });

  it('3.5 Logs de sincronização ficam só no dispositivo', () => {
    storage.clearSyncQueue();

    storage.addLog('GAS_SYNC_SUCCESS', 'sincronizado');
    expect(storage.getSyncQueue().filter((q) => q.table === 'Logs').length).toBe(0);

    storage.addLog('INSERT_MUSICA', 'música criada');
    expect(storage.getSyncQueue().filter((q) => q.table === 'Logs').length).toBe(1);

    // Continua visível localmente nos dois casos.
    expect(storage.getLogs().some((l) => l.Acao === 'GAS_SYNC_SUCCESS')).toBe(true);
  });
});
