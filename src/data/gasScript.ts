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
 * 5. repairDatabase(): Limpeza única — duplicatas, linhas vazias e excesso de logs.
 * ============================================================================
 * IMPORTANTE: ao alterar este script, é preciso REPUBLICAR a implantação
 * (Implantar > Gerenciar implantações > editar > Nova versão). Editar o
 * código sem republicar deixa a versão antiga no ar — foi o que aconteceu
 * antes: a versão publicada estava atrás da que está no repositório.
 * ============================================================================
 */

// Versão do esquema. Precisa bater com SCHEMA_VERSION em googleSheetsApi.ts;
// o app avisa quando a planilha está atrás do código.
var SCHEMA_VERSION = 3;

/**
 * Esquema das 10 tabelas.
 *
 * As três últimas colunas de quase toda tabela são de auditoria:
 *   Atualizado_Em  - ISO da última alteração, base para resolver conflito
 *   Atualizado_Por - quem alterou, para a equipe saber a quem perguntar
 *   Excluido_Em    - reservado para a lixeira (exclusão reversível)
 *
 * Logs não tem auditoria: log é imutável por definição.
 * Config não tem ID nem auditoria: é chave-valor.
 *
 * Não existe PIN de integrante nesta tabela. Houve uma tentativa de PIN por
 * perfil que nunca chegou a ter tela para defini-lo (dead code) e foi
 * removida em 27/08/2026 — ver docs/ARQUITETURA-DADOS.md. Se voltar a
 * existir, o mesmo motivo de antes continua valendo: esta planilha é lida
 * por um Web App público, e guardar PIN nela seria publicar a senha de
 * todo mundo.
 */
var DATABASE_SCHEMA = {
  "Config": ["Chave", "Valor", "Descricao"],
  "Musicas": ["ID", "Nome", "Artista", "Categoria", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
  "Versoes": ["ID", "ID_Musica", "Nome_Versao", "Tom", "BPM", "Compasso", "Letra", "Estrutura", "Obs", "Atualizado_Em", "Atualizado_Por", "Excluido_Em", "Modo"],
  "Arquivos": ["ID", "ID_Versao", "Tipo", "URL", "Nome", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
  "Notas": ["ID", "ID_Versao", "Instrumento", "Observacao", "Autor", "Titulo", "TipoNota", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
  "Cultos": ["ID", "Data", "Nome_Evento", "Status", "Observacoes", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
  "Repertorio": ["ID", "ID_Culto", "ID_Versao", "Ordem", "Dirigente", "Observacao_Culto", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
  "Integrantes": ["ID", "Nome", "Funcao", "Email", "Telefone", "Ativo", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
  "Historico": ["ID", "ID_Versao", "ID_Culto", "Data_Execucao", "Atualizado_Em", "Atualizado_Por", "Excluido_Em"],
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
 * 0. INSTALAÇÃO — execute ESTA função, uma vez, numa planilha nova.
 *
 * Faz tudo o que precisa ser feito e imprime o que você precisa saber:
 *   - cria e formata as 10 abas
 *   - liga o backup diário automático
 *   - mostra o ID e a URL desta planilha
 *
 * Depois disso, só falta publicar: Implantar > Nova implantação > App da Web,
 * com "Executar como: eu" e "Quem tem acesso: qualquer pessoa". Cole a URL
 * gerada no painel de administração do app. O app descobre a planilha sozinho
 * a partir dessa URL — não existe segundo lugar para configurar, e por isso
 * não existe como as duas configurações divergirem.
 */
function bootstrap() {
  var ss = getSpreadsheet();

  setupDatabase();

  try {
    setupDailyBackupTrigger();
  } catch (e) {
    Logger.log("AVISO: não foi possível criar o gatilho de backup: " + e);
  }

  var info = {
    status: "success",
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    schemaVersion: SCHEMA_VERSION,
    abas: Object.keys(DATABASE_SCHEMA).length,
    backupDiario: "03:00"
  };

  Logger.log("=========================================");
  Logger.log(" TP FLAME - INSTALAÇÃO CONCLUÍDA");
  Logger.log("=========================================");
  Logger.log(" Planilha : " + info.spreadsheetName);
  Logger.log(" ID       : " + info.spreadsheetId);
  Logger.log(" URL      : " + info.spreadsheetUrl);
  Logger.log(" Esquema  : v" + SCHEMA_VERSION + " (" + info.abas + " abas)");
  Logger.log("");
  Logger.log(" PROXIMO PASSO: Implantar > Nova implantacao > App da Web");
  Logger.log(" Executar como: eu | Quem tem acesso: qualquer pessoa");
  Logger.log(" Depois cole a URL /exec no painel admin do TP Flame.");
  Logger.log("=========================================");

  return info;
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

    // Identidade do backend. É daqui que o app descobre QUAL planilha este
    // endpoint serve, em vez de guardar um ID próprio que pode divergir.
    // Enquanto o app tinha o ID separado, ele gravava numa planilha estando
    // logado e em outra estando deslogado.
    if (action === 'whoami') {
      return createJsonResponse({
        status: 'success',
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        schemaVersion: SCHEMA_VERSION
      });
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
  // TRAVA DE CONCORRÊNCIA
  //
  // Toda operação aqui é ler-tudo -> alterar -> gravar. Sem trava, duas
  // pessoas salvando ao mesmo tempo executam o script em paralelo, cada uma
  // lendo a planilha antes da outra gravar, e a última sobrescreve a
  // primeira. Criar uma música dispara várias mutações de uma vez, então
  // isso acontece até com um único usuário.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse({
      status: 'error',
      message: 'Planilha ocupada por outra gravação. O app tentará de novo automaticamente.'
    });
  }

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
              writeRowsAsText(sh, 2, headers.length, rowsToAdd);
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
  } finally {
    lock.releaseLock();
  }
}

/**
 * Grava uma ou mais linhas SEMPRE como texto puro.
 *
 * Sem isso, o Google Sheets aplica a mesma detecção automática de tipo que
 * usa quando alguém digita direto na planilha: "4/4" (Compasso) virava uma
 * data (4 de abril), e um Nome como "123" virava número. setValues() sozinho
 * nunca protege contra isso — é preciso forçar o formato da célula para
 * texto ("@") ANTES de escrever, porque reformatar depois só muda a exibição,
 * o valor já corrompido continua salvo por baixo.
 *
 * Mesmo motivo do valueInputOption: RAW usado no caminho OAuth direto
 * (googleSheetsApi.ts) — os dois caminhos de escrita precisam da mesma
 * proteção, e por muito tempo só um deles tinha.
 */
function writeRowsAsText(sheet, startRow, numCols, rows) {
  var range = sheet.getRange(startRow, 1, rows.length, numCols);
  range.setNumberFormat('@');
  range.setValues(rows);
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
  var updatedAtIndex = headers.indexOf("Atualizado_Em");

  /**
   * RESOLUÇÃO DE CONFLITO POR TIMESTAMP (Fase 2)
   *
   * Duas pessoas podem editar o mesmo registro offline e sincronizar em
   * ordem diferente da que editaram. Sem isso, quem sincroniza por último
   * sempre vence — mesmo que sua edição seja mais antiga. Com isso, quem
   * editou por último (por horário real, não por ordem de chegada) vence.
   *
   * Se a linha na planilha já tem um Atualizado_Em mais novo que o payload
   * recebido, a escrita é recusada com status 'conflict' em vez de
   * sobrescrever. O cliente descarta a tentativa local e adota a versão da
   * planilha no próximo pull — perde a edição, mas nunca perde silenciosamente
   * a de outra pessoa.
   */
  function isPayloadStale(existingRow) {
    if (updatedAtIndex === -1) return false; // tabela sem auditoria (Config/Logs)
    var remoteTs = existingRow[updatedAtIndex];
    var incomingTs = payload['Atualizado_Em'];
    if (!remoteTs || !incomingTs) return false;
    var remoteTime = new Date(remoteTs).getTime();
    var incomingTime = new Date(incomingTs).getTime();
    if (isNaN(remoteTime) || isNaN(incomingTime)) return false;
    return remoteTime > incomingTime;
  }

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
      if (isPayloadStale(values[existingRow - 1])) {
        return { status: 'conflict', id: payload.ID, message: 'Já existe uma versão mais recente deste registro na planilha' };
      }
      writeRowsAsText(sheet, existingRow, headers.length, [row]);
    } else {
      writeRowsAsText(sheet, sheet.getLastRow() + 1, headers.length, [row]);
    }
    return { status: 'success', id: payload.ID };
  }

  if (action === 'update') {
    var targetId = payload.ID || payload.id;
    for (var j = 1; j < values.length; j++) {
      if (values[j][idIndex] == targetId) {
        if (isPayloadStale(values[j])) {
          return { status: 'conflict', id: targetId, message: 'Já existe uma versão mais recente deste registro na planilha' };
        }
        var rowData = values[j];
        headers.forEach(function(h, colIdx) {
          if (payload[h] !== undefined) {
            rowData[colIdx] = payload[h];
          }
        });
        writeRowsAsText(sheet, j + 1, headers.length, [rowData]);
        return { status: 'success', id: targetId };
      }
    }
    // Caso não exista, realiza append
    var newRow = headers.map(function(h) { return payload[h] !== undefined ? payload[h] : ''; });
    writeRowsAsText(sheet, sheet.getLastRow() + 1, headers.length, [newRow]);
    return { status: 'success', id: targetId };
  }

  if (action === 'delete') {
    var delId = payload.ID || payload.id;
    for (var k = 1; k < values.length; k++) {
      if (values[k][idIndex] == delId) {
        sheet.deleteRow(k + 1);
        return { status: 'success', id: delId };
      }
    }
    return { status: 'success', message: 'Registro não encontrado para exclusão' };
  }

  return { status: 'error', message: 'Ação não suportada: ' + action };
}

/**
 * 6. REPARO ÚNICO DA PLANILHA
 *
 * Execute UMA VEZ no editor do Apps Script (Executar > repairDatabase) para
 * limpar a sujeira acumulada pelos bugs corrigidos na Fase 1:
 *
 *  - linhas com ID duplicado (o app fazia append cego e gravava duas vezes)
 *  - linhas totalmente em branco (exclusões antigas só limpavam a linha)
 *  - excesso de logs (o app registrava a própria sincronização)
 *
 * Faz um backup antes de qualquer alteração. Só remove linhas; nunca edita
 * o conteúdo de uma linha que sobrevive.
 */
function repairDatabase() {
  var ss = getSpreadsheet();
  var LOGS_TO_KEEP = 200;
  var report = { backup: null, duplicatesRemoved: {}, blankRowsRemoved: {}, logsTruncated: 0 };

  // Rede de segurança: nada é removido antes de existir uma cópia.
  report.backup = createBackup().backupFileName;

  Object.keys(DATABASE_SCHEMA).forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return;

    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var idIndex = headers.indexOf("ID");

    var seenIds = {};
    var rowsToDelete = [];

    for (var i = 1; i < values.length; i++) {
      var row = values[i];

      var isBlank = row.every(function(cell) {
        return cell === '' || cell === null || cell === undefined;
      });
      if (isBlank) {
        rowsToDelete.push({ row: i + 1, reason: 'blank' });
        continue;
      }

      if (idIndex !== -1) {
        var id = String(row[idIndex]);
        if (id === '') continue;
        if (seenIds[id]) {
          rowsToDelete.push({ row: i + 1, reason: 'duplicate' });
        } else {
          seenIds[id] = true;
        }
      }
    }

    // De baixo para cima: apagar de cima desloca os índices das linhas seguintes.
    var dup = 0, blank = 0;
    for (var d = rowsToDelete.length - 1; d >= 0; d--) {
      sheet.deleteRow(rowsToDelete[d].row);
      if (rowsToDelete[d].reason === 'duplicate') dup++; else blank++;
    }

    if (dup > 0) report.duplicatesRemoved[sheetName] = dup;
    if (blank > 0) report.blankRowsRemoved[sheetName] = blank;
  });

  // Logs: mantém apenas os mais recentes.
  var logSheet = ss.getSheetByName('Logs');
  if (logSheet) {
    var totalLogRows = logSheet.getLastRow() - 1;
    if (totalLogRows > LOGS_TO_KEEP) {
      var excess = totalLogRows - LOGS_TO_KEEP;
      logSheet.deleteRows(2, excess);
      report.logsTruncated = excess;
    }
  }

  Logger.log(JSON.stringify(report, null, 2));
  return report;
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
