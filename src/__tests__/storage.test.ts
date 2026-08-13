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
