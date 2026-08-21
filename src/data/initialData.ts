import { ConfigItem, Musica, Versao, Arquivo, Nota, Culto, RepertorioItem, Integrante, HistoricoItem, LogItem } from '../types';

/**
 * Estado inicial de um dispositivo novo: VAZIO.
 *
 * O app já roda em produção com a banda, então músicas de demonstração não são
 * mais úteis — são ruído. Pior: elas nunca eram enviadas para a planilha (só
 * gravadas no localStorage), então sumiam na primeira sincronização e davam a
 * impressão de que o app tinha perdido dados.
 *
 * Um aparelho novo agora abre vazio e se preenche pela planilha, que é a única
 * fonte de verdade compartilhada.
 *
 * O catálogo de exemplo que ficava aqui (8 músicas com cifras completas)
 * continua no histórico do git, caso um dia seja útil para testes.
 */

export const INITIAL_CONFIG: ConfigItem[] = [];
export const INITIAL_MUSICAS: Musica[] = [];
export const INITIAL_VERSOES: Versao[] = [];
export const INITIAL_ARQUIVOS: Arquivo[] = [];
export const INITIAL_NOTAS: Nota[] = [];
export const INITIAL_CULTOS: Culto[] = [];
export const INITIAL_REPERTORIO: RepertorioItem[] = [];
export const INITIAL_INTEGRANTES: Integrante[] = [];
export const INITIAL_HISTORICO: HistoricoItem[] = [];
export const INITIAL_LOGS: LogItem[] = [];
