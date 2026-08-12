import { ConfigItem, Musica, Versao, Arquivo, Nota, Culto, RepertorioItem, Integrante, HistoricoItem, LogItem } from '../types';
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
  GAS_SPREADSHEET_ID: 'tp_flame_gas_spreadsheet_id_v1'
};

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DEFAULT_GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzM45f4onc3vNeM_Dx2oFFrdaC2Kf3q_vBRC9yPV_xYjLbcUlL2WKhmeZmy9J6iVHOhQA/exec';
const DEFAULT_GAS_SPREADSHEET_ID = '1kTVwhWqVOBUwNGtgt76m6Z25UG6hvNbFkjGhbt9m8GU';

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
    this.initDefaultData();
  }

  public clearAllData() {
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
  }

  // GAS Settings
  public getGasEndpoint(): string {
    return localStorage.getItem(KEYS.GAS_ENDPOINT) || DEFAULT_GAS_ENDPOINT;
  }

  public setGasEndpoint(url: string) {
    localStorage.setItem(KEYS.GAS_ENDPOINT, url.trim());
  }

  public getGasSpreadsheetId(): string {
    return localStorage.getItem(KEYS.GAS_SPREADSHEET_ID) || DEFAULT_GAS_SPREADSHEET_ID;
  }

  public setGasSpreadsheetId(id: string) {
    localStorage.setItem(KEYS.GAS_SPREADSHEET_ID, id.trim());
  }

  // GAS Syncing
  public async fetchFromGas(): Promise<{ success: boolean; message?: string }> {
    const endpoint = this.getGasEndpoint();
    if (!endpoint) return { success: false, message: 'Endpoint GAS não configurado' };

    try {
      const res = await fetch(`${endpoint}?action=getAll`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();

      if (json.status === 'success' && json.data) {
        const d = json.data;
        if (Array.isArray(d.musicas) && d.musicas.length > 0) this.set(KEYS.MUSICAS, d.musicas);
        if (Array.isArray(d.versoes) && d.versoes.length > 0) this.set(KEYS.VERSOES, d.versoes);
        if (Array.isArray(d.arquivos)) this.set(KEYS.ARQUIVOS, d.arquivos);
        if (Array.isArray(d.notas)) this.set(KEYS.NOTAS, d.notas);
        if (Array.isArray(d.cultos) && d.cultos.length > 0) this.set(KEYS.CULTOS, d.cultos);
        if (Array.isArray(d.repertorio)) this.set(KEYS.REPERTORIO, d.repertorio);
        if (Array.isArray(d.integrantes) && d.integrantes.length > 0) this.set(KEYS.INTEGRANTES, d.integrantes);
        if (Array.isArray(d.historico)) this.set(KEYS.HISTORICO, d.historico);
        if (Array.isArray(d.logs)) this.set(KEYS.LOGS, d.logs);

        this.addLog('GAS_SYNC_FETCH', 'Dados sincronizados com sucesso do Google Sheets');
        return { success: true };
      } else {
        return { success: false, message: json.message || 'Erro de formato retornado pelo GAS' };
      }
    } catch (err: any) {
      console.warn('Sincronização com GAS offline/falhou, usando cache local:', err);
      return { success: false, message: err?.message || 'Falha de conexão com GAS' };
    }
  }

  public async sendToGas(table: string, action: string, data: any): Promise<boolean> {
    const endpoint = this.getGasEndpoint();
    if (!endpoint) return false;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, table, data })
      });
      return true;
    } catch (err) {
      console.warn(`Erro enviando para GAS [${table}/${action}]:`, err);
      return false;
    }
  }

  // Admin Auth
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

  // Generic getter / setter
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  public addLog(action: string, detail: string, user = 'Usuário Portal') {
    const logs = this.get<LogItem>(KEYS.LOGS);
    const newLog: LogItem = {
      ID: generateUUID(),
      Data: new Date().toISOString(),
      Usuario: user,
      Acao: action,
      Registro_Afetado: detail
    };
    logs.unshift(newLog);
    this.set(KEYS.LOGS, logs.slice(0, 50)); // Keep last 50
  }

  // Musicas & Versoes
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

    if (notasData && notasData.length > 0) {
      notasData.forEach(n => {
        notas.push({
          ...n,
          ID: generateUUID(),
          ID_Versao: newVersao.ID
        });
      });
      this.set(KEYS.NOTAS, notas);
    }

    if (arquivosData && arquivosData.length > 0) {
      arquivosData.forEach(a => {
        arquivos.push({
          ...a,
          ID: generateUUID(),
          ID_Versao: newVersao.ID
        });
      });
      this.set(KEYS.ARQUIVOS, arquivos);
    }

    this.set(KEYS.MUSICAS, musicas);
    this.set(KEYS.VERSOES, versoes);

    this.sendToGas('Musicas', 'insert', newMusica);
    this.sendToGas('Versoes', 'insert', newVersao);

    this.addLog('INSERT_MUSICA', `Música "${newMusica.Nome}" e Versão "${newVersao.Nome_Versao}" criadas`);
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
    this.sendToGas('Versoes', 'insert', newVersao);
    this.addLog('INSERT_VERSAO', `Nova versão "${newVersao.Nome_Versao}" adicionada`);
    return newVersao;
  }

  public addNota(notaData: Omit<Nota, 'ID'>): Nota {
    const notas = this.getNotas();
    const newNota: Nota = {
      ...notaData,
      ID: generateUUID()
    };
    notas.push(newNota);
    this.set(KEYS.NOTAS, notas);
    this.sendToGas('Notas', 'insert', newNota);
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
    this.sendToGas('Arquivos', 'insert', newArquivo);
    this.addLog('INSERT_ARQUIVO', `Anexo ${newArquivo.Tipo} adicionado`);
    return newArquivo;
  }

  public deleteMusica(id: string) {
    let musicas = this.getMusicas();
    musicas = musicas.filter(m => m.ID !== id);
    this.set(KEYS.MUSICAS, musicas);

    // Also remove associated versions, notes, and files
    let versoes = this.getVersoes();
    const removedVersaoIds = versoes.filter(v => v.ID_Musica === id).map(v => v.ID);
    versoes = versoes.filter(v => v.ID_Musica !== id);
    this.set(KEYS.VERSOES, versoes);

    let notas = this.getNotas();
    notas = notas.filter(n => !removedVersaoIds.includes(n.ID_Versao));
    this.set(KEYS.NOTAS, notas);

    let arquivos = this.getArquivos();
    arquivos = arquivos.filter(a => !removedVersaoIds.includes(a.ID_Versao));
    this.set(KEYS.ARQUIVOS, arquivos);

    let repertorio = this.getRepertorio();
    repertorio = repertorio.filter(r => !removedVersaoIds.includes(r.ID_Versao));
    this.set(KEYS.REPERTORIO, repertorio);

    this.addLog('DELETE_MUSICA', `Música ID ${id} e suas versões foram excluídas`);
  }

  public updateMusica(id: string, data: Partial<Musica>) {
    const musicas = this.getMusicas();
    const index = musicas.findIndex(m => m.ID === id);
    if (index !== -1) {
      musicas[index] = { ...musicas[index], ...data };
      this.set(KEYS.MUSICAS, musicas);
      this.addLog('UPDATE_MUSICA', `Música "${musicas[index].Nome}" atualizada`);
    }
  }

  public updateVersao(id: string, data: Partial<Versao>) {
    const versoes = this.getVersoes();
    const index = versoes.findIndex(v => v.ID === id);
    if (index !== -1) {
      versoes[index] = { ...versoes[index], ...data };
      this.set(KEYS.VERSOES, versoes);
      this.addLog('UPDATE_VERSAO', `Versão "${versoes[index].Nome_Versao}" atualizada`);
    }
  }

  public deleteNota(id: string) {
    let notas = this.getNotas();
    notas = notas.filter(n => n.ID !== id);
    this.set(KEYS.NOTAS, notas);
    this.addLog('DELETE_NOTA', `Nota removida`);
  }

  public deleteArquivo(id: string) {
    let arquivos = this.getArquivos();
    arquivos = arquivos.filter(a => a.ID !== id);
    this.set(KEYS.ARQUIVOS, arquivos);
    this.addLog('DELETE_ARQUIVO', `Anexo removido`);
  }

  // Cultos & Repertorio
  public getCultos(): Culto[] { return this.get<Culto>(KEYS.CULTOS); }
  public getRepertorio(): RepertorioItem[] { return this.get<RepertorioItem>(KEYS.REPERTORIO); }

  public deleteCulto(id: string) {
    let cultos = this.getCultos();
    cultos = cultos.filter(c => c.ID !== id);
    this.set(KEYS.CULTOS, cultos);

    let repertorio = this.getRepertorio();
    repertorio = repertorio.filter(r => r.ID_Culto !== id);
    this.set(KEYS.REPERTORIO, repertorio);

    this.addLog('DELETE_CULTO', `Culto ID ${id} excluído`);
  }

  public addCulto(cultoData: Omit<Culto, 'ID'>): Culto {
    const cultos = this.getCultos();
    const newCulto: Culto = {
      ...cultoData,
      ID: generateUUID()
    };
    cultos.unshift(newCulto);
    this.set(KEYS.CULTOS, cultos);
    this.sendToGas('Cultos', 'insert', newCulto);
    this.addLog('INSERT_CULTO', `Culto "${newCulto.Nome_Evento}" agendado`);
    return newCulto;
  }

  public updateCulto(id: string, data: Partial<Culto>) {
    const cultos = this.getCultos();
    const index = cultos.findIndex(c => c.ID === id);
    if (index !== -1) {
      cultos[index] = { ...cultos[index], ...data };
      this.set(KEYS.CULTOS, cultos);
      this.addLog('UPDATE_CULTO', `Culto "${cultos[index].Nome_Evento}" atualizado`);
    }
  }

  public addSongToRepertorio(cultoId: string, versaoId: string, dirigente?: string, observacao?: string): RepertorioItem {
    const repertorio = this.getRepertorio();
    const currentItems = repertorio.filter(r => r.ID_Culto === cultoId);
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
    this.sendToGas('Repertorio', 'insert', newItem);
    this.addLog('INSERT_REPERTORIO', `Música adicionada ao culto ID ${cultoId}`);
    return newItem;
  }

  public removeSongFromRepertorio(repertorioId: string) {
    let repertorio = this.getRepertorio();
    repertorio = repertorio.filter(r => r.ID !== repertorioId);
    this.set(KEYS.REPERTORIO, repertorio);
    this.addLog('DELETE_REPERTORIO', `Música removida do repertório`);
  }

  public reorderRepertorio(cultoId: string, newOrderIds: string[]) {
    const repertorio = this.getRepertorio();
    newOrderIds.forEach((id, index) => {
      const item = repertorio.find(r => r.ID === id && r.ID_Culto === cultoId);
      if (item) {
        item.Ordem = index + 1;
      }
    });
    this.set(KEYS.REPERTORIO, repertorio);
  }

  // Integrantes
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
    this.sendToGas('Integrantes', 'insert', newMember);
    this.addLog('INSERT_INTEGRANTE', `Integrante ${newMember.Nome} cadastrado`);
    return newMember;
  }

  public deleteIntegrante(id: string) {
    let integrantes = this.getIntegrantes();
    integrantes = integrantes.filter(i => i.ID !== id);
    this.set(KEYS.INTEGRANTES, integrantes);
    this.addLog('DELETE_INTEGRANTE', `Integrante ID ${id} removido`);
  }

  public updateIntegrante(id: string, data: Partial<Integrante>) {
    const integrantes = this.getIntegrantes();
    const index = integrantes.findIndex(i => i.ID === id);
    if (index !== -1) {
      integrantes[index] = { ...integrantes[index], ...data };
      this.set(KEYS.INTEGRANTES, integrantes);
      this.addLog('UPDATE_INTEGRANTE', `Integrante ${integrantes[index].Nome} atualizado`);
    }
  }

  // Historico & Logs
  public getHistorico(): HistoricoItem[] { return this.get<HistoricoItem>(KEYS.HISTORICO); }
  public getLogs(): LogItem[] { return this.get<LogItem>(KEYS.LOGS); }
}

export const storage = new StorageService();
