// Google Apps Script Source Code for TP Flame Platform
// Milestone 1: Script de Setup Inicial do Banco de Dados no Google Sheets

export const GAS_MILESTONE_1_SETUP_CODE = `/**
 * ============================================================================
 * PLATAFORMA TP FLAME - MILESTONE 1: SCRIPT DE SETUP INICIAL (Google Apps Script)
 * ============================================================================
 * Instruções de Uso:
 * 1. Acesse https://script.google.com e crie um "Novo projeto".
 * 2. Cole todo este código no arquivo 'Código.gs'.
 * 3. Execute a função 'setupDatabase()'.
 * 4. O script criará a Planilha "TP Flame - Banco de Dados" no seu Google Drive
 *    com todas as 10 abas e cabeçalhos formatados com UUIDs de exemplo!
 * 5. Copie a ID da planilha gerada e cole nas configurações da plataforma Web.
 */

function setupDatabase() {
  var spreadsheetName = "TP Flame - Banco de Dados V1";
  var ss = SpreadsheetApp.create(spreadsheetName);
  Logger.log("Planilha criada com sucesso! ID: " + ss.getId());
  Logger.log("URL da Planilha: " + ss.getUrl());

  // Definindo o esquema das 10 tabelas
  var schema = {
    "Config": ["Chave", "Valor", "Descricao"],
    "Musicas": ["ID", "Nome", "Artista", "Categoria"],
    "Versoes": ["ID", "ID_Musica", "Nome_Versao", "Tom", "Letra", "Estrutura", "Obs"],
    "Arquivos": ["ID", "ID_Versao", "Tipo", "URL"],
    "Notas": ["ID", "ID_Versao", "Instrumento", "Observacao"],
    "Cultos": ["ID", "Data", "Nome_Evento", "Status"],
    "Repertorio": ["ID", "ID_Culto", "ID_Versao", "Ordem"],
    "Integrantes": ["ID", "Nome", "Funcao", "Email"],
    "Historico": ["ID", "ID_Versao", "ID_Culto", "Data_Execucao"],
    "Logs": ["ID", "Data", "Usuario", "Acao", "Registro_Afetado"]
  };

  // Remover a aba padrão 'Página1' ou 'Sheet1' no final
  var defaultSheet = ss.getSheets()[0];

  // Criar cada aba com seu cabeçalho e formatação visual
  Object.keys(schema).forEach(function(sheetName) {
    var sheet = ss.insertSheet(sheetName);
    var headers = schema[sheetName];

    // Inserir cabeçalho
    sheet.appendRow(headers);

    // Formatar cabeçalho: Fundo escuro, texto branco, negrito, congelado
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1E1E2E")
               .setFontColor("#FFFFFF")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");

    sheet.setFrozenRows(1);
    
    // Auto-ajustar largura das colunas
    for (var col = 1; col <= headers.length; col++) {
      sheet.setColumnWidth(col, 160);
    }
  });

  // Remover a aba inicial
  ss.deleteSheet(defaultSheet);

  // Inserir dados de configuração inicial
  var configSheet = ss.getSheetByName("Config");
  configSheet.appendRow(["PLATFORM_NAME", "TP Flame", "Nome da Plataforma"]);
  configSheet.appendRow(["VERSION", "V1.0.0", "Versão do Sistema"]);
  configSheet.appendRow(["CREATED_AT", new Date().toISOString(), "Data de Instalação"]);

  // Inserir dados de exemplo para teste do Milestone 1
  seedInitialData(ss);

  // Gravar Log de Inicialização
  var logsSheet = ss.getSheetByName("Logs");
  logsSheet.appendRow([
    generateUUID(),
    new Date().toISOString(),
    "Sistema (Setup)",
    "SETUP_DATABASE",
    "Banco de Dados inicializado com 10 abas"
  ]);

  Logger.log("=== SETUP CONCLUÍDO COM SUCESSO ===");
  Logger.log("Planilha criada no Google Drive com ID: " + ss.getId());
  return {
    spreadsheetId: ss.getId(),
    url: ss.getUrl()
  };
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function seedInitialData(ss) {
  var mus1Id = generateUUID();
  var ver1Id = generateUUID();
  var culto1Id = generateUUID();

  // Inserir Música Exemplo
  ss.getSheetByName("Musicas").appendRow([mus1Id, "Ruja o Leão", "Florianópolis House of Prayer", "Adoração"]);
  
  // Inserir Versão Exemplo
  ss.getSheetByName("Versoes").appendRow([
    ver1Id, 
    mus1Id, 
    "Versão Oficial (Original)", 
    "E", 
    "[E] Sobre o trono de glória [B] Tu estás sentado [C#m] vestido de majestade [A]", 
    "INTRO - V1 - C - V2 - C - PONTE - OUTRO", 
    "Aumentar dinâmica na Ponte"
  ]);

  // Inserir Arquivos
  ss.getSheetByName("Arquivos").appendRow([generateUUID(), ver1Id, "Spotify", "https://open.spotify.com"]);
  ss.getSheetByName("Arquivos").appendRow([generateUUID(), ver1Id, "Youtube", "https://youtube.com"]);

  // Inserir Notas
  ss.getSheetByName("Notas").appendRow([generateUUID(), ver1Id, "Teclado", "Entrar apenas com Pad suave na V1, piano entra na V2"]);
  ss.getSheetByName("Notas").appendRow([generateUUID(), ver1Id, "Guitarra", "Distorção pesada na ponte com overdrive e shimmer delay"]);

  // Inserir Culto
  ss.getSheetByName("Cultos").appendRow([culto1Id, "2026-08-10T19:00", "Culto de Domingo - Noite", "Em Preparação"]);

  // Inserir Repertório
  ss.getSheetByName("Repertorio").appendRow([generateUUID(), culto1Id, ver1Id, 1]);

  // Inserir Integrantes
  ss.getSheetByName("Integrantes").appendRow([generateUUID(), "Davi Silva", "Vocal / Violão", "davi@tpflame.org"]);
  ss.getSheetByName("Integrantes").appendRow([generateUUID(), "Sarah Costa", "Teclado", "sarah@tpflame.org"]);
}
`;

export const GAS_MILESTONE_2_3_API_CODE = `/**
 * ============================================================================
 * PLATAFORMA TP FLAME - BACKEND API (Google Apps Script - doGet / doPost)
 * ============================================================================
 * Publicar como 'Web App' com permissão: "Qualquer pessoa" (Anyone)
 */

var SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_SUA_PLANILHA";

function doGet(e) {
  var action = e.parameter.action || 'getAll';
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
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
    
    if (action === 'search') {
      var query = (e.parameter.q || '').toLowerCase();
      var musicas = getSheetData(ss, 'Musicas');
      var versoes = getSheetData(ss, 'Versoes');
      
      var filteredMusicas = musicas.filter(function(m) {
        return m.Nome.toLowerCase().indexOf(query) !== -1 ||
               m.Artista.toLowerCase().indexOf(query) !== -1 ||
               m.Categoria.toLowerCase().indexOf(query) !== -1;
      });
      
      return createJsonResponse({ status: 'success', data: filteredMusicas });
    }
    
    return createJsonResponse({ status: 'error', message: 'Ação não reconhecida' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var table = body.table;
    var payload = body.data;
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(table);
    
    if (!sheet) {
      return createJsonResponse({ status: 'error', message: 'Tabela não encontrada: ' + table });
    }
    
    if (action === 'insert') {
      if (!payload.ID) payload.ID = generateUUID();
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var row = headers.map(function(h) { return payload[h] !== undefined ? payload[h] : ''; });
      sheet.appendRow(row);
      logAction(ss, 'INSERT', table, 'ID: ' + payload.ID);
      return createJsonResponse({ status: 'success', id: payload.ID });
    }
    
    return createJsonResponse({ status: 'error', message: 'Ação do POST não suportada' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

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
  var sheet = ss.getSheetByName('Logs');
  if (sheet) {
    sheet.appendRow([generateUUID(), new Date().toISOString(), 'Web Client', acao + ' em ' + tabela, detalhe]);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
`;
