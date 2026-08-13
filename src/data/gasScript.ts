// Google Apps Script Source Code for TP Flame Platform
// Script Completo de Produção: Setup Automático, API Web App e Rotina de Backup

export const GAS_UNIFIED_PRODUCTION_CODE = `/**
 * ============================================================================
 * PLATAFORMA TP FLAME - SCRIPT UNIFICADO DE PRODUÇÃO (Google Apps Script)
 * ============================================================================
 * Funcionalidades Integradas:
 * 1. setupDatabase(): Cria/formata todas as 10 abas com cabeçalhos e estilos.
 * 2. doGet(e) & doPost(e): API Web App para sincronização instantânea em tempo real.
 * 3. createBackup(): Gera cópia/backup automático da planilha no Google Drive.
 * 4. setupDailyBackupTrigger(): Cria gatilho diário de backup automático.
 * ============================================================================
 */

// Configuração dos Esquemas das 10 Tabelas do Sistema
var DATABASE_SCHEMA = {
  "Config": ["Chave", "Valor", "Descricao"],
  "Musicas": ["ID", "Nome", "Artista", "Categoria"],
  "Versoes": ["ID", "ID_Musica", "Nome_Versao", "Tom", "BPM", "Compasso", "Letra", "Estrutura", "Obs"],
  "Arquivos": ["ID", "ID_Versao", "Tipo", "URL", "Nome"],
  "Notas": ["ID", "ID_Versao", "Instrumento", "Observacao"],
  "Cultos": ["ID", "Data", "Nome_Evento", "Status", "Observacoes"],
  "Repertorio": ["ID", "ID_Culto", "ID_Versao", "Ordem", "Dirigente", "Observacao_Culto"],
  "Integrantes": ["ID", "Nome", "Funcao", "Email", "Telefone", "Ativo"],
  "Historico": ["ID", "ID_Versao", "ID_Culto", "Data_Execucao"],
  "Logs": ["ID", "Data", "Usuario", "Acao", "Registro_Afetado"]
};

/**
 * Obtém a planilha ativa (quando aberta via Extensões > Apps Script)
 */
function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  throw new Error("Não foi possível acessar a planilha ativa. Execute o script a partir do menu Extensões > Apps Script da planilha.");
}

/**
 * 1. FUNÇÃO DE SETUP: Inicializa ou ajusta todas as abas e cabeçalhos
 * Execute esta função uma vez no editor do Apps Script se a planilha for nova.
 */
function setupDatabase() {
  var ss = getSpreadsheet();
  Logger.log("Iniciando setup na planilha: " + ss.getName() + " (ID: " + ss.getId() + ")");

  Object.keys(DATABASE_SCHEMA).forEach(function(sheetName) {
    var headers = DATABASE_SCHEMA[sheetName];
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Se a aba estiver vazia, insere cabeçalho
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    } else {
      // Atualiza a primeira linha com os cabeçalhos padrão
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Formatação visual do cabeçalho
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1E1E2E")
               .setFontColor("#FFFFFF")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");

    sheet.setFrozenRows(1);
    
    for (var col = 1; col <= headers.length; col++) {
      sheet.setColumnWidth(col, 160);
    }
  });

  // Remove a aba padrão Página1 / Sheet1 se existirem outras abas
  var defaultSheet = ss.getSheetByName("Página1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Registra log de setup
  logAction(ss, "SETUP_DATABASE", "Todas as Tabelas", "Estrutura verificada/inicializada");

  Logger.log("=== SETUP CONCLUÍDO COM SUCESSO ===");
  return {
    status: "success",
    spreadsheetId: ss.getId(),
    message: "Banco de dados configurado com sucesso!"
  };
}

/**
 * 2. ROTINA DE BACKUP: Cria uma cópia com timestamp da planilha no Google Drive
 */
function createBackup() {
  var ss = getSpreadsheet();
  var fileId = ss.getId();
  var file = DriveApp.getFileById(fileId);
  
  var now = new Date();
  var timeStamp = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT-3", "yyyy-MM-dd_HH-mm-ss");
  var backupName = "Backup - " + ss.getName() + " - " + timeStamp;
  
  // Procura ou cria pasta "TP Flame - Backups"
  var folderName = "TP Flame - Backups";
  var folders = DriveApp.getFoldersByName(folderName);
  var backupFolder;
  if (folders.hasNext()) {
    backupFolder = folders.next();
  } else {
    backupFolder = DriveApp.createFolder(folderName);
  }
  
  var backupFile = file.makeCopy(backupName, backupFolder);
  logAction(ss, "CREATE_BACKUP", "Drive", "Backup criado: " + backupName);
  
  Logger.log("Backup criado com sucesso: " + backupFile.getName() + " (ID: " + backupFile.getId() + ")");
  return {
    status: "success",
    backupFileId: backupFile.getId(),
    backupFileName: backupName,
    backupUrl: backupFile.getUrl()
  };
}

/**
 * 3. GATILHO AUTOMÁTICO DE BACKUP DIÁRIO (Opcional)
 * Execute uma vez para agendar backup automático todo dia às 03:00 da madrugada.
 */
function setupDailyBackupTrigger() {
  // Remove gatilhos anteriores de backup
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "createBackup") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Cria novo gatilho diário às 3h
  ScriptApp.newTrigger("createBackup")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  Logger.log("Gatilho de backup diário configurado para as 03:00!");
}

/**
 * 4. API WEB APP: Endpoints GET (Leitura e Consultas)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
  
  try {
    var ss = getSpreadsheet();

    if (action === 'getAll') {
      var data = {
        config: getSheetData(ss, 'Config'),
        musicas: getSheetData(ss, 'Musicas'),
        versoes: getSheetData(ss, 'Versoes'),
        arquivos: getSheetData(ss, 'Arquivos'),
        notas: getSheetData(ss, 'Notas'),
        cultos: getSheetData(ss, 'Cultos'),
        repertorio: getSheetData(ss, 'Repertorio'),
        integrantes: getSheetData(ss, 'Integrantes'),
        historico: getSheetData(ss, 'Historico'),
        logs: getSheetData(ss, 'Logs')
      };
      return createJsonResponse({ status: 'success', data: data });
    }

    if (action === 'setup') {
      var setupRes = setupDatabase();
      return createJsonResponse(setupRes);
    }

    if (action === 'backup') {
      var backupRes = createBackup();
      return createJsonResponse(backupRes);
    }

    if (action === 'search') {
      var query = ((e && e.parameter && e.parameter.q) || '').toLowerCase();
      var musicas = getSheetData(ss, 'Musicas');
      var filtered = musicas.filter(function(m) {
        return (m.Nome || '').toLowerCase().indexOf(query) !== -1 ||
               (m.Artista || '').toLowerCase().indexOf(query) !== -1 ||
               (m.Categoria || '').toLowerCase().indexOf(query) !== -1;
      });
      return createJsonResponse({ status: 'success', data: filtered });
    }

    return createJsonResponse({ status: 'error', message: 'Ação GET desconhecida: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * 5. API WEB APP: Endpoints POST (Escrita, Alterações e Sincronização em Tempo Real)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'Nenhum payload recebido no POST' });
    }

    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var table = body.table;
    var payload = body.data;
    var ss = getSpreadsheet();

    // Trigger remoto de backup
    if (action === 'backup') {
      return createJsonResponse(createBackup());
    }

    // Setup remoto
    if (action === 'setup') {
      return createJsonResponse(setupDatabase());
    }

    // Publicação / Substituição total de dados pelo App
    if (action === 'replaceAll' && payload) {
      var allTables = ["Musicas", "Versoes", "Arquivos", "Notas", "Cultos", "Repertorio", "Integrantes", "Historico"];
      allTables.forEach(function(tableName) {
        var sh = ss.getSheetByName(tableName);
        if (sh) {
          if (sh.getLastRow() > 1) {
            sh.deleteRows(2, sh.getLastRow() - 1);
          }
          var key = tableName.toLowerCase();
          var items = payload[key] || payload[tableName];
          if (Array.isArray(items) && items.length > 0) {
            var headers = sh.getDataRange().getValues()[0];
            var rowsToAdd = items.map(function(item) {
              return headers.map(function(h) {
                return item[h] !== undefined ? item[h] : '';
              });
            });
            if (rowsToAdd.length > 0) {
              sh.getRange(2, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
            }
          }
        }
      });
      logAction(ss, 'REPLACE_ALL', 'Todas as Tabelas', 'Publicação completa enviada pelo App');
      return createJsonResponse({ status: 'success', message: 'Planilha sincronizada e atualizada com sucesso!' });
    }

    // Operações em lote (batch)
    if (action === 'batch' && Array.isArray(body.operations)) {
      body.operations.forEach(function(op) {
        processOperation(ss, op.table, op.action, op.data);
      });
      return createJsonResponse({ status: 'success', message: 'Operações em lote processadas com sucesso' });
    }

    // Operação individual instantânea (insert, update, delete)
    var result = processOperation(ss, table, action, payload);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Executa uma operação (insert / update / delete) em uma tabela específica
 */
function processOperation(ss, table, action, payload) {
  var sheet = ss.getSheetByName(table);
  if (!sheet) {
    // Tenta criar e configurar a tabela caso ainda não exista
    setupDatabase();
    sheet = ss.getSheetByName(table);
    if (!sheet) {
      return { status: 'error', message: 'Tabela não encontrada: ' + table };
    }
  }

  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  if (values.length === 0) {
    setupDatabase();
    values = sheet.getDataRange().getValues();
  }

  var headers = values[0];
  var idIndex = headers.indexOf("ID");
  if (idIndex === -1) idIndex = 0;

  if (action === 'insert') {
    if (!payload.ID) payload.ID = generateUUID();

    // Upsert: verifica se já existe
    var existingRow = -1;
    for (var i = 1; i < values.length; i++) {
      if (values[i][idIndex] == payload.ID) {
        existingRow = i + 1;
        break;
      }
    }

    var row = headers.map(function(h) {
      return payload[h] !== undefined ? payload[h] : '';
    });

    if (existingRow !== -1) {
      sheet.getRange(existingRow, 1, 1, headers.length).setValues([row]);
      logAction(ss, 'UPDATE_UPSERT', table, 'ID: ' + payload.ID);
    } else {
      sheet.appendRow(row);
      logAction(ss, 'INSERT', table, 'ID: ' + payload.ID);
    }
    return { status: 'success', id: payload.ID };
  }

  if (action === 'update') {
    var targetId = payload.ID || payload.id;
    for (var j = 1; j < values.length; j++) {
      if (values[j][idIndex] == targetId) {
        var rowData = values[j];
        headers.forEach(function(h, colIdx) {
          if (payload[h] !== undefined) {
            rowData[colIdx] = payload[h];
          }
        });
        sheet.getRange(j + 1, 1, 1, headers.length).setValues([rowData]);
        logAction(ss, 'UPDATE', table, 'ID: ' + targetId);
        return { status: 'success', id: targetId };
      }
    }
    // Caso não exista, realiza append
    var newRow = headers.map(function(h) { return payload[h] !== undefined ? payload[h] : ''; });
    sheet.appendRow(newRow);
    return { status: 'success', id: targetId };
  }

  if (action === 'delete') {
    var delId = payload.ID || payload.id;
    for (var k = 1; k < values.length; k++) {
      if (values[k][idIndex] == delId) {
        sheet.deleteRow(k + 1);
        logAction(ss, 'DELETE', table, 'ID: ' + delId);
        return { status: 'success', id: delId };
      }
    }
    return { status: 'success', message: 'Registro não encontrado para exclusão' };
  }

  return { status: 'error', message: 'Ação não suportada: ' + action };
}

/**
 * Lê todas as linhas de uma aba e converte em array de objetos JSON
 */
function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    result.push(obj);
  }
  return result;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function logAction(ss, acao, tabela, detalhe) {
  try {
    var sheet = ss.getSheetByName('Logs');
    if (sheet) {
      sheet.appendRow([generateUUID(), new Date().toISOString(), 'Web Client', acao + ' em ' + tabela, detalhe]);
    }
  } catch (e) {}
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
`;

// Exportações legadas para compatibilidade
export const GAS_MILESTONE_1_SETUP_CODE = GAS_UNIFIED_PRODUCTION_CODE;
export const GAS_MILESTONE_2_3_API_CODE = GAS_UNIFIED_PRODUCTION_CODE;
