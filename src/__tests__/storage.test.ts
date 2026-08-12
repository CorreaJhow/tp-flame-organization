import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

describe('2. Local Storage & Sync Engine Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.resetToDefaults();
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
  });

  it('2.5 Should retrieve cultos and handle pending sync state transitions', () => {
    const cultos = storage.getCultos();
    expect(Array.isArray(cultos)).toBe(true);

    storage.markPendingSync();
    expect(storage.hasPendingSync()).toBe(true);

    storage.clearPendingSync();
    expect(storage.hasPendingSync()).toBe(false);
  });

  it('2.6 Should clear all data when clearAllData is executed', () => {
    storage.clearAllData();
    
    const songs = storage.getMusicas();
    expect(songs.length).toBe(0);
    expect(storage.getGasEndpoint()).toContain('script.google.com');
  });
});
