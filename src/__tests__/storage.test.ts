import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Mocks das camadas Firestore (Fase 4 — ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * SEM ISSO, os testes chamariam o Firestore de PRODUÇÃO de verdade — o
 * `storage.ts` dispara essas funções em segundo plano (fire-and-forget) a
 * cada mutação. `storage.ts` importa `./firebase` (via os módulos
 * `firestoreXxx.ts`), que precisa de `firebase/firestore` mockado também,
 * senão `initializeFirestore` tentaria abrir conexão de verdade.
 */
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: any, name: string) => ({ __name: name })),
  doc: vi.fn((_db: any, name: string, id: string) => ({ __name: name, __id: id })),
  onSnapshot: vi.fn((_ref: any, onNext: any) => {
    onNext({ docs: [], metadata: { hasPendingWrites: false } });
    return () => {};
  }),
  query: vi.fn((...args: any[]) => args),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({}))
}));

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-uid', email: 'teste@tpflame.org', displayName: 'Teste' } },
  googleProvider: {}
}));

vi.mock('../services/firestoreMusicas', () => ({
  addMusicaFirestore: vi.fn().mockResolvedValue(undefined),
  updateMusicaFirestore: vi.fn().mockResolvedValue(undefined),
  deleteMusicaFirestore: vi.fn().mockResolvedValue(undefined),
  getMusicasFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreVersoes', () => ({
  addVersaoFirestore: vi.fn().mockResolvedValue(undefined),
  updateVersaoFirestore: vi.fn().mockResolvedValue(undefined),
  deleteVersaoFirestore: vi.fn().mockResolvedValue(undefined),
  getVersoesFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreArquivos', () => ({
  addArquivoFirestore: vi.fn().mockResolvedValue(undefined),
  updateArquivoFirestore: vi.fn().mockResolvedValue(undefined),
  deleteArquivoFirestore: vi.fn().mockResolvedValue(undefined),
  getArquivosFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreNotas', () => ({
  addNotaFirestore: vi.fn().mockResolvedValue(undefined),
  updateNotaFirestore: vi.fn().mockResolvedValue(undefined),
  deleteNotaFirestore: vi.fn().mockResolvedValue(undefined),
  getNotasFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreCultos', () => ({
  addCultoFirestore: vi.fn().mockResolvedValue(undefined),
  updateCultoFirestore: vi.fn().mockResolvedValue(undefined),
  deleteCultoFirestore: vi.fn().mockResolvedValue(undefined),
  getCultosFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreRepertorio', () => ({
  addRepertorioItemFirestore: vi.fn().mockResolvedValue(undefined),
  updateRepertorioItemFirestore: vi.fn().mockResolvedValue(undefined),
  deleteRepertorioItemFirestore: vi.fn().mockResolvedValue(undefined),
  getRepertorioFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreIntegrantes', () => ({
  addIntegranteFirestore: vi.fn().mockResolvedValue(undefined),
  updateIntegranteFirestore: vi.fn().mockResolvedValue(undefined),
  deleteIntegranteFirestore: vi.fn().mockResolvedValue(undefined),
  getIntegrantesFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreHistorico', () => ({
  getHistoricoFirestore: vi.fn().mockResolvedValue([])
}));
vi.mock('../services/firestoreLogs', () => ({
  addLogFirestore: vi.fn().mockResolvedValue(undefined),
  getLogsFirestore: vi.fn().mockResolvedValue([])
}));

import { storage } from '../services/storage';
import * as fsMusicas from '../services/firestoreMusicas';
import * as fsVersoes from '../services/firestoreVersoes';
import * as fsNotas from '../services/firestoreNotas';
import * as fsArquivos from '../services/firestoreArquivos';
import * as fsCultos from '../services/firestoreCultos';
import * as fsRepertorio from '../services/firestoreRepertorio';

describe('2. Admin (senha local do painel)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('2.1 Senha padrão é "admin" até ser trocada', () => {
    expect(storage.loginAdmin('admin')).toBe(true);
    expect(storage.isAdminLoggedIn()).toBe(true);
  });

  it('2.2 Senha errada não loga', () => {
    expect(storage.loginAdmin('errada')).toBe(false);
    expect(storage.isAdminLoggedIn()).toBe(false);
  });

  it('2.3 Trocar a senha exige a nova senha, não mais a antiga', () => {
    storage.setAdminPassword('nova123');
    expect(storage.loginAdmin('admin')).toBe(false);
    expect(storage.loginAdmin('nova123')).toBe(true);
  });

  it('2.4 Logout derruba a sessão', () => {
    storage.loginAdmin('admin');
    storage.logoutAdmin();
    expect(storage.isAdminLoggedIn()).toBe(false);
  });
});

/**
 * O motor de sincronização mudou de arquitetura (Fase 4): não existe mais
 * fila manual, tombstone nem merge de três vias — o Firestore resolve isso
 * sozinho. O que precisa continuar garantido é o CONTRATO que a UI depende:
 * toda mutação aparece instantaneamente no cache local (síncrono, sem
 * esperar a rede) e a exclusão em cascata continua funcionando.
 */
describe('3. Cache local otimista (contrato que a UI depende)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.stopRealtimeSync();
  });

  it('3.1 addMusicaWithVersao aparece em getMusicas()/getVersoes() na hora, sem esperar promessa', () => {
    const antesQtdMusicas = storage.getMusicas().length;
    const { musica, versao } = storage.addMusicaWithVersao(
      { Nome: 'Vitorioso És', Artista: 'Gabriel Guedes', Categoria: 'Celebração' },
      { Nome_Versao: 'Versão Principal', Tom: 'G', Letra: '[G] teste', Estrutura: 'V1', Obs: '' }
    );

    expect(storage.getMusicas().length).toBe(antesQtdMusicas + 1);
    expect(storage.getMusicas().some((m) => m.ID === musica.ID)).toBe(true);
    expect(storage.getVersoes().some((v) => v.ID === versao.ID && v.ID_Musica === musica.ID)).toBe(true);

    // E a escrita real foi disparada com o MESMO ID gerado localmente —
    // essencial pro listener em tempo real reconciliar sem duplicar.
    expect(fsMusicas.addMusicaFirestore).toHaveBeenCalledWith(
      expect.objectContaining({ Nome: 'Vitorioso És' }),
      musica.ID
    );
    expect(fsVersoes.addVersaoFirestore).toHaveBeenCalledWith(
      expect.objectContaining({ ID_Musica: musica.ID }),
      versao.ID
    );
  });

  it('3.2 updateMusica muda o cache local imediatamente', () => {
    const { musica } = storage.addMusicaWithVersao(
      { Nome: 'Original', Artista: 'Banda', Categoria: 'Adoração' },
      { Nome_Versao: 'V1', Tom: 'C', Letra: '', Estrutura: '', Obs: '' }
    );

    storage.updateMusica(musica.ID, { Nome: 'Editado' });

    expect(storage.getMusicas().find((m) => m.ID === musica.ID)?.Nome).toBe('Editado');
    expect(fsMusicas.updateMusicaFirestore).toHaveBeenCalledWith(musica.ID, { Nome: 'Editado' });
  });

  it('3.3 deleteMusica remove a música em cascata (versões, notas, arquivos, repertório) do cache local', () => {
    const { musica, versao } = storage.addMusicaWithVersao(
      { Nome: 'Vai Ser Excluída', Artista: 'Banda', Categoria: 'Adoração' },
      { Nome_Versao: 'V1', Tom: 'C', Letra: '', Estrutura: '', Obs: '' },
      [{ Instrumento: 'Baixo', Observacao: 'nota de teste' }],
      [{ Tipo: 'Cifra', URL: 'https://exemplo.com' }]
    );
    const culto = storage.addCulto({ Data: '2026-09-10T19:00', Nome_Evento: 'Culto Teste', Status: 'Agendado' });
    const item = storage.addSongToRepertorio(culto.ID, versao.ID);

    storage.deleteMusica(musica.ID);

    expect(storage.getMusicas().some((m) => m.ID === musica.ID)).toBe(false);
    expect(storage.getVersoes().some((v) => v.ID === versao.ID)).toBe(false);
    expect(storage.getNotas().some((n) => n.ID_Versao === versao.ID)).toBe(false);
    expect(storage.getArquivos().some((a) => a.ID_Versao === versao.ID)).toBe(false);
    expect(storage.getRepertorio().some((r) => r.ID === item.ID)).toBe(false);

    // Regressão do bug pego em revisão: os IDs em cascata precisam ser
    // capturados ANTES de filtrar os arrays locais, senão a exclusão real
    // no Firestore nunca é disparada pra notas/arquivos/repertório.
    expect(fsVersoes.deleteVersaoFirestore).toHaveBeenCalledWith(versao.ID);
    expect(fsNotas.deleteNotaFirestore).toHaveBeenCalled();
    expect(fsArquivos.deleteArquivoFirestore).toHaveBeenCalled();
    expect(fsRepertorio.deleteRepertorioItemFirestore).toHaveBeenCalledWith(item.ID);
  });

  it('3.4 deleteCulto remove os itens de repertório daquele culto em cascata', () => {
    const { versao } = storage.addMusicaWithVersao(
      { Nome: 'Musica X', Artista: 'Banda', Categoria: 'Adoração' },
      { Nome_Versao: 'V1', Tom: 'C', Letra: '', Estrutura: '', Obs: '' }
    );
    const culto = storage.addCulto({ Data: '2026-09-11T19:00', Nome_Evento: 'Culto a Excluir', Status: 'Agendado' });
    const item = storage.addSongToRepertorio(culto.ID, versao.ID);

    storage.deleteCulto(culto.ID);

    expect(storage.getCultos().some((c) => c.ID === culto.ID)).toBe(false);
    expect(storage.getRepertorio().some((r) => r.ID === item.ID)).toBe(false);
    expect(fsRepertorio.deleteRepertorioItemFirestore).toHaveBeenCalledWith(item.ID);
    expect(fsCultos.deleteCultoFirestore).toHaveBeenCalledWith(culto.ID);
  });

  it('3.5 addLog aparece na hora em getLogs() e limita a 50 itens', () => {
    for (let i = 0; i < 55; i++) {
      storage.addLog('TESTE_ACAO', `detalhe ${i}`);
    }
    expect(storage.getLogs().length).toBe(50);
    // O mais recente fica primeiro.
    expect(storage.getLogs()[0].Registro_Afetado).toBe('detalhe 54');
  });

  it('3.6 getPendingCount não quebra antes de startRealtimeSync ser chamado', () => {
    expect(storage.getPendingCount()).toBe(0);
  });
});
