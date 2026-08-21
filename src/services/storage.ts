import { ConfigItem, Musica, Versao, Arquivo, Nota, Culto, RepertorioItem, Integrante, HistoricoItem, LogItem, SyncQueueItem } from '../types';
import { 
  INITIAL_CONFIG, 
  INITIAL_MUSICAS, 
  INITIAL_VERSOES, 
  INITIAL_ARQUIVOS, 
  INITIAL_NOTAS, 
  INITIAL_CULTOS, 
  INITIAL_REPERTORIO, 
  INITIAL_INTEGRANTES, 
  INITIAL_HISTORICO, 
  INITIAL_LOGS 
} from '../data/initialData';
import { getAccessToken } from './googleAuth';
import { readAllSpreadsheetData, pushTableActionToGoogleSheets } from './googleSheetsApi';

const KEYS = {
  CONFIG: 'tp_flame_config_v1',
  MUSICAS: 'tp_flame_musicas_v1',
  VERSOES: 'tp_flame_versoes_v1',
  ARQUIVOS: 'tp_flame_arquivos_v1',
  NOTAS: 'tp_flame_notas_v1',
  CULTOS: 'tp_flame_cultos_v1',
  REPERTORIO: 'tp_flame_repertorio_v1',
  INTEGRANTES: 'tp_flame_integrantes_v1',
  HISTORICO: 'tp_flame_historico_v1',
  LOGS: 'tp_flame_logs_v1',
  GAS_ENDPOINT: 'tp_flame_gas_endpoint_v1',
  GAS_SPREADSHEET_ID: 'tp_flame_gas_spreadsheet_id_v1',
  SPREADSHEET_NAME: 'tp_flame_spreadsheet_name_v1',
  SYNC_QUEUE: 'tp_flame_sync_queue_v1',
  LAST_SYNC: 'tp_flame_last_sync_v1',
  TOMBSTONES: 'tp_flame_tombstones_v1',
  ACTIVE_MEMBER: 'tp_flame_active_member_id_v1'
};

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * BACKEND ÚNICO
 *
 * Estas duas constantes precisam apontar para a MESMA planilha, sempre.
 *
 * O endpoint é usado quando ninguém está logado no Google; o Spreadsheet ID é
 * usado pelo caminho OAuth direto. Antes eles apontavam para planilhas
 * diferentes, e o app gravava em bancos distintos conforme o estado de login
 * — chegou a haver três destinos de escrita simultâneos. Era a causa de dados
 * que "sumiam" e reapareciam: estavam em outra planilha o tempo todo.
 *
 * Ao trocar o endpoint, troque também o ID e incremente CONFIG_VERSION, senão
 * os aparelhos da equipe continuam usando o valor antigo em cache.
 */
const DEFAULT_GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyGB5nV1P6fATpYwgn5_Cz3oNW3bTYpOdbYBpj4EFapqsCzYY9DuJVvtDYtCTZnZsSX/exec';
const DEFAULT_GAS_SPREADSHEET_ID = '1aqikM5RjvLZYJ2Hn22SK_wg-Dx8DL9Q19ApH1TJtHwI';

/**
 * Versão da configuração de backend. Incrementar força cada dispositivo a
 * adotar o endpoint e o ID acima na próxima abertura do app, descartando o
 * que estiver em cache no localStorage.
 */
const CONFIG_VERSION = 2;
const KEY_CONFIG_VERSION = 'tp_flame_backend_config_version_v1';

class StorageService {
  constructor() {
    this.initDefaultData();
  }

  private initDefaultData() {
    if (!localStorage.getItem(KEYS.MUSICAS)) {
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG));
      localStorage.setItem(KEYS.MUSICAS, JSON.stringify(INITIAL_MUSICAS));
      localStorage.setItem(KEYS.VERSOES, JSON.stringify(INITIAL_VERSOES));
      localStorage.setItem(KEYS.ARQUIVOS, JSON.stringify(INITIAL_ARQUIVOS));
      localStorage.setItem(KEYS.NOTAS, JSON.stringify(INITIAL_NOTAS));
      localStorage.setItem(KEYS.CULTOS, JSON.stringify(INITIAL_CULTOS));
      localStorage.setItem(KEYS.REPERTORIO, JSON.stringify(INITIAL_REPERTORIO));
      localStorage.setItem(KEYS.INTEGRANTES, JSON.stringify(INITIAL_INTEGRANTES));
      localStorage.setItem(KEYS.HISTORICO, JSON.stringify(INITIAL_HISTORICO));
      localStorage.setItem(KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
    }
  }

  public resetToDefaults() {
    localStorage.removeItem(KEYS.CONFIG);
    localStorage.removeItem(KEYS.MUSICAS);
    localStorage.removeItem(KEYS.VERSOES);
    localStorage.removeItem(KEYS.ARQUIVOS);
    localStorage.removeItem(KEYS.NOTAS);
    localStorage.removeItem(KEYS.CULTOS);
    localStorage.removeItem(KEYS.REPERTORIO);
    localStorage.removeItem(KEYS.INTEGRANTES);
    localStorage.removeItem(KEYS.HISTORICO);
    localStorage.removeItem(KEYS.LOGS);
    localStorage.removeItem(KEYS.SYNC_QUEUE);
    localStorage.removeItem(KEYS.TOMBSTONES);
    this.initDefaultData();
  }

  /**
   * Zera os dados DESTE dispositivo. Não toca na planilha.
   *
   * O parâmetro `clearRemote` é aceito por compatibilidade mas ignorado: o
   * Apps Script nunca teve um handler para a ação `clearAll`, então a chamada
   * anterior só produzia um erro silencioso — dando a impressão de que a
   * planilha havia sido limpa quando nada acontecia. Apagar o banco de todo
   * mundo a partir de um endpoint público não é algo que deva existir.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async clearAllData(_clearRemote = true): Promise<boolean> {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify([]));
    localStorage.setItem(KEYS.MUSICAS, JSON.stringify([]));
    localStorage.setItem(KEYS.VERSOES, JSON.stringify([]));
    localStorage.setItem(KEYS.ARQUIVOS, JSON.stringify([]));
    localStorage.setItem(KEYS.NOTAS, JSON.stringify([]));
    localStorage.setItem(KEYS.CULTOS, JSON.stringify([]));
    localStorage.setItem(KEYS.REPERTORIO, JSON.stringify([]));
    localStorage.setItem(KEYS.INTEGRANTES, JSON.stringify([]));
    localStorage.setItem(KEYS.HISTORICO, JSON.stringify([]));
    localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
    this.addLog('SYSTEM_CLEAR', 'Todos os dados locais foram zerados');
    // A limpeza da fila vem DEPOIS do log: addLog enfileira, e limpar antes
    // deixava a fila com uma pendência órfã logo após um "zerar tudo".
    this.clearSyncQueue();
    this.clearTombstones();
    return true;
  }

  // ==========================================
  // TOMBSTONES (DELETION TRACKING)
  // ==========================================

  public getTombstones(): Set<string> {
    const data = localStorage.getItem(KEYS.TOMBSTONES);
    return new Set(data ? JSON.parse(data) : []);
  }

  public addTombstone(id: string) {
    if (!id) return;
    const tombstones = this.getTombstones();
    tombstones.add(id);
    localStorage.setItem(KEYS.TOMBSTONES, JSON.stringify(Array.from(tombstones)));
  }

  public removeTombstone(id: string) {
    if (!id) return;
    const tombstones = this.getTombstones();
    tombstones.delete(id);
    localStorage.setItem(KEYS.TOMBSTONES, JSON.stringify(Array.from(tombstones)));
  }

  public clearTombstones() {
    localStorage.setItem(KEYS.TOMBSTONES, JSON.stringify([]));
  }

  // ==========================================
  // SYNC QUEUE & PERSISTENCE MANAGEMENT
  // ==========================================

  public getSyncQueue(): SyncQueueItem[] {
    const data = localStorage.getItem(KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  public addToSyncQueue(table: string, action: 'insert' | 'update' | 'delete', data: any) {
    const queue = this.getSyncQueue();
    const itemId = data?.ID || data?.id;

    // Check if an operation for this specific item is already pending
    const existingIndex = queue.findIndex(
      (q) => q.table === table && (q.data?.ID === itemId || q.data?.id === itemId)
    );

    const newItem: SyncQueueItem = {
      id: generateUUID(),
      table,
      action,
      data,
      timestamp: Date.now()
    };

    if (existingIndex !== -1) {
      if (queue[existingIndex].action === 'insert' && action === 'update') {
        // If it was newly inserted and then updated, keep it as insert with the newer data
        queue[existingIndex] = { ...queue[existingIndex], data, timestamp: Date.now() };
      } else if (action === 'delete') {
        if (queue[existingIndex].action === 'insert') {
          // If it was created locally and then deleted before sync, simply remove from queue
          queue.splice(existingIndex, 1);
        } else {
          queue[existingIndex] = newItem;
        }
      } else {
        queue[existingIndex] = newItem;
      }
    } else {
      queue.push(newItem);
    }

    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    this.scheduleFlush();
  }

  public removeFromSyncQueue(queueItemId: string) {
    let queue = this.getSyncQueue();
    queue = queue.filter((q) => q.id !== queueItemId);
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  public clearSyncQueue() {
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify([]));
  }

  public hasPendingSync(): boolean {
    return this.getSyncQueue().length > 0;
  }

  public getPendingCount(): number {
    return this.getSyncQueue().length;
  }

  public markPendingSync() {
    // Kept for backward compatibility
  }

  public clearPendingSync() {
    this.clearSyncQueue();
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(KEYS.LAST_SYNC);
  }

  // ==========================================
  // SPREADSHEET & GAS CONFIGURATION
  // ==========================================

  /**
   * Alinha o backend salvo no dispositivo com os defaults do build.
   *
   * Roda uma vez por versão de configuração. Sobrescreve endpoint e
   * Spreadsheet ID em cache porque a divergência entre eles era justamente o
   * bug: um aparelho podia ficar preso numa planilha antiga indefinidamente,
   * já que o valor em localStorage sempre vencia o default.
   */
  private migrateBackendConfig() {
    const stored = Number(localStorage.getItem(KEY_CONFIG_VERSION) || '0');
    if (stored >= CONFIG_VERSION) return;

    localStorage.setItem(KEYS.GAS_ENDPOINT, DEFAULT_GAS_ENDPOINT);
    localStorage.setItem(KEYS.GAS_SPREADSHEET_ID, DEFAULT_GAS_SPREADSHEET_ID);
    localStorage.setItem(KEY_CONFIG_VERSION, String(CONFIG_VERSION));
  }

  public getGasEndpoint(): string {
    this.migrateBackendConfig();
    return localStorage.getItem(KEYS.GAS_ENDPOINT) || DEFAULT_GAS_ENDPOINT;
  }

  public setGasEndpoint(url: string) {
    localStorage.setItem(KEYS.GAS_ENDPOINT, url.trim());
    // Escolha deliberada do usuário: marca a config como atual para que a
    // migração não sobrescreva um endpoint customizado na próxima leitura.
    localStorage.setItem(KEY_CONFIG_VERSION, String(CONFIG_VERSION));
  }

  public getGasSpreadsheetId(): string {
    this.migrateBackendConfig();
    return localStorage.getItem(KEYS.GAS_SPREADSHEET_ID) || DEFAULT_GAS_SPREADSHEET_ID;
  }

  public setGasSpreadsheetId(id: string) {
    let cleanId = id.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }
    localStorage.setItem(KEYS.GAS_SPREADSHEET_ID, cleanId);
    localStorage.setItem(KEY_CONFIG_VERSION, String(CONFIG_VERSION));
  }

  public getSpreadsheetName(): string {
    return localStorage.getItem(KEYS.SPREADSHEET_NAME) || 'TP Flame - Banco de Dados';
  }

  public setSpreadsheetName(name: string) {
    localStorage.setItem(KEYS.SPREADSHEET_NAME, name.trim());
  }

  public getActiveSyncMode(): 'google_sheets_direct' | 'gas_endpoint' | 'offline_local' {
    const token = getAccessToken();
    const spreadsheetId = this.getGasSpreadsheetId();
    const isRealSpreadsheetId = spreadsheetId && !spreadsheetId.startsWith('AKfy') && spreadsheetId.length > 15;
    if (token && isRealSpreadsheetId) return 'google_sheets_direct';
    if (this.getGasEndpoint()) return 'gas_endpoint';
    return 'offline_local';
  }

  // ==========================================
  // BULLETPROOF BIDIRECTIONAL SYNC ENGINE
  // ==========================================

  /**
   * Envia uma mutação para a planilha e devolve se ela foi REALMENTE gravada.
   *
   * O valor de retorno é o que autoriza a remoção do item da fila, e a fila é
   * a única coisa que impede o merge de apagar o registro do dispositivo.
   * Por isso esta função só devolve true diante de confirmação lida do
   * servidor — nunca por "a requisição saiu sem erro".
   *
   * A versão anterior usava `mode: 'no-cors'`, que devolve resposta opaca (sem
   * status, sem corpo) e fazia `return true` incondicional. O endpoint do Apps
   * Script responde com CORS válido, então dá para ler o corpo de verdade.
   */
  public async sendToGas(table: string, action: string, data: any): Promise<boolean> {
    const token = getAccessToken();
    const spreadsheetId = this.getGasSpreadsheetId();
    const isRealSpreadsheetId = spreadsheetId && !spreadsheetId.startsWith('AKfy') && spreadsheetId.length > 15;

    // 1. Logado no Google com planilha válida: API v4 direta.
    if (token && isRealSpreadsheetId) {
      const success = await pushTableActionToGoogleSheets(
        token,
        spreadsheetId,
        table,
        action as 'insert' | 'update' | 'delete',
        data
      );
      if (success) return true;
    }

    // 2. Fallback: Web App do Apps Script.
    const endpoint = this.getGasEndpoint();
    if (!endpoint) return false;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        // text/plain mantém a requisição "simples": sem preflight, e a resposta
        // do Apps Script continua legível pelo navegador.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, table, data })
      });

      if (!res.ok) {
        console.warn(`Backend recusou [${table}/${action}]: HTTP ${res.status}`);
        return false;
      }

      const json = await res.json();
      if (json?.status === 'success') return true;

      console.warn(`Backend reportou erro em [${table}/${action}]:`, json?.message);
      return false;
    } catch (err) {
      console.warn(`Erro enviando para backend [${table}/${action}]:`, err);
      return false;
    }
  }

  // ==========================================
  // FLUSH AUTOMÁTICO DA FILA
  // ==========================================

  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;

  /**
   * Agenda o envio da fila logo após uma mutação.
   *
   * Antes, cada mutação disparava um POST imediato E deixava o item na fila,
   * o que fazia toda alteração ser gravada duas vezes. Agora existe um único
   * caminho de escrita — a fila — e este agendador preserva a sensação de
   * tempo real, juntando as mutações de uma mesma ação num lote só.
   */
  private scheduleFlush(delayMs = 1200) {
    if (typeof setTimeout !== 'function') return;
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flushQueue();
    }, delayMs);
  }

  /**
   * Drena a fila. Um item só sai dela com confirmação do servidor; caso
   * contrário permanece, com o contador de tentativas incrementado, para a
   * próxima sincronização tentar de novo.
   */
  public async flushQueue(): Promise<{ pushed: number; failed: number }> {
    if (this.isFlushing) return { pushed: 0, failed: 0 };
    this.isFlushing = true;

    let pushed = 0;
    let failed = 0;

    try {
      for (const item of this.getSyncQueue()) {
        const sent = await this.sendToGas(item.table, item.action, item.data);
        if (sent) {
          this.removeFromSyncQueue(item.id);
          pushed++;
        } else {
          this.markQueueItemFailed(item.id);
          failed++;
        }
      }
    } finally {
      this.isFlushing = false;
    }

    return { pushed, failed };
  }

  private markQueueItemFailed(queueItemId: string) {
    const queue = this.getSyncQueue();
    const item = queue.find((q) => q.id === queueItemId);
    if (!item) return;
    item.attempts = (item.attempts || 0) + 1;
    localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  /**
   * Smart bidirectional synchronization:
   * 1. Direct Google Sheets API v4 (if signed in with Google Workspace OAuth and valid sheet ID)
   * 2. GAS Web App endpoint (public web app)
   */
  public async syncWithGas(): Promise<{ 
    success: boolean; 
    message?: string; 
    pushedCount: number; 
    pulledCount: number;
    mode?: string;
  }> {
    const token = getAccessToken();
    const spreadsheetId = this.getGasSpreadsheetId();
    const isRealSpreadsheetId = spreadsheetId && !spreadsheetId.startsWith('AKfy') && spreadsheetId.length > 15;
    let pushedCount = 0;
    let pulledCount = 0;

    // PATH A: DIRECT GOOGLE SHEETS API V4 (WHEN LOGGED IN WITH GOOGLE WORKSPACE)
    if (token && isRealSpreadsheetId) {
      try {
        // Empurra a fila ANTES do pull. Se um item não confirmar, ele
        // permanece na fila e o merge o preserva no dispositivo.
        pushedCount = (await this.flushQueue()).pushed;

        // Pull direct from Sheets API
        const sheetsData = await readAllSpreadsheetData(token, spreadsheetId);
        const currentQueue = this.getSyncQueue();

        if (Array.isArray(sheetsData.musicas)) {
          const merged = this.mergeCollections(this.getMusicas(), sheetsData.musicas, currentQueue, 'Musicas');
          this.setDirect(KEYS.MUSICAS, merged);
          pulledCount += sheetsData.musicas.length;
        }

        if (Array.isArray(sheetsData.versoes)) {
          const merged = this.mergeCollections(this.getVersoes(), sheetsData.versoes, currentQueue, 'Versoes');
          this.setDirect(KEYS.VERSOES, merged);
        }

        if (Array.isArray(sheetsData.integrantes)) {
          const merged = this.mergeCollections(this.getIntegrantes(), sheetsData.integrantes, currentQueue, 'Integrantes');
          this.setDirect(KEYS.INTEGRANTES, merged);
          pulledCount += sheetsData.integrantes.length;
        }

        if (Array.isArray(sheetsData.cultos)) {
          const merged = this.mergeCollections(this.getCultos(), sheetsData.cultos, currentQueue, 'Cultos');
          this.setDirect(KEYS.CULTOS, merged);
        }

        if (Array.isArray(sheetsData.repertorio)) {
          const merged = this.mergeCollections(this.getRepertorio(), sheetsData.repertorio, currentQueue, 'Repertorio');
          this.setDirect(KEYS.REPERTORIO, merged);
        }

        if (Array.isArray(sheetsData.notas)) {
          const merged = this.mergeCollections(this.getNotas(), sheetsData.notas, currentQueue, 'Notas');
          this.setDirect(KEYS.NOTAS, merged);
        }

        if (Array.isArray(sheetsData.arquivos)) {
          const merged = this.mergeCollections(this.getArquivos(), sheetsData.arquivos, currentQueue, 'Arquivos');
          this.setDirect(KEYS.ARQUIVOS, merged);
        }

        if (Array.isArray(sheetsData.historico)) {
          this.setDirect(KEYS.HISTORICO, sheetsData.historico);
        }

        if (Array.isArray(sheetsData.logs)) {
          this.setDirect(KEYS.LOGS, sheetsData.logs.slice(0, 50));
        }

        localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
        this.addLog('GOOGLE_SHEETS_SYNC', `Sincronização direta com Google Sheets API v4 (${pushedCount} enviados, ${pulledCount} recebidos)`);
        return { success: true, pushedCount, pulledCount, mode: 'Google Sheets API v4' };
      } catch (err: any) {
        console.warn('Erro na sincronização direta do Sheets API, tentando via GAS Web App:', err);
      }
    }

    // PATH B: GOOGLE APPS SCRIPT WEB APP ENDPOINT
    const endpoint = this.getGasEndpoint();
    if (!endpoint) {
      return { success: false, message: 'Nenhuma URL de Web App configurada', pushedCount: 0, pulledCount: 0 };
    }

    try {
      pushedCount = (await this.flushQueue()).pushed;

      const res = await fetch(`${endpoint}?action=getAll`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();

      if (json.status === 'success' && json.data) {
        const d = json.data;
        const currentQueue = this.getSyncQueue();

        if (Array.isArray(d.musicas)) {
          const merged = this.mergeCollections(this.getMusicas(), d.musicas, currentQueue, 'Musicas');
          this.setDirect(KEYS.MUSICAS, merged);
          pulledCount += d.musicas.length;
        }

        if (Array.isArray(d.versoes)) {
          const merged = this.mergeCollections(this.getVersoes(), d.versoes, currentQueue, 'Versoes');
          this.setDirect(KEYS.VERSOES, merged);
        }

        if (Array.isArray(d.integrantes)) {
          const merged = this.mergeCollections(this.getIntegrantes(), d.integrantes, currentQueue, 'Integrantes');
          this.setDirect(KEYS.INTEGRANTES, merged);
          pulledCount += d.integrantes.length;
        }

        if (Array.isArray(d.cultos)) {
          const merged = this.mergeCollections(this.getCultos(), d.cultos, currentQueue, 'Cultos');
          this.setDirect(KEYS.CULTOS, merged);
        }

        if (Array.isArray(d.repertorio)) {
          const merged = this.mergeCollections(this.getRepertorio(), d.repertorio, currentQueue, 'Repertorio');
          this.setDirect(KEYS.REPERTORIO, merged);
        }

        if (Array.isArray(d.notas)) {
          const merged = this.mergeCollections(this.getNotas(), d.notas, currentQueue, 'Notas');
          this.setDirect(KEYS.NOTAS, merged);
        }

        if (Array.isArray(d.arquivos)) {
          const merged = this.mergeCollections(this.getArquivos(), d.arquivos, currentQueue, 'Arquivos');
          this.setDirect(KEYS.ARQUIVOS, merged);
        }

        if (Array.isArray(d.historico)) {
          this.setDirect(KEYS.HISTORICO, d.historico);
        }

        if (Array.isArray(d.logs)) {
          this.setDirect(KEYS.LOGS, d.logs.slice(0, 50));
        }

        localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
        this.addLog('GAS_SYNC_SUCCESS', `Sincronização concluída via GAS (${pushedCount} enviados, ${pulledCount} recebidos)`);
        return { success: true, pushedCount, pulledCount, mode: 'Google Apps Script' };
      } else {
        return { success: false, message: json.message || 'Erro retornado pela planilha Google', pushedCount, pulledCount };
      }
    } catch (err: any) {
      console.warn('Sincronização offline/falhou:', err);
      const isCorsOrAuth = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError');
      const errorMsg = isCorsOrAuth
        ? 'Não foi possível conectar ao Web App. Verifique se na implantação do Apps Script o campo "Quem tem acesso" foi definido como "Qualquer pessoa" (Anyone).'
        : (err?.message || 'Falha de conexão com a planilha');
      return { success: false, message: errorMsg, pushedCount, pulledCount };
    }
  }

  public async fetchFromGas() {
    return this.syncWithGas();
  }

  /**
   * Pushes entire local database to Google Sheets (Authoritative Overwrite)
   */
  public async pushAllToGas(): Promise<{ success: boolean; message: string }> {
    const payload = {
      musicas: this.getMusicas(),
      versoes: this.getVersoes(),
      arquivos: this.getArquivos(),
      notas: this.getNotas(),
      cultos: this.getCultos(),
      repertorio: this.getRepertorio(),
      integrantes: this.getIntegrantes(),
      historico: this.getHistorico()
    };

    const endpoint = this.getGasEndpoint();
    if (!endpoint) {
      return { success: false, message: 'URL da API Google Apps Script não configurada.' };
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'replaceAll', data: payload })
      });

      this.clearSyncQueue();
      this.clearTombstones();
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
      this.addLog('REPLACE_ALL', 'Planilha Google substituída com dados atuais do aplicativo');
      return { success: true, message: 'Planilha atualizada e sincronizada com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro ao comunicar com a planilha' };
    }
  }

  /**
   * Merges local and remote collections without overwriting un-synced local changes
   */
  private mergeCollections<T extends { ID: string }>(
    localList: T[],
    remoteList: T[],
    queue: SyncQueueItem[],
    table: string
  ): T[] {
    // TRAVA ANTI-APAGÃO
    //
    // O merge trata o remoto como autoridade: o que é local, não está no
    // remoto e não está na fila é descartado — é assim que a exclusão feita
    // por outro integrante chega até este aparelho.
    //
    // Só que "o remoto voltou vazio" quase nunca significa "a equipe apagou
    // tudo". Significa aba errada, planilha nova, permissão negada, resposta
    // truncada. Nesses casos o comportamento correto é preservar o local e
    // deixar o usuário resolver, não zerar a biblioteca de cifras.
    if (remoteList.length === 0 && localList.length > 0) {
      console.warn(
        `[sync] "${table}": remoto vazio com ${localList.length} registro(s) locais. Merge ignorado por segurança.`
      );
      this.addLog(
        'SYNC_MERGE_SKIPPED',
        `Tabela ${table}: planilha retornou vazia, dados locais preservados`
      );
      return localList;
    }

    const tombstones = this.getTombstones();
    const tablePending = queue.filter((q) => q.table === table);
    const pendingDeleteIds = new Set(
      tablePending.filter((q) => q.action === 'delete').map((q) => q.data?.ID || q.data?.id)
    );
    const pendingUpsertMap = new Map<string, T>();
    tablePending
      .filter((q) => q.action === 'insert' || q.action === 'update')
      .forEach((q) => {
        if (q.data?.ID) pendingUpsertMap.set(q.data.ID, q.data);
      });

    const resultMap = new Map<string, T>();

    // 1. Add all valid remote items from Google Sheets (except those explicitly deleted locally or tombstoned)
    for (const remote of remoteList) {
      if (remote && remote.ID && !pendingDeleteIds.has(remote.ID) && !tombstones.has(remote.ID)) {
        resultMap.set(remote.ID, remote);
      }
    }

    // 2. Add local items only if they are actively in the pending sync queue (user created/updated them offline)
    pendingUpsertMap.forEach((pendingItem, id) => {
      if (!tombstones.has(id) && !pendingDeleteIds.has(id)) {
        resultMap.set(id, pendingItem);
      }
    });

    return Array.from(resultMap.values());
  }

  // ==========================================
  // ADMIN AUTHENTICATION
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
  // ACTIVE MEMBER / MUSICIAN PROFILE
  // ==========================================

  public getActiveMemberId(): string | null {
    return localStorage.getItem(KEYS.ACTIVE_MEMBER);
  }

  public setActiveMemberId(id: string | null) {
    if (id) {
      localStorage.setItem(KEYS.ACTIVE_MEMBER, id);
      const member = this.getIntegrantes().find(i => i.ID === id);
      if (member) {
        this.addLog('MEMBER_LOGIN', `Integrante ${member.Nome} (${member.Funcao}) conectou seu perfil`, member.Nome);
      }
    } else {
      localStorage.removeItem(KEYS.ACTIVE_MEMBER);
    }
  }

  public getActiveMember(): Integrante | null {
    const id = this.getActiveMemberId();
    if (!id) return null;
    return this.getIntegrantes().find(i => i.ID === id) || null;
  }

  // ==========================================
  // LOCAL GETTERS & SETTERS
  // ==========================================

  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private setDirect<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Ações que descrevem a própria mecânica de sincronização. Ficam só no
   * dispositivo: registrar sincronização na planilha fazia o app escrever um
   * log para cada sync, e cada abertura do app gerava sync. Na auditoria, 73
   * de 105 linhas da aba Logs em produção eram exatamente esse ruído.
   */
  private static readonly LOCAL_ONLY_LOG_ACTIONS = new Set([
    'GAS_SYNC_SUCCESS',
    'GAS_SYNC_FETCH',
    'GOOGLE_SHEETS_SYNC',
    'SYNC_MERGE_SKIPPED',
    'MEMBER_LOGIN'
  ]);

  public addLog(action: string, detail: string, user?: string) {
    const active = this.getActiveMember();
    const effectiveUser = user || (active ? `${active.Nome} (${active.Funcao})` : 'Usuário Portal');

    const logs = this.get<LogItem>(KEYS.LOGS);
    const newLog: LogItem = {
      ID: generateUUID(),
      Data: new Date().toISOString(),
      Usuario: effectiveUser,
      Acao: action,
      Registro_Afetado: detail
    };
    logs.unshift(newLog);
    this.set(KEYS.LOGS, logs.slice(0, 50));

    if (!StorageService.LOCAL_ONLY_LOG_ACTIONS.has(action)) {
      this.addToSyncQueue('Logs', 'insert', newLog);
    }
  }

  // ==========================================
  // MUSICAS & VERSOES
  // ==========================================

  public getMusicas(): Musica[] { return this.get<Musica>(KEYS.MUSICAS); }
  public getVersoes(): Versao[] { return this.get<Versao>(KEYS.VERSOES); }
  public getArquivos(): Arquivo[] { return this.get<Arquivo>(KEYS.ARQUIVOS); }
  public getNotas(): Nota[] { return this.get<Nota>(KEYS.NOTAS); }

  public addMusicaWithVersao(
    musicaData: Omit<Musica, 'ID'>,
    versaoData: Omit<Versao, 'ID' | 'ID_Musica'>,
    notasData?: Omit<Nota, 'ID' | 'ID_Versao'>[],
    arquivosData?: Omit<Arquivo, 'ID' | 'ID_Versao'>[]
  ): { musica: Musica; versao: Versao } {
    const musicas = this.getMusicas();
    const versoes = this.getVersoes();
    const notas = this.getNotas();
    const arquivos = this.getArquivos();

    const newMusica: Musica = {
      ...musicaData,
      ID: generateUUID()
    };

    const newVersao: Versao = {
      ...versaoData,
      ID: generateUUID(),
      ID_Musica: newMusica.ID
    };

    musicas.unshift(newMusica);
    versoes.unshift(newVersao);

    this.set(KEYS.MUSICAS, musicas);
    this.set(KEYS.VERSOES, versoes);

    this.addToSyncQueue('Musicas', 'insert', newMusica);
    this.addToSyncQueue('Versoes', 'insert', newVersao);

    if (notasData && notasData.length > 0) {
      notasData.forEach((n) => {
        const newNota: Nota = {
          ...n,
          ID: generateUUID(),
          ID_Versao: newVersao.ID
        };
        notas.push(newNota);
        this.addToSyncQueue('Notas', 'insert', newNota);
        this.removeTombstone(newNota.ID);
      });
      this.set(KEYS.NOTAS, notas);
    }

    if (arquivosData && arquivosData.length > 0) {
      arquivosData.forEach((a) => {
        const newArquivo: Arquivo = {
          ...a,
          ID: generateUUID(),
          ID_Versao: newVersao.ID
        };
        arquivos.push(newArquivo);
        this.addToSyncQueue('Arquivos', 'insert', newArquivo);
        this.removeTombstone(newArquivo.ID);
      });
      this.set(KEYS.ARQUIVOS, arquivos);
    }


    this.removeTombstone(newMusica.ID);
    this.removeTombstone(newVersao.ID);

    this.addLog('INSERT_MUSICA', `Música "${newMusica.Nome}" criada`);
    return { musica: newMusica, versao: newVersao };
  }

  public addVersao(versaoData: Omit<Versao, 'ID'>): Versao {
    const versoes = this.getVersoes();
    const newVersao: Versao = {
      ...versaoData,
      ID: generateUUID()
    };
    versoes.push(newVersao);
    this.set(KEYS.VERSOES, versoes);
    this.addToSyncQueue('Versoes', 'insert', newVersao);
    this.removeTombstone(newVersao.ID);
    this.addLog('INSERT_VERSAO', `Nova versão "${newVersao.Nome_Versao}" adicionada`);
    return newVersao;
  }

  public deleteVersao(id: string) {
    this.addTombstone(id);
    let versoes = this.getVersoes();
    versoes = versoes.filter((v) => v.ID !== id);
    this.set(KEYS.VERSOES, versoes);
    this.addToSyncQueue('Versoes', 'delete', { ID: id });

    let notas = this.getNotas();
    const removedNotas = notas.filter((n) => n.ID_Versao === id);
    removedNotas.forEach((n) => {
      this.addTombstone(n.ID);
      this.addToSyncQueue('Notas', 'delete', { ID: n.ID });
    });
    notas = notas.filter((n) => n.ID_Versao !== id);
    this.set(KEYS.NOTAS, notas);

    let arquivos = this.getArquivos();
    const removedArquivos = arquivos.filter((a) => a.ID_Versao === id);
    removedArquivos.forEach((a) => {
      this.addTombstone(a.ID);
      this.addToSyncQueue('Arquivos', 'delete', { ID: a.ID });
    });
    arquivos = arquivos.filter((a) => a.ID_Versao !== id);
    this.set(KEYS.ARQUIVOS, arquivos);

    let repertorio = this.getRepertorio();
    const removedRepertorio = repertorio.filter((r) => r.ID_Versao === id);
    removedRepertorio.forEach((r) => {
      this.addTombstone(r.ID);
      this.addToSyncQueue('Repertorio', 'delete', { ID: r.ID });
    });
    repertorio = repertorio.filter((r) => r.ID_Versao !== id);
    this.set(KEYS.REPERTORIO, repertorio);

    this.addLog('DELETE_VERSAO', `Versão ID ${id} excluída`);
  }

  public addNota(notaData: Omit<Nota, 'ID'>): Nota {
    const notas = this.getNotas();
    const newNota: Nota = {
      ...notaData,
      ID: generateUUID()
    };
    notas.push(newNota);
    this.set(KEYS.NOTAS, notas);
    this.addToSyncQueue('Notas', 'insert', newNota);
    this.removeTombstone(newNota.ID);
    this.addLog('INSERT_NOTA', `Nota para ${newNota.Instrumento} inserida`);
    return newNota;
  }

  public addArquivo(arquivoData: Omit<Arquivo, 'ID'>): Arquivo {
    const arquivos = this.getArquivos();
    const newArquivo: Arquivo = {
      ...arquivoData,
      ID: generateUUID()
    };
    arquivos.push(newArquivo);
    this.set(KEYS.ARQUIVOS, arquivos);
    this.addToSyncQueue('Arquivos', 'insert', newArquivo);
    this.removeTombstone(newArquivo.ID);
    this.addLog('INSERT_ARQUIVO', `Anexo ${newArquivo.Tipo} adicionado`);
    return newArquivo;
  }

  public deleteMusica(id: string) {
    this.addTombstone(id);
    let musicas = this.getMusicas();
    musicas = musicas.filter((m) => m.ID !== id);
    this.set(KEYS.MUSICAS, musicas);
    this.addToSyncQueue('Musicas', 'delete', { ID: id });

    let versoes = this.getVersoes();
    const removedVersoes = versoes.filter((v) => v.ID_Musica === id);
    const removedVersaoIds = removedVersoes.map((v) => v.ID);
    removedVersaoIds.forEach((vId) => {
      this.addTombstone(vId);
      this.addToSyncQueue('Versoes', 'delete', { ID: vId });
    });
    versoes = versoes.filter((v) => v.ID_Musica !== id);
    this.set(KEYS.VERSOES, versoes);

    let notas = this.getNotas();
    const removedNotas = notas.filter((n) => removedVersaoIds.includes(n.ID_Versao));
    removedNotas.forEach((n) => {
      this.addTombstone(n.ID);
      this.addToSyncQueue('Notas', 'delete', { ID: n.ID });
    });
    notas = notas.filter((n) => !removedVersaoIds.includes(n.ID_Versao));
    this.set(KEYS.NOTAS, notas);

    let arquivos = this.getArquivos();
    const removedArquivos = arquivos.filter((a) => removedVersaoIds.includes(a.ID_Versao));
    removedArquivos.forEach((a) => {
      this.addTombstone(a.ID);
      this.addToSyncQueue('Arquivos', 'delete', { ID: a.ID });
    });
    arquivos = arquivos.filter((a) => !removedVersaoIds.includes(a.ID_Versao));
    this.set(KEYS.ARQUIVOS, arquivos);

    let repertorio = this.getRepertorio();
    const removedRepertorio = repertorio.filter((r) => removedVersaoIds.includes(r.ID_Versao));
    removedRepertorio.forEach((r) => {
      this.addTombstone(r.ID);
      this.addToSyncQueue('Repertorio', 'delete', { ID: r.ID });
    });
    repertorio = repertorio.filter((r) => !removedVersaoIds.includes(r.ID_Versao));
    this.set(KEYS.REPERTORIO, repertorio);

    this.addLog('DELETE_MUSICA', `Música ID ${id} excluída`);
  }

  public updateMusica(id: string, data: Partial<Musica>) {
    const musicas = this.getMusicas();
    const index = musicas.findIndex((m) => m.ID === id);
    if (index !== -1) {
      musicas[index] = { ...musicas[index], ...data };
      this.set(KEYS.MUSICAS, musicas);
      this.addToSyncQueue('Musicas', 'update', musicas[index]);
      this.addLog('UPDATE_MUSICA', `Música "${musicas[index].Nome}" atualizada`);
    }
  }

  public updateVersao(id: string, data: Partial<Versao>) {
    const versoes = this.getVersoes();
    const index = versoes.findIndex((v) => v.ID === id);
    if (index !== -1) {
      versoes[index] = { ...versoes[index], ...data };
      this.set(KEYS.VERSOES, versoes);
      this.addToSyncQueue('Versoes', 'update', versoes[index]);
      this.addLog('UPDATE_VERSAO', `Versão "${versoes[index].Nome_Versao}" atualizada`);
    }
  }

  public updateNota(id: string, data: Partial<Nota>) {
    const notas = this.getNotas();
    const index = notas.findIndex((n) => n.ID === id);
    if (index !== -1) {
      notas[index] = { ...notas[index], ...data };
      this.set(KEYS.NOTAS, notas);
      this.addToSyncQueue('Notas', 'update', notas[index]);
      this.addLog('UPDATE_NOTA', `Nota/Cifra para ${notas[index].Instrumento} atualizada`);
    }
  }

  public deleteNota(id: string) {
    this.addTombstone(id);
    let notas = this.getNotas();
    notas = notas.filter((n) => n.ID !== id);
    this.set(KEYS.NOTAS, notas);
    this.addToSyncQueue('Notas', 'delete', { ID: id });
    this.addLog('DELETE_NOTA', `Nota removida`);
  }

  public deleteArquivo(id: string) {
    this.addTombstone(id);
    let arquivos = this.getArquivos();
    arquivos = arquivos.filter((a) => a.ID !== id);
    this.set(KEYS.ARQUIVOS, arquivos);
    this.addToSyncQueue('Arquivos', 'delete', { ID: id });
    this.addLog('DELETE_ARQUIVO', `Anexo removido`);
  }

  // ==========================================
  // CULTOS & REPERTORIO
  // ==========================================

  public getCultos(): Culto[] { return this.get<Culto>(KEYS.CULTOS); }
  public getRepertorio(): RepertorioItem[] { return this.get<RepertorioItem>(KEYS.REPERTORIO); }

  public addCulto(cultoData: Omit<Culto, 'ID'>): Culto {
    const cultos = this.getCultos();
    const newCulto: Culto = {
      ...cultoData,
      ID: generateUUID()
    };
    cultos.unshift(newCulto);
    this.set(KEYS.CULTOS, cultos);
    this.addToSyncQueue('Cultos', 'insert', newCulto);
    this.removeTombstone(newCulto.ID);
    this.addLog('INSERT_CULTO', `Culto "${newCulto.Nome_Evento}" agendado`);
    return newCulto;
  }

  public updateCulto(id: string, data: Partial<Culto>) {
    const cultos = this.getCultos();
    const index = cultos.findIndex((c) => c.ID === id);
    if (index !== -1) {
      cultos[index] = { ...cultos[index], ...data };
      this.set(KEYS.CULTOS, cultos);
      this.addToSyncQueue('Cultos', 'update', cultos[index]);
      this.addLog('UPDATE_CULTO', `Culto "${cultos[index].Nome_Evento}" atualizado`);
    }
  }

  public deleteCulto(id: string) {
    this.addTombstone(id);
    let cultos = this.getCultos();
    cultos = cultos.filter((c) => c.ID !== id);
    this.set(KEYS.CULTOS, cultos);
    this.addToSyncQueue('Cultos', 'delete', { ID: id });

    let repertorio = this.getRepertorio();
    const removedRepertorio = repertorio.filter((r) => r.ID_Culto === id);
    removedRepertorio.forEach((r) => {
      this.addTombstone(r.ID);
      this.addToSyncQueue('Repertorio', 'delete', { ID: r.ID });
    });
    repertorio = repertorio.filter((r) => r.ID_Culto !== id);
    this.set(KEYS.REPERTORIO, repertorio);

    this.addLog('DELETE_CULTO', `Culto ID ${id} excluído`);
  }

  public addSongToRepertorio(cultoId: string, versaoId: string, dirigente?: string, observacao?: string): RepertorioItem {
    const repertorio = this.getRepertorio();
    const currentItems = repertorio.filter((r) => r.ID_Culto === cultoId);
    const maxOrdem = currentItems.reduce((max, item) => Math.max(max, item.Ordem), 0);

    const newItem: RepertorioItem = {
      ID: generateUUID(),
      ID_Culto: cultoId,
      ID_Versao: versaoId,
      Ordem: maxOrdem + 1,
      Dirigente: dirigente || '',
      Observacao_Culto: observacao || ''
    };

    repertorio.push(newItem);
    this.set(KEYS.REPERTORIO, repertorio);
    this.addToSyncQueue('Repertorio', 'insert', newItem);
    this.removeTombstone(newItem.ID);
    this.addLog('INSERT_REPERTORIO', `Música adicionada ao culto ID ${cultoId}`);
    return newItem;
  }

  public removeSongFromRepertorio(repertorioId: string) {
    this.addTombstone(repertorioId);
    let repertorio = this.getRepertorio();
    repertorio = repertorio.filter((r) => r.ID !== repertorioId);
    this.set(KEYS.REPERTORIO, repertorio);
    this.addToSyncQueue('Repertorio', 'delete', { ID: repertorioId });
    this.addLog('DELETE_REPERTORIO', `Música removida do repertório`);
  }

  public reorderRepertorio(cultoId: string, newOrderIds: string[]) {
    const repertorio = this.getRepertorio();
    newOrderIds.forEach((id, index) => {
      const item = repertorio.find((r) => r.ID === id && r.ID_Culto === cultoId);
      if (item) {
        item.Ordem = index + 1;
        this.addToSyncQueue('Repertorio', 'update', item);
      }
    });
    this.set(KEYS.REPERTORIO, repertorio);
  }

  // ==========================================
  // INTEGRANTES
  // ==========================================

  public getIntegrantes(): Integrante[] { return this.get<Integrante>(KEYS.INTEGRANTES); }

  public addIntegrante(data: Omit<Integrante, 'ID'>): Integrante {
    const integrantes = this.getIntegrantes();
    const newMember: Integrante = {
      ...data,
      ID: generateUUID(),
      Ativo: true
    };
    integrantes.push(newMember);
    this.set(KEYS.INTEGRANTES, integrantes);
    this.addToSyncQueue('Integrantes', 'insert', newMember);
    this.removeTombstone(newMember.ID);
    this.addLog('INSERT_INTEGRANTE', `Integrante ${newMember.Nome} cadastrado`);
    return newMember;
  }

  public deleteIntegrante(id: string) {
    this.addTombstone(id);
    let integrantes = this.getIntegrantes();
    integrantes = integrantes.filter((i) => i.ID !== id);
    this.set(KEYS.INTEGRANTES, integrantes);
    this.addToSyncQueue('Integrantes', 'delete', { ID: id });
    this.addLog('DELETE_INTEGRANTE', `Integrante ID ${id} removido`);
  }

  public updateIntegrante(id: string, data: Partial<Integrante>) {
    const integrantes = this.getIntegrantes();
    const index = integrantes.findIndex((i) => i.ID === id);
    if (index !== -1) {
      integrantes[index] = { ...integrantes[index], ...data };
      this.set(KEYS.INTEGRANTES, integrantes);
      this.addToSyncQueue('Integrantes', 'update', integrantes[index]);
      this.addLog('UPDATE_INTEGRANTE', `Integrante ${integrantes[index].Nome} atualizado`);
    }
  }

  // ==========================================
  // HISTORICO & LOGS
  // ==========================================

  public getHistorico(): HistoricoItem[] { return this.get<HistoricoItem>(KEYS.HISTORICO); }
  public getLogs(): LogItem[] { return this.get<LogItem>(KEYS.LOGS); }

  public addHistorico(data: Omit<HistoricoItem, 'ID'>): HistoricoItem {
    const historico = this.getHistorico();
    const newHist: HistoricoItem = {
      ...data,
      ID: generateUUID()
    };
    historico.unshift(newHist);
    this.set(KEYS.HISTORICO, historico);
    this.addToSyncQueue('Historico', 'insert', newHist);
    this.removeTombstone(newHist.ID);
    this.addLog('INSERT_HISTORICO', `Histórico registrado`);
    return newHist;
  }

  public deleteHistorico(id: string) {
    this.addTombstone(id);
    let historico = this.getHistorico();
    historico = historico.filter((h) => h.ID !== id);
    this.set(KEYS.HISTORICO, historico);
    this.addToSyncQueue('Historico', 'delete', { ID: id });
    this.addLog('DELETE_HISTORICO', `Item de histórico removido`);
  }
}

export const storage = new StorageService();
