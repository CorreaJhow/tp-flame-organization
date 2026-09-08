/**
 * Camada de dados unificada do TP Flame (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * Reescrita em 08/09/2026: o backend deixou de ser Google Sheets/Apps
 * Script e passou a ser Firestore. Decisões explícitas do usuário nessa
 * migração (registradas no plano):
 *   - Conflito de edição: padrão do Firestore (última escrita vence), sem
 *     a lógica customizada de comparar `Atualizado_Em` que existia antes.
 *   - Identidade de quem editou: vem do login real (Firebase Auth), não
 *     mais de um seletor manual "quem sou eu" (MemberProfileModal, removido
 *     por estar órfão e por essa razão).
 *   - Fila de sincronização manual, tombstones e merge de três vias: TODOS
 *     removidos. O Firestore já resolve isso sozinho, com cache offline
 *     nativo (ver `persistentLocalCache` em `firebase.ts`) — manter a
 *     lógica antiga por cima seria duplicar o que o SDK já faz.
 *
 * ARQUITETURA: cada tabela (`getMusicas()`, `getCultos()`, ...) continua
 * síncrona, exatamente como os componentes de UI já esperam — nenhum deles
 * precisou mudar. Por baixo, um cache em memória por tabela é mantido
 * atualizado por listeners em tempo real do Firestore (`onSnapshot`,
 * chamado uma vez via `startRealtimeSync()` depois do login). Toda mutação
 * (`addCulto`, `updateMusica`, ...) atualiza o cache local OTIMISTICAMENTE
 * (resposta instantânea na tela, igual ao comportamento de sempre) e dispara
 * a escrita real no Firestore em paralelo — que, quando confirmada pelo
 * listener, apenas reconcilia o mesmo registro (mesmo ID gerado no
 * cliente), sem duplicar nada.
 */
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { generateUUID } from './firestoreUtils';
import {
  Musica, Versao, Arquivo, Nota, Culto, RepertorioItem, Integrante, HistoricoItem, LogItem
} from '../types';

import * as fsMusicas from './firestoreMusicas';
import * as fsVersoes from './firestoreVersoes';
import * as fsArquivos from './firestoreArquivos';
import * as fsNotas from './firestoreNotas';
import * as fsCultos from './firestoreCultos';
import * as fsRepertorio from './firestoreRepertorio';
import * as fsIntegrantes from './firestoreIntegrantes';
import * as fsHistorico from './firestoreHistorico';
import * as fsLogs from './firestoreLogs';

// Reexportado por compatibilidade — código antigo que ainda importa
// `generateUUID` de `storage.ts` (em vez de `firestoreUtils.ts`) continua
// funcionando sem mudar nada.
export { generateUUID };

class StorageService {
  // ==========================================
  // CACHE EM MEMÓRIA (fonte de verdade síncrona pra UI)
  // ==========================================
  private musicas: Musica[] = [];
  private versoes: Versao[] = [];
  private arquivos: Arquivo[] = [];
  private notas: Nota[] = [];
  private cultos: Culto[] = [];
  private repertorio: RepertorioItem[] = [];
  private integrantes: Integrante[] = [];
  private historico: HistoricoItem[] = [];
  private logs: LogItem[] = [];

  private unsubscribers: Unsubscribe[] = [];
  private pendingByCollection: Record<string, boolean> = {};
  private onChangeCallback: (() => void) | null = null;
  private isListening = false;

  private notify() {
    this.onChangeCallback?.();
  }

  // ==========================================
  // SINCRONIZAÇÃO EM TEMPO REAL
  // ==========================================

  /**
   * Liga os listeners do Firestore pras 9 tabelas (Config fica de fora —
   * vestigial, sem tela que use). Precisa ser chamado só depois de
   * autenticado (as Security Rules recusam listener sem login válido).
   * Idempotente: chamar de novo com o app já ouvindo não faz nada.
   *
   * `onPermissionDenied` existe porque login e permissão são coisas
   * diferentes: o Firebase Auth deixa qualquer conta Google entrar, mas as
   * Security Rules só liberam LER dado pra quem estiver na allowlist de
   * e-mail. Sem isso, alguém fora da lista logava normalmente e via o app
   * inteiro vazio, sem entender por quê — parecia banco de dados quebrado,
   * não "sem permissão". Chamado no máximo uma vez por sessão de listener
   * (qualquer uma das 9 tabelas que barrar já é suficiente pra saber).
   */
  public startRealtimeSync(onChange: () => void, onPermissionDenied?: () => void) {
    if (this.isListening) return;
    this.isListening = true;
    this.onChangeCallback = onChange;
    let permissionDeniedJaAvisado = false;

    const subscribe = <T extends { Excluido_Em?: string }>(
      collectionName: string,
      assign: (items: T[]) => void
    ) => {
      const unsub = onSnapshot(
        collection(db, collectionName),
        (snap) => {
          const items = snap.docs
            .map((d) => d.data() as T)
            .filter((item) => !item.Excluido_Em);
          assign(items);
          this.pendingByCollection[collectionName] = snap.metadata.hasPendingWrites;
          this.notify();
        },
        (err: any) => {
          console.warn(`[firestore] Erro no listener de "${collectionName}":`, err);
          if (err?.code === 'permission-denied' && !permissionDeniedJaAvisado) {
            permissionDeniedJaAvisado = true;
            onPermissionDenied?.();
          }
        }
      );
      this.unsubscribers.push(unsub);
    };

    subscribe<Musica>('musicas', (v) => { this.musicas = v; });
    subscribe<Versao>('versoes', (v) => { this.versoes = v; });
    subscribe<Arquivo>('arquivos', (v) => { this.arquivos = v; });
    subscribe<Nota>('notas', (v) => { this.notas = v; });
    subscribe<Culto>('cultos', (v) => { this.cultos = v; });
    subscribe<RepertorioItem>('repertorio', (v) => { this.repertorio = v; });
    subscribe<Integrante>('integrantes', (v) => { this.integrantes = v; });
    subscribe<HistoricoItem>('historico', (v) => { this.historico = v; });

    // Logs: imutável, ordenado, sem filtro de Excluido_Em (não existe).
    const logsUnsub = onSnapshot(
      query(collection(db, 'logs'), orderBy('Data', 'desc'), limit(50)),
      (snap) => {
        this.logs = snap.docs.map((d) => d.data() as LogItem);
        this.notify();
      },
      (err: any) => {
        console.warn('[firestore] Erro no listener de "logs":', err);
        if (err?.code === 'permission-denied' && !permissionDeniedJaAvisado) {
          permissionDeniedJaAvisado = true;
          onPermissionDenied?.();
        }
      }
    );
    this.unsubscribers.push(logsUnsub);
  }

  /** Desliga todos os listeners — chamado no logout ou ao desmontar o app. */
  public stopRealtimeSync() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.isListening = false;
    this.onChangeCallback = null;
    this.musicas = [];
    this.versoes = [];
    this.arquivos = [];
    this.notas = [];
    this.cultos = [];
    this.repertorio = [];
    this.integrantes = [];
    this.historico = [];
    this.logs = [];
    this.pendingByCollection = {};
  }

  /**
   * Quantas tabelas têm escrita local ainda não confirmada pelo servidor
   * (`hasPendingWrites` de cada listener). Não é uma contagem de itens como
   * antes (a fila manual não existe mais) — é "quantas tabelas estão
   * syncing agora", suficiente pro badge do Header continuar fazendo sentido.
   */
  public getPendingCount(): number {
    return Object.values(this.pendingByCollection).filter(Boolean).length;
  }

  /**
   * Compatibilidade com o botão manual de sincronizar do Header: como o
   * Firestore já mantém tudo atualizado sozinho em tempo real, não existe
   * mais um "pull" de verdade pra disparar — isso só resolve depois de
   * confirmar que os listeners estão de pé.
   */
  public async syncWithGas(): Promise<{
    success: boolean;
    message?: string;
    pushedCount: number;
    pulledCount: number;
    conflictCount: number;
  }> {
    return { success: this.isListening, pushedCount: 0, pulledCount: 0, conflictCount: 0 };
  }

  // ==========================================
  // ADMIN (senha local do painel — sem relação com quem pode usar o app,
  // isso já é decidido pelas Security Rules / allowlist de e-mail)
  // ==========================================

  public getAdminPassword(): string {
    return localStorage.getItem('tp_flame_admin_pass_v1') || 'admin';
  }

  public setAdminPassword(pass: string) {
    localStorage.setItem('tp_flame_admin_pass_v1', pass.trim());
  }

  public isAdminLoggedIn(): boolean {
    return sessionStorage.getItem('tp_flame_admin_auth_v1') === 'true';
  }

  public loginAdmin(passwordAttempt: string): boolean {
    if (passwordAttempt.trim() === this.getAdminPassword()) {
      sessionStorage.setItem('tp_flame_admin_auth_v1', 'true');
      return true;
    }
    return false;
  }

  public logoutAdmin() {
    sessionStorage.removeItem('tp_flame_admin_auth_v1');
  }

  // ==========================================
  // LOGS
  // ==========================================

  public getLogs(): LogItem[] {
    return this.logs;
  }

  public addLog(action: string, detail: string, usuario?: string) {
    const id = generateUUID();
    const optimistic: LogItem = {
      ID: id,
      Data: new Date().toISOString(),
      Usuario: usuario || 'Usuário desconhecido',
      Acao: action,
      Registro_Afetado: detail
    };
    this.logs = [optimistic, ...this.logs].slice(0, 50);
    this.notify();

    fsLogs.addLogFirestore(action, detail, usuario, id).catch((err) => {
      console.warn('[storage] Falha ao gravar log no Firestore:', err);
    });
  }

  // ==========================================
  // MUSICAS & VERSOES
  // ==========================================

  public getMusicas(): Musica[] { return this.musicas; }
  public getVersoes(): Versao[] { return this.versoes; }
  public getArquivos(): Arquivo[] { return this.arquivos; }
  public getNotas(): Nota[] { return this.notas; }

  public addMusicaWithVersao(
    musicaData: Omit<Musica, 'ID'>,
    versaoData: Omit<Versao, 'ID' | 'ID_Musica'>,
    notasData?: Omit<Nota, 'ID' | 'ID_Versao'>[],
    arquivosData?: Omit<Arquivo, 'ID' | 'ID_Versao'>[]
  ): { musica: Musica; versao: Versao } {
    const musicaId = generateUUID();
    const versaoId = generateUUID();

    const newMusica: Musica = { ...musicaData, ID: musicaId };
    const newVersao: Versao = { ...versaoData, ID: versaoId, ID_Musica: musicaId };

    this.musicas = [newMusica, ...this.musicas];
    this.versoes = [newVersao, ...this.versoes];

    fsMusicas.addMusicaFirestore(
      { Nome: newMusica.Nome, Artista: newMusica.Artista, Categoria: newMusica.Categoria },
      musicaId
    ).catch((err) => console.warn('[storage] Falha ao criar música no Firestore:', err));

    fsVersoes.addVersaoFirestore(
      {
        ID_Musica: musicaId,
        Nome_Versao: newVersao.Nome_Versao,
        Tom: newVersao.Tom,
        Modo: newVersao.Modo,
        BPM: newVersao.BPM,
        Compasso: newVersao.Compasso,
        Letra: newVersao.Letra,
        Estrutura: newVersao.Estrutura,
        Obs: newVersao.Obs
      },
      versaoId
    ).catch((err) => console.warn('[storage] Falha ao criar versão no Firestore:', err));

    if (notasData && notasData.length > 0) {
      const newNotas = notasData.map((n) => ({ ...n, ID: generateUUID(), ID_Versao: versaoId }));
      this.notas = [...this.notas, ...newNotas];
      newNotas.forEach((n) => {
        fsNotas.addNotaFirestore(
          { ID_Versao: n.ID_Versao, Instrumento: n.Instrumento, Observacao: n.Observacao, Autor: n.Autor, Titulo: n.Titulo, TipoNota: n.TipoNota },
          n.ID
        ).catch((err) => console.warn('[storage] Falha ao criar nota no Firestore:', err));
      });
    }

    if (arquivosData && arquivosData.length > 0) {
      const newArquivos = arquivosData.map((a) => ({ ...a, ID: generateUUID(), ID_Versao: versaoId }));
      this.arquivos = [...this.arquivos, ...newArquivos];
      newArquivos.forEach((a) => {
        fsArquivos.addArquivoFirestore(
          { ID_Versao: a.ID_Versao, Tipo: a.Tipo, URL: a.URL, Nome: a.Nome },
          a.ID
        ).catch((err) => console.warn('[storage] Falha ao criar arquivo no Firestore:', err));
      });
    }

    this.notify();
    this.addLog('INSERT_MUSICA', `Música "${newMusica.Nome}" criada`);
    return { musica: newMusica, versao: newVersao };
  }

  public addNota(notaData: Omit<Nota, 'ID'>): Nota {
    const id = generateUUID();
    const newNota: Nota = { ...notaData, ID: id };
    this.notas = [...this.notas, newNota];
    this.notify();

    fsNotas.addNotaFirestore(
      { ID_Versao: newNota.ID_Versao, Instrumento: newNota.Instrumento, Observacao: newNota.Observacao, Autor: newNota.Autor, Titulo: newNota.Titulo, TipoNota: newNota.TipoNota },
      id
    ).catch((err) => console.warn('[storage] Falha ao criar nota no Firestore:', err));

    this.addLog('INSERT_NOTA', `Nota para ${newNota.Instrumento} inserida`);
    return newNota;
  }

  public addArquivo(arquivoData: Omit<Arquivo, 'ID'>): Arquivo {
    const id = generateUUID();
    const newArquivo: Arquivo = { ...arquivoData, ID: id };
    this.arquivos = [...this.arquivos, newArquivo];
    this.notify();

    fsArquivos.addArquivoFirestore(
      { ID_Versao: newArquivo.ID_Versao, Tipo: newArquivo.Tipo, URL: newArquivo.URL, Nome: newArquivo.Nome },
      id
    ).catch((err) => console.warn('[storage] Falha ao criar arquivo no Firestore:', err));

    this.addLog('INSERT_ARQUIVO', `Anexo ${newArquivo.Tipo} adicionado`);
    return newArquivo;
  }

  public updateMusica(id: string, data: Partial<Musica>) {
    const index = this.musicas.findIndex((m) => m.ID === id);
    if (index === -1) return;
    this.musicas = this.musicas.map((m) => (m.ID === id ? { ...m, ...data } : m));
    this.notify();

    fsMusicas.updateMusicaFirestore(id, data).catch((err) =>
      console.warn('[storage] Falha ao atualizar música no Firestore:', err)
    );
    this.addLog('UPDATE_MUSICA', `Música "${this.musicas[index].Nome}" atualizada`);
  }

  public updateVersao(id: string, data: Partial<Versao>) {
    const index = this.versoes.findIndex((v) => v.ID === id);
    if (index === -1) return;
    this.versoes = this.versoes.map((v) => (v.ID === id ? { ...v, ...data } : v));
    this.notify();

    fsVersoes.updateVersaoFirestore(id, data).catch((err) =>
      console.warn('[storage] Falha ao atualizar versão no Firestore:', err)
    );
    this.addLog('UPDATE_VERSAO', `Versão "${this.versoes[index].Nome_Versao}" atualizada`);
  }

  public updateNota(id: string, data: Partial<Nota>) {
    const index = this.notas.findIndex((n) => n.ID === id);
    if (index === -1) return;
    this.notas = this.notas.map((n) => (n.ID === id ? { ...n, ...data } : n));
    this.notify();

    fsNotas.updateNotaFirestore(id, data).catch((err) =>
      console.warn('[storage] Falha ao atualizar nota no Firestore:', err)
    );
    this.addLog('UPDATE_NOTA', `Nota/Cifra para ${this.notas[index].Instrumento} atualizada`);
  }

  public deleteMusica(id: string) {
    // IMPORTANTE: capturar todos os IDs em cascata ANTES de filtrar os
    // arrays locais — senão os helpers abaixo leriam os arrays já vazios
    // do registro que acabou de sumir, e a exclusão em cascata no Firestore
    // nunca aconteceria (bug pego em revisão antes do primeiro teste).
    const versaoIds = this.versoes.filter((v) => v.ID_Musica === id).map((v) => v.ID);
    const notaIds = this.getNotasIdsParaExcluirEmCascata(versaoIds);
    const arquivoIds = this.getArquivosIdsParaExcluirEmCascata(versaoIds);
    const repertorioIds = this.getRepertorioIdsParaExcluirEmCascata(undefined, versaoIds);

    this.musicas = this.musicas.filter((m) => m.ID !== id);
    this.versoes = this.versoes.filter((v) => v.ID_Musica !== id);
    this.notas = this.notas.filter((n) => !versaoIds.includes(n.ID_Versao));
    this.arquivos = this.arquivos.filter((a) => !versaoIds.includes(a.ID_Versao));
    this.repertorio = this.repertorio.filter((r) => !versaoIds.includes(r.ID_Versao));
    this.notify();

    fsMusicas.deleteMusicaFirestore(id).catch((err) => console.warn('[storage] Falha ao excluir música:', err));
    versaoIds.forEach((vId) =>
      fsVersoes.deleteVersaoFirestore(vId).catch((err) => console.warn('[storage] Falha ao excluir versão em cascata:', err))
    );
    notaIds.forEach((nId) =>
      fsNotas.deleteNotaFirestore(nId).catch((err) => console.warn('[storage] Falha ao excluir nota em cascata:', err))
    );
    arquivoIds.forEach((aId) =>
      fsArquivos.deleteArquivoFirestore(aId).catch((err) => console.warn('[storage] Falha ao excluir arquivo em cascata:', err))
    );
    repertorioIds.forEach((rId) =>
      fsRepertorio.deleteRepertorioItemFirestore(rId).catch((err) => console.warn('[storage] Falha ao excluir item de repertório em cascata:', err))
    );

    this.addLog('DELETE_MUSICA', `Música ID ${id} excluída`);
  }

  public deleteVersao(id: string) {
    // Mesmo cuidado de deleteMusica: capturar antes de filtrar.
    const notaIds = this.notas.filter((n) => n.ID_Versao === id).map((n) => n.ID);
    const arquivoIds = this.arquivos.filter((a) => a.ID_Versao === id).map((a) => a.ID);
    const repertorioIds = this.repertorio.filter((r) => r.ID_Versao === id).map((r) => r.ID);

    this.versoes = this.versoes.filter((v) => v.ID !== id);
    this.notas = this.notas.filter((n) => n.ID_Versao !== id);
    this.arquivos = this.arquivos.filter((a) => a.ID_Versao !== id);
    this.repertorio = this.repertorio.filter((r) => r.ID_Versao !== id);
    this.notify();

    fsVersoes.deleteVersaoFirestore(id).catch((err) => console.warn('[storage] Falha ao excluir versão:', err));
    notaIds.forEach((nId) => fsNotas.deleteNotaFirestore(nId).catch((err) => console.warn('[storage] Falha ao excluir nota em cascata:', err)));
    arquivoIds.forEach((aId) => fsArquivos.deleteArquivoFirestore(aId).catch((err) => console.warn('[storage] Falha ao excluir arquivo em cascata:', err)));
    repertorioIds.forEach((rId) => fsRepertorio.deleteRepertorioItemFirestore(rId).catch((err) => console.warn('[storage] Falha ao excluir item de repertório em cascata:', err)));

    this.addLog('DELETE_VERSAO', `Versão ID ${id} excluída`);
  }

  public deleteNota(id: string) {
    this.notas = this.notas.filter((n) => n.ID !== id);
    this.notify();
    fsNotas.deleteNotaFirestore(id).catch((err) => console.warn('[storage] Falha ao excluir nota:', err));
    this.addLog('DELETE_NOTA', 'Nota removida');
  }

  public deleteArquivo(id: string) {
    this.arquivos = this.arquivos.filter((a) => a.ID !== id);
    this.notify();
    fsArquivos.deleteArquivoFirestore(id).catch((err) => console.warn('[storage] Falha ao excluir arquivo:', err));
    this.addLog('DELETE_ARQUIVO', 'Anexo removido');
  }

  // Pequenos helpers só pra deixar deleteMusica legível (evita recomputar
  // os mesmos filtros três vezes com nomes genéricos soltos no meio do método).
  private getNotasIdsParaExcluirEmCascata(versaoIds: string[]): string[] {
    return this.notas.filter((n) => versaoIds.includes(n.ID_Versao)).map((n) => n.ID);
  }
  private getArquivosIdsParaExcluirEmCascata(versaoIds: string[]): string[] {
    return this.arquivos.filter((a) => versaoIds.includes(a.ID_Versao)).map((a) => a.ID);
  }
  private getRepertorioIdsParaExcluirEmCascata(cultoId?: string, versaoIds?: string[]): string[] {
    return this.repertorio
      .filter((r) => (cultoId ? r.ID_Culto === cultoId : versaoIds!.includes(r.ID_Versao)))
      .map((r) => r.ID);
  }

  // ==========================================
  // CULTOS & REPERTORIO
  // ==========================================

  public getCultos(): Culto[] { return this.cultos; }
  public getRepertorio(): RepertorioItem[] { return this.repertorio; }

  public addCulto(cultoData: Omit<Culto, 'ID'>): Culto {
    const id = generateUUID();
    const newCulto: Culto = { ...cultoData, ID: id };
    this.cultos = [newCulto, ...this.cultos];
    this.notify();

    fsCultos.addCultoFirestore(
      { Data: newCulto.Data, Nome_Evento: newCulto.Nome_Evento, Status: newCulto.Status, Observacoes: newCulto.Observacoes },
      id
    ).catch((err) => console.warn('[storage] Falha ao criar culto no Firestore:', err));

    this.addLog('INSERT_CULTO', `Culto "${newCulto.Nome_Evento}" agendado`);
    return newCulto;
  }

  public updateCulto(id: string, data: Partial<Culto>) {
    const index = this.cultos.findIndex((c) => c.ID === id);
    if (index === -1) return;
    this.cultos = this.cultos.map((c) => (c.ID === id ? { ...c, ...data } : c));
    this.notify();

    fsCultos.updateCultoFirestore(id, data).catch((err) => console.warn('[storage] Falha ao atualizar culto:', err));
    this.addLog('UPDATE_CULTO', `Culto "${this.cultos[index].Nome_Evento}" atualizado`);
  }

  public deleteCulto(id: string) {
    const repertorioIds = this.getRepertorioIdsParaExcluirEmCascata(id);

    this.cultos = this.cultos.filter((c) => c.ID !== id);
    this.repertorio = this.repertorio.filter((r) => r.ID_Culto !== id);
    this.notify();

    fsCultos.deleteCultoFirestore(id).catch((err) => console.warn('[storage] Falha ao excluir culto:', err));
    repertorioIds.forEach((rId) =>
      fsRepertorio.deleteRepertorioItemFirestore(rId).catch((err) => console.warn('[storage] Falha ao excluir item de repertório em cascata:', err))
    );

    this.addLog('DELETE_CULTO', `Culto ID ${id} excluído`);
  }

  public addSongToRepertorio(cultoId: string, versaoId: string, dirigente?: string, observacao?: string): RepertorioItem {
    const currentItems = this.repertorio.filter((r) => r.ID_Culto === cultoId);
    const maxOrdem = currentItems.reduce((max, item) => Math.max(max, item.Ordem), 0);

    const id = generateUUID();
    const newItem: RepertorioItem = {
      ID: id,
      ID_Culto: cultoId,
      ID_Versao: versaoId,
      Ordem: maxOrdem + 1,
      Dirigente: dirigente || '',
      Observacao_Culto: observacao || ''
    };
    this.repertorio = [...this.repertorio, newItem];
    this.notify();

    fsRepertorio.addRepertorioItemFirestore(
      { ID_Culto: cultoId, ID_Versao: versaoId, Ordem: newItem.Ordem, Dirigente: newItem.Dirigente, Observacao_Culto: newItem.Observacao_Culto },
      id
    ).catch((err) => console.warn('[storage] Falha ao adicionar música ao repertório no Firestore:', err));

    this.addLog('INSERT_REPERTORIO', `Música adicionada ao culto ID ${cultoId}`);
    return newItem;
  }

  public removeSongFromRepertorio(repertorioId: string) {
    this.repertorio = this.repertorio.filter((r) => r.ID !== repertorioId);
    this.notify();
    fsRepertorio.deleteRepertorioItemFirestore(repertorioId).catch((err) => console.warn('[storage] Falha ao remover música do repertório:', err));
    this.addLog('DELETE_REPERTORIO', 'Música removida do repertório');
  }

  public reorderRepertorio(cultoId: string, newOrderIds: string[]) {
    this.repertorio = this.repertorio.map((item) => {
      if (item.ID_Culto !== cultoId) return item;
      const novaOrdem = newOrderIds.indexOf(item.ID);
      return novaOrdem === -1 ? item : { ...item, Ordem: novaOrdem + 1 };
    });
    this.notify();

    newOrderIds.forEach((id, index) => {
      const item = this.repertorio.find((r) => r.ID === id && r.ID_Culto === cultoId);
      if (item) {
        fsRepertorio.updateRepertorioItemFirestore(id, { Ordem: index + 1 }).catch((err) =>
          console.warn('[storage] Falha ao reordenar repertório:', err)
        );
      }
    });
  }

  // ==========================================
  // INTEGRANTES
  // ==========================================

  public getIntegrantes(): Integrante[] { return this.integrantes; }

  public addIntegrante(data: Omit<Integrante, 'ID'>): Integrante {
    const id = generateUUID();
    const newMember: Integrante = { ...data, ID: id, Ativo: true };
    this.integrantes = [...this.integrantes, newMember];
    this.notify();

    fsIntegrantes.addIntegranteFirestore(
      { Nome: newMember.Nome, Funcao: newMember.Funcao, Email: newMember.Email, Telefone: newMember.Telefone, Ativo: newMember.Ativo },
      id
    ).catch((err) => console.warn('[storage] Falha ao cadastrar integrante no Firestore:', err));

    this.addLog('INSERT_INTEGRANTE', `Integrante ${newMember.Nome} cadastrado`);
    return newMember;
  }

  public updateIntegrante(id: string, data: Partial<Integrante>) {
    const index = this.integrantes.findIndex((i) => i.ID === id);
    if (index === -1) return;
    this.integrantes = this.integrantes.map((i) => (i.ID === id ? { ...i, ...data } : i));
    this.notify();

    fsIntegrantes.updateIntegranteFirestore(id, data).catch((err) => console.warn('[storage] Falha ao atualizar integrante:', err));
    this.addLog('UPDATE_INTEGRANTE', `Integrante ${this.integrantes[index].Nome} atualizado`);
  }

  public deleteIntegrante(id: string) {
    this.integrantes = this.integrantes.filter((i) => i.ID !== id);
    this.notify();
    fsIntegrantes.deleteIntegranteFirestore(id).catch((err) => console.warn('[storage] Falha ao excluir integrante:', err));
    this.addLog('DELETE_INTEGRANTE', `Integrante ID ${id} removido`);
  }

  // ==========================================
  // HISTORICO (só leitura — nenhuma tela cria/edita hoje)
  // ==========================================

  public getHistorico(): HistoricoItem[] { return this.historico; }

  // ==========================================
  // CONFIG (vestigial — ver firestoreConfig.ts. Sem getters/setters aqui
  // porque nenhuma tela usa ConfigItem hoje; ficaria código morto.)
  // ==========================================
}

export const storage = new StorageService();

/**
 * Expõe o singleton em `window.storage` — só pra depuração/leitura pontual
 * via console do navegador (ex.: a skill `/donna` gerando relatório com
 * `window.storage.getMusicas()` depois de logada no app de verdade).
 *
 * Não é uma exposição nova de dado: quem já está autenticado no app já tem
 * acesso a exatamente esses mesmos dados pela tela — isto só dá um atalho
 * pra ler sem precisar navegar cada tabela na UI. Não escreve nada sozinho.
 */
if (typeof window !== 'undefined') {
  (window as unknown as { storage: StorageService }).storage = storage;
}
