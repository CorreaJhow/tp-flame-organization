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

export const SHEET_SCHEMAS: Record<string, string[]> = {
  Config: ['Chave', 'Valor', 'Descricao'],
  Musicas: ['ID', 'Nome', 'Artista', 'Categoria'],
  Versoes: ['ID', 'ID_Musica', 'Nome_Versao', 'Tom', 'Letra', 'Estrutura', 'Obs'],
  Arquivos: ['ID', 'ID_Versao', 'Tipo', 'URL'],
  Notas: ['ID', 'ID_Versao', 'Instrumento', 'Observacao'],
  Cultos: ['ID', 'Data', 'Nome_Evento', 'Status'],
  Repertorio: ['ID', 'ID_Culto', 'ID_Versao', 'Ordem'],
  Integrantes: ['ID', 'Nome', 'Funcao', 'Email', 'Telefone', 'Ativo'],
  Historico: ['ID', 'ID_Versao', 'ID_Culto', 'Data_Execucao'],
  Logs: ['ID', 'Data', 'Usuario', 'Acao', 'Registro_Afetado']
};

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
      valueInputOption: 'USER_ENTERED',
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
  const rangesQuery = tables.map((t) => `ranges=${encodeURIComponent(t + '!A1:Z500')}`).join('&');
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

    parsedData[key] = rows.map((row: any[]) => {
      const obj: any = {};
      headers.forEach((h: string, colIdx: number) => {
        obj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
      });
      return obj;
    });
  });

  return parsedData as SheetsAllData;
}

/**
 * Pushes individual table operations directly to Google Sheets API v4.
 */
export async function pushTableActionToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: any
): Promise<boolean> {
  try {
    const headers = SHEET_SCHEMAS[table] || Object.keys(data);
    const rowValues = headers.map((h) => (data[h] !== undefined ? data[h] : ''));
    const targetId = data.ID || data.id;

    if (action === 'insert') {
      // Append row to sheet
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${table}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowValues]
        })
      });
      return res.ok;
    }

    if (action === 'update' || action === 'delete') {
      // Fetch table to locate row index
      const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${table}!A1:Z500`;
      const readRes = await fetch(readUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!readRes.ok) return false;
      const readJson = await readRes.json();
      const rows = readJson.values || [];
      if (rows.length <= 1) return false;

      const headerRow = rows[0].map((h: any) => String(h).trim());
      const idColIdx = headerRow.indexOf('ID');
      if (idColIdx === -1) return false;

      let targetRowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idColIdx]) === String(targetId)) {
          targetRowIndex = i + 1; // 1-based sheet row
          break;
        }
      }

      if (targetRowIndex === -1) {
        if (action === 'update') {
          // If not found, append
          return pushTableActionToGoogleSheets(accessToken, spreadsheetId, table, 'insert', data);
        }
        return true; // Already deleted
      }

      if (action === 'update') {
        const updateRange = `${table}!A${targetRowIndex}:${String.fromCharCode(64 + headers.length)}${targetRowIndex}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`;
        const res = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowValues]
          })
        });
        return res.ok;
      }

      if (action === 'delete') {
        // Clear row values in Sheets
        const clearRange = `${table}!A${targetRowIndex}:${String.fromCharCode(64 + headers.length)}${targetRowIndex}`;
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
        const res = await fetch(clearUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        return res.ok;
      }
    }

    return false;
  } catch (err) {
    console.error(`Erro ao enviar ação [${table}/${action}] para Google Sheets API:`, err);
    return false;
  }
}
