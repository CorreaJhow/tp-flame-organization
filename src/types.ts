export interface ConfigItem {
  Chave: string;
  Valor: string;
  Descricao: string;
}

export interface Musica {
  ID: string;
  Nome: string;
  Artista: string;
  Categoria: string; // Adoração, Celebração, Oferta, Ceia, Avulsa, etc.
}

export interface Versao {
  ID: string;
  ID_Musica: string;
  Nome_Versao: string; // ex: "Original (Morada)", "Acústico", "Ao Vivo"
  Tom: string; // C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B
  BPM?: number; // e.g. 128
  Compasso?: string; // e.g. "4/4", "3/4", "6/8"
  Letra: string; // Letra com cifras ou estrutura em tags
  Estrutura: string; // ex: "Intro - V1 - C - V2 - C - B - Outro"
  Obs: string;
}

export interface Arquivo {
  ID: string;
  ID_Versao: string;
  Tipo: 'Spotify' | 'PDF' | 'Cifra' | 'Youtube' | 'Drive' | 'Outro';
  URL: string;
  Nome?: string;
}

export interface Nota {
  ID: string;
  ID_Versao: string;
  Instrumento: 'Violão' | 'Guitarra' | 'Teclado' | 'Baixo' | 'Bateria' | 'Vocal' | 'Som/Mídia' | 'Geral';
  Observacao: string;
}

export interface Culto {
  ID: string;
  Data: string; // YYYY-MM-DD THH:mm
  Nome_Evento: string; // ex: "Culto de Domingo - Noite", "Flame Night"
  Status: 'Agendado' | 'Em Preparação' | 'Realizado' | 'Cancelado';
  Observacoes?: string;
}

export interface RepertorioItem {
  ID: string;
  ID_Culto: string;
  ID_Versao: string;
  Ordem: number;
  Dirigente?: string;
  Observacao_Culto?: string;
}

export interface Integrante {
  ID: string;
  Nome: string;
  Funcao: string; // Vocal, Guitarra, Violão, Teclado, Baixo, Bateria, Mídia, Som
  Email: string;
  Telefone?: string;
  Ativo?: boolean;
}

export interface HistoricoItem {
  ID: string;
  ID_Versao: string;
  ID_Culto: string;
  Data_Execucao: string;
}

export interface LogItem {
  ID: string;
  Data: string;
  Usuario: string;
  Acao: string;
  Registro_Afetado: string;
}

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export type ViewTab = 'inicio' | 'biblioteca' | 'cultos' | 'mais' | 'integrantes' | 'historico' | 'admin';
