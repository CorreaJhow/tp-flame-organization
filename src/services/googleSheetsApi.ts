// Google Sheets API v4 & Google Drive API v3 Direct Integration
import { 
  Musica, 
  Versao, 
  Arquivo, 
  Nota, 
  Culto, 
  RepertorioItem, 
  Integrante, 
  HistoricoItem, 
  LogItem, 
  ConfigItem 
} from '../types';

/**
 * Versão do esquema da planilha. Precisa bater com SCHEMA_VERSION no
 * `gasScript.ts`; o app avisa no console quando a planilha está atrasada.
 */
export const SCHEMA_VERSION = 2;

/**
 * Colunas de auditoria, presentes em quase toda tabela:
 *
 *   Atualizado_Em  — ISO da última alteração. Gravado desde já; é o que vai
 *                    permitir resolver conflito por timestamp na Fase 2.
 *   Atualizado_Por — quem alterou, para a equipe saber a quem perguntar.
 *   Excluido_Em    — reservado para a lixeira (exclusão reversível, Fase 3).
 *
 * Logs não recebe auditoria: log é imutável. Config é chave-valor e não tem ID.
 *
 * O PIN dos integrantes NÃO está aqui de propósito: a planilha é servida por
 * um Web App público, e guardar PIN nela publicaria a senha de todo mundo.
 */
const AUDIT = ['Atualizado_Em', 'Atualizado_Por', 'Excluido_Em'];

export const SHEET_SCHEMAS: Record<string, string[]> = {
  Config: ['Chave', 'Valor', 'Descricao'],
  Musicas: ['ID', 'Nome', 'Artista', 'Categoria', ...AUDIT],
  Versoes: ['ID', 'ID_Musica', 'Nome_Versao', 'Tom', 'BPM', 'Compasso', 'Letra', 'Estrutura', 'Obs', ...AUDIT],
  Arquivos: ['ID', 'ID_Versao', 'Tipo', 'URL', 'Nome', ...AUDIT],
  Notas: ['ID', 'ID_Versao', 'Instrumento', 'Observacao', 'Autor', 'Titulo', 'TipoNota', ...AUDIT],
  Cultos: ['ID', 'Data', 'Nome_Evento', 'Status', 'Observacoes', ...AUDIT],
  Repertorio: ['ID', 'ID_Culto', 'ID_Versao', 'Ordem', 'Dirigente', 'Observacao_Culto', ...AUDIT],
  Integrantes: ['ID', 'Nome', 'Funcao', 'Email', 'Telefone', 'Ativo', ...AUDIT],
  Historico: ['ID', 'ID_Versao', 'ID_Culto', 'Data_Execucao', ...AUDIT],
  Logs: ['ID', 'Data', 'Usuario', 'Acao', 'Registro_Afetado']
};

/**
 * Campos que devem voltar como número ou booleano. Todo o resto é string.
 *
 * O Google Sheets devolve valores já tipados quando lido com UNFORMATTED_VALUE:
 * uma música chamada "123" volta como number, um Tom "7" vira number, e a
 * comparação de IDs passa a falhar silenciosamente. Normalizar na leitura
 * garante que o formato em memória seja sempre o declarado em types.ts.
 */
const NUMERIC_FIELDS = new Set(['BPM', 'Ordem']);
const BOOLEAN_FIELDS = new Set(['Ativo']);

function normalizeCell(field: string, raw: any): any {
  if (NUMERIC_FIELDS.has(field)) {
    if (raw === '' || raw === null || raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }

  if (BOOLEAN_FIELDS.has(field)) {
    if (typeof raw === 'boolean') return raw;
    const s = String(raw).trim().toLowerCase();
    return s === 'true' || s === 'sim' || s === '1' || s === 'verdadeiro';
  }

  if (raw === null || raw === undefined) return '';
  return String(raw);
}

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetsAllData {
  config: ConfigItem[];
  musicas: Musica[];
  versoes: Versao[];
  arquivos: Arquivo[];
  notas: Nota[];
  cultos: Culto[];
  repertorio: RepertorioItem[];
  integrantes: Integrante[];
  historico: HistoricoItem[];
  logs: LogItem[];
}

/**
 * Lists Google Sheets spreadsheets found in the user's Google Drive.
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=25`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Drive API Error ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Erro ao listar planilhas do Drive:', err);
    return [];
  }
}

/**
 * Creates a brand new TP Flame Spreadsheet directly in the user's Google Drive with all 10 schema sheets.
 */
export async function createTPFlameSpreadsheet(accessToken: string): Promise<{ id: string; url: string; name: string }> {
  const sheetTitles = Object.keys(SHEET_SCHEMAS);
  
  // 1. Create spreadsheet with all sheets
  const createPayload = {
    properties: {
      title: 'TP Flame - Banco de Dados'
    },
    sheets: sheetTitles.map((title) => ({
      properties: {
        title,
        gridProperties: {
          frozenRowCount: 1
        }
      }
    }))
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Erro ao criar planilha (HTTP ${createRes.status})`);
  }

  const newSpreadsheet = await createRes.json();
  const spreadsheetId = newSpreadsheet.spreadsheetId;

  // 2. Populate headers for all sheets
  const headerData = sheetTitles.map((title) => ({
    range: `${title}!A1:${String.fromCharCode(64 + SHEET_SCHEMAS[title].length)}1`,
    values: [SHEET_SCHEMAS[title]]
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: headerData
    })
  });

  return {
    id: spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    name: 'TP Flame - Banco de Dados'
  };
}

/**
 * Direct Batch Get for all 10 tables from Google Sheets API v4.
 */
export async function readAllSpreadsheetData(accessToken: string, spreadsheetId: string): Promise<SheetsAllData> {
  const tables = Object.keys(SHEET_SCHEMAS);
  // Range é o nome da aba, sem limite de células: o teto anterior de A1:Z500
  // truncava silenciosamente o remoto, e o merge apagava do dispositivo tudo
  // que ficasse além da linha 500.
  const rangesQuery = tables.map((t) => `ranges=${encodeURIComponent(t)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}&valueRenderOption=UNFORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro lendo Google Sheets (${res.status})`);
  }

  const json = await res.json();
  const valueRanges: { range: string; values?: any[][] }[] = json.valueRanges || [];

  const parsedData: any = {
    config: [],
    musicas: [],
    versoes: [],
    arquivos: [],
    notas: [],
    cultos: [],
    repertorio: [],
    integrantes: [],
    historico: [],
    logs: []
  };

  valueRanges.forEach((vr, idx) => {
    const tableName = tables[idx];
    const key = tableName.toLowerCase() as keyof SheetsAllData;
    const values = vr.values || [];

    if (values.length <= 1) {
      parsedData[key] = [];
      return;
    }

    const headers = values[0].map((h: any) => String(h).trim());
    const rows = values.slice(1);

    parsedData[key] = rows
      .map((row: any[]) => {
        const obj: any = {};
        headers.forEach((h: string, colIdx: number) => {
          obj[h] = normalizeCell(h, row[colIdx]);
        });
        return obj;
      })
      // Descarta linhas em branco deixadas por exclusões antigas (values:clear
      // esvaziava a linha em vez de removê-la, veja pushTableActionToGoogleSheets).
      .filter((obj: any) => Object.values(obj).some((v) => v !== '' && v !== undefined && v !== false));
  });

  return parsedData as SheetsAllData;
}

/** Converte índice de coluna (1-based) em letra A1: 1 -> A, 27 -> AA. */
function a1Col(index: number): string {
  let s = '';
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Mapa aba -> sheetId, necessário para excluir linhas de verdade. */
const sheetIdCache = new Map<string, Record<string, number>>();

async function getSheetIds(
  accessToken: string,
  spreadsheetId: string
): Promise<Record<string, number>> {
  const cached = sheetIdCache.get(spreadsheetId);
  if (cached) return cached;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Não foi possível ler a estrutura da planilha (${res.status})`);

  const json = await res.json();
  const map: Record<string, number> = {};
  (json.sheets || []).forEach((s: any) => {
    if (s?.properties?.title !== undefined) map[s.properties.title] = s.properties.sheetId;
  });

  sheetIdCache.set(spreadsheetId, map);
  return map;
}

/**
 * Aplica uma operação de uma tabela direto na Google Sheets API v4.
 *
 * Invariantes que esta função precisa respeitar:
 *
 * 1. `insert` é UPSERT, nunca append cego. Um append puro duplicava a linha
 *    sempre que a mesma mutação era reenviada — por retry, ou pelo caminho
 *    duplo de escrita que existia antes. Duplicatas reais foram observadas
 *    em produção nas abas Musicas, Versoes e Integrantes.
 * 2. A escrita usa RAW. Com USER_ENTERED a planilha reinterpretava o
 *    conteúdo: uma letra começando com "=" virava fórmula e um nome
 *    numérico virava number.
 * 3. `delete` remove a linha de verdade. O `values:clear` anterior deixava
 *    uma linha vazia no meio da aba, divergindo do caminho Apps Script.
 */
export async function pushTableActionToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: any
): Promise<boolean> {
  try {
    const schema = SHEET_SCHEMAS[table] || Object.keys(data);
    const rowValues = schema.map((h) => (data[h] !== undefined && data[h] !== null ? data[h] : ''));
    const targetId = data.ID || data.id;

    if (!targetId) {
      console.error(`Ação [${table}/${action}] sem ID; ignorada para não corromper a planilha.`);
      return false;
    }

    // Lê a aba inteira (sem range fixo) para localizar a linha pelo ID.
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(table)}`;
    const readRes = await fetch(readUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!readRes.ok) return false;

    const rows: any[][] = (await readRes.json()).values || [];
    const headerRow: string[] = (rows[0] || []).map((h: any) => String(h).trim());
    const idColIdx = headerRow.indexOf('ID');

    let targetRowIndex = -1;
    if (idColIdx !== -1) {
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i]?.[idColIdx] ?? '') === String(targetId)) {
          targetRowIndex = i + 1; // linha 1-based da planilha
          break;
        }
      }
    }

    if (action === 'delete') {
      if (targetRowIndex === -1) return true; // já não existe: objetivo atingido

      const sheetIds = await getSheetIds(accessToken, spreadsheetId);
      const sheetId = sheetIds[table];
      if (sheetId === undefined) return false;

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId,
                    dimension: 'ROWS',
                    startIndex: targetRowIndex - 1, // 0-based, inclusivo
                    endIndex: targetRowIndex
                  }
                }
              }
            ]
          })
        }
      );
      return res.ok;
    }

    // insert e update seguem o mesmo caminho: existe -> sobrescreve, não existe -> anexa.
    if (targetRowIndex !== -1) {
      const range = `${table}!A${targetRowIndex}:${a1Col(schema.length)}${targetRowIndex}`;
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: [rowValues] })
        }
      );
      return res.ok;
    }

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(table + '!A1')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [rowValues] })
      }
    );
    return appendRes.ok;
  } catch (err) {
    console.error(`Erro ao enviar ação [${table}/${action}] para Google Sheets API:`, err);
    return false;
  }
}
