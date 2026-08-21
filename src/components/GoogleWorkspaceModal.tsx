import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  ShieldCheck, 
  Database, 
  Terminal, 
  Eye, 
  EyeOff, 
  PlusCircle, 
  RefreshCw, 
  CheckCircle2, 
  FolderOpen, 
  LogOut, 
  Sparkles,
  AlertCircle,
  CloudCheck
} from 'lucide-react';
import { GAS_UNIFIED_PRODUCTION_CODE } from '../data/gasScript';
import { storage } from '../services/storage';
import { 
  googleSignIn, 
  googleLogout, 
  getCurrentUser, 
  getAccessToken, 
  initAuth 
} from '../services/googleAuth';
import { 
  listUserSpreadsheets, 
  createTPFlameSpreadsheet, 
  DriveSpreadsheetFile 
} from '../services/googleSheetsApi';
import { User } from 'firebase/auth';

interface GoogleWorkspaceModalProps {
  onClose: () => void;
  onDataChanged: () => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({ onClose, onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'google_oauth' | 'drive_picker' | 'gas_scripts' | 'manual_endpoint'>('google_oauth');
  
  // Auth state
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet state
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(storage.getGasSpreadsheetId());
  const [spreadsheetName, setSpreadsheetName] = useState(storage.getSpreadsheetName());
  const [endpointInput, setEndpointInput] = useState(storage.getGasEndpoint());
  const [showSensitive, setShowSensitive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drive Picker & Creation state
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false);
  const [creationSuccessMsg, setCreationSuccessMsg] = useState<string | null>(null);

  // Code Copy
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        onDataChanged();
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err?.message || 'Falha ao autenticar com a conta Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleLogout();
    setUser(null);
    onDataChanged();
  };

  /**
   * IMPORTANTE: nenhuma função aqui embaixo troca a planilha ativa do app.
   *
   * Isso é proposital. O ID da planilha é sempre resolvido a partir do
   * endpoint configurado (ver storage.refreshBackendIdentity()) — nunca
   * escolhido à mão via OAuth. Deixar essa tela apontar para uma planilha
   * arbitrária do Drive foi exatamente o bug que fez o app gravar em três
   * planilhas diferentes ao mesmo tempo, corrigido na Fase 1.
   *
   * "Criar" e "Selecionar" abaixo só preparam uma planilha nova com o
   * esquema correto; conectar de fato é sempre feito apontando o ENDPOINT
   * (aba "Endpoint GAS"), que é o único lugar onde a planilha ativa muda.
   */

  const handleCreateInDrive = async () => {
    const token = getAccessToken();
    if (!token) {
      setAuthError('Faça login com a sua Conta Google primeiro para criar a planilha no seu Google Drive.');
      return;
    }

    setIsCreatingSpreadsheet(true);
    setCreationSuccessMsg(null);
    setAuthError(null);

    try {
      const result = await createTPFlameSpreadsheet(token);
      setCreationSuccessMsg(
        `Planilha "${result.name}" criada. Próximo passo: abra ${result.url}, vá em ` +
        `Extensões > Apps Script, cole o código da aba "Scripts", publique como App da Web ` +
        `e cole a URL /exec na aba "Endpoint GAS" — é isso que conecta de verdade.`
      );
    } catch (err: any) {
      console.error('Erro criando planilha:', err);
      setAuthError(err?.message || 'Erro ao criar planilha no Google Drive');
    } finally {
      setIsCreatingSpreadsheet(false);
    }
  };

  const handleFetchDriveFiles = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsLoadingFiles(true);
    setAuthError(null);
    try {
      const files = await listUserSpreadsheets(token);
      setDriveFiles(files);
      setActiveTab('drive_picker');
    } catch (err: any) {
      console.error('Erro listando planilhas:', err);
      setAuthError(err?.message || 'Erro ao listar planilhas do Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = storage.setGasEndpoint(endpointInput);
    if (!saved) {
      setAuthError('URL inválida. Copie exatamente a URL /exec do Apps Script, sem cortar nem editar.');
      return;
    }

    setAuthError(null);
    setSaveSuccess(true);
    storage.refreshBackendIdentity().then((info) => {
      if (info) {
        setSpreadsheetIdInput(info.spreadsheetId);
        setSpreadsheetName(info.spreadsheetName);
      }
      onDataChanged();
    });
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const currentGasCode = GAS_UNIFIED_PRODUCTION_CODE;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentGasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentToken = getAccessToken();
  const currentSpreadsheetId = storage.getGasSpreadsheetId();
  const currentSpreadsheetUrl = currentSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit` : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#101010] border border-slate-800 w-full max-w-3xl max-h-[92vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white leading-none">
                  Google Workspace & Sheets
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Google Drive API v3 + Sheets API v4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sincronização direta e segura com o seu Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-800 px-4 pt-3 flex items-center gap-2 bg-[#0c0c0c] overflow-x-auto">
          <button
            onClick={() => setActiveTab('google_oauth')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'google_oauth'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Google Account & Sheets</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('drive_picker');
              if (driveFiles.length === 0 && currentToken) {
                handleFetchDriveFiles();
              }
            }}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'drive_picker'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Planilhas no Meu Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('manual_endpoint')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'manual_endpoint'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Endpoint GAS (Web App)</span>
          </button>

          <button
            onClick={() => setActiveTab('gas_scripts')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'gas_scripts'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Scripts do Google Apps Script</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#101010]">
          
          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {creationSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{creationSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE ACCOUNT & DIRECT SHEETS */}
          {activeTab === 'google_oauth' && (
            <div className="space-y-5">
              {/* Account Connection Status Card */}
              <div className="bg-[#161616] border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Conta Google Conectada
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Acesso autenticado ao Google Sheets & Google Drive
                    </p>
                  </div>

                  {user ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Conectado
                      </span>
                      <button
                        onClick={handleGoogleSignOut}
                        className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                        title="Desconectar Conta Google"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-bold">
                      Não Autenticado
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="flex items-center gap-3 p-3 bg-[#0c0c0c] border border-slate-800 rounded-2xl">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Usuário'} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#FF4D00] text-slate-950 font-black flex items-center justify-center">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {user.displayName || 'Conta Google Conectada'}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#0c0c0c] border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-xs text-slate-400 max-w-md">
                      Conecte sua conta do Google para ler, criar e sincronizar sua planilha diretamente pelo Google Sheets API v4.
                    </p>

                    {/* Official Sign in with Google Button */}
                    <button
                      id="google-signin-btn"
                      onClick={handleGoogleSignIn}
                      disabled={isLoggingIn}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-3 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>{isLoggingIn ? 'Autenticando...' : 'Entrar com Google'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Active Spreadsheet Details */}
              <div className="bg-[#161616] border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#FF4D00]" />
                    Planilha Conectada
                  </h3>

                  {currentSpreadsheetUrl && (
                    <a
                      href={currentSpreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#FF4D00] hover:underline flex items-center gap-1"
                    >
                      <span>Abrir no Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="p-3.5 bg-[#0c0c0c] border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Nome da Planilha:</span>
                    <span className="text-white font-bold">{spreadsheetName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Spreadsheet ID:</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-[240px] sm:max-w-[320px]">
                      {currentSpreadsheetId || 'Nenhuma configurada'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Modo Ativo:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CloudCheck className="w-3.5 h-3.5" />
                      {storage.getActiveSyncMode() === 'google_sheets_direct' ? 'Google Sheets API v4 (Direto)' : 'Google Apps Script (Web App)'}
                    </span>
                  </div>
                </div>

                {/* Direct Actions (Create or Pick) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleCreateInDrive}
                    disabled={isCreatingSpreadsheet}
                    className="p-3 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#e04400] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isCreatingSpreadsheet ? 'Criando no Google Drive...' : 'Criar Nova Planilha no Drive'}</span>
                  </button>

                  <button
                    onClick={handleFetchDriveFiles}
                    disabled={isLoadingFiles}
                    className="p-3 rounded-2xl bg-[#1f1f1f] hover:bg-[#282828] border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <FolderOpen className="w-4 h-4 text-[#FF4D00]" />
                    <span>{isLoadingFiles ? 'Buscando arquivos...' : 'Selecionar do Meu Drive'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVE PICKER */}
          {activeTab === 'drive_picker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#FF4D00]" />
                    Planilhas Encontradas no Seu Google Drive
                  </h3>
                  <p className="text-xs text-slate-400">
                    Para usar uma destas, publique o Apps Script nela e conecte pela URL do endpoint
                  </p>
                </div>

                <button
                  onClick={handleFetchDriveFiles}
                  disabled={isLoadingFiles}
                  className="px-3 py-1.5 rounded-xl bg-[#181818] hover:bg-[#222] text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Atualizar Lista</span>
                </button>
              </div>

              {!currentToken ? (
                <div className="p-6 bg-[#0c0c0c] border border-slate-800 rounded-2xl text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    Faça login com a sua conta Google para listar as planilhas do seu Drive.
                  </p>
                  <button
                    onClick={handleGoogleSignIn}
                    className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs"
                  >
                    Entrar com Google
                  </button>
                </div>
              ) : driveFiles.length === 0 && !isLoadingFiles ? (
                <div className="p-8 bg-[#0c0c0c] border border-slate-800 rounded-2xl text-center space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Nenhuma planilha encontrada recentemente ou permissão pendente.
                  </p>
                  <button
                    onClick={handleCreateInDrive}
                    className="px-4 py-2 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs"
                  >
                    Criar "TP Flame - Banco de Dados" Agora
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 bg-[#141414] hover:bg-[#1a1a1a] border border-slate-800 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {file.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            ID: {file.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.id === currentSpreadsheetId ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                            Ativa agora
                          </span>
                        ) : (
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${file.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] border border-slate-700 text-white text-xs font-bold transition-all active:scale-95"
                          >
                            Abrir e configurar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL ENDPOINT */}
          {activeTab === 'manual_endpoint' && (
            <div className="space-y-4">
              <div className="bg-[#141414] border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#FF4D00]" />
                    Configuração Manual de Endpoint
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 underline"
                  >
                    {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSensitive ? 'Ocultar' : 'Exibir'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cole a URL do Web App central do Google Apps Script. A planilha é detectada
                  automaticamente a partir dela — não existe um segundo campo para configurar,
                  de propósito, para nunca mais divergir do endpoint.
                </p>
              </div>

              <form onSubmit={handleSaveConnection} className="space-y-3 bg-[#141414] p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Planilha conectada
                  </label>
                  <div className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-300 break-all">
                    {spreadsheetIdInput
                      ? (showSensitive ? spreadsheetIdInput : '•'.repeat(24))
                      : 'aguardando primeira sincronização…'}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    URL do Endpoint Google Apps Script (Web App)
                  </label>
                  <input
                    type={showSensitive ? 'text' : 'password'}
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                    ✓ Configurações salvas com sucesso!
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: GAS SCRIPTS */}
          {activeTab === 'gas_scripts' && (
            <div className="space-y-4">
              <div className="bg-[#141414] border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#FF4D00]" />
                  Script Unificado de Produção (Google Apps Script)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Este script contém tudo em um único arquivo: <strong>Setup Automático das 10 Abas</strong>, <strong>API Web App para Sincronização em Tempo Real</strong> e <strong>Rotina de Backup Automático</strong> no Google Drive.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Código.gs (Pronto para Implantação)
                </span>

                <button
                  onClick={handleCopyCode}
                  className="py-1.5 px-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Código Completo'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl border border-slate-800 bg-[#080808] overflow-hidden">
                <div className="bg-[#141414] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Código.gs</span>
                  <span>Google Apps Script V2 (Unificado)</span>
                </div>
                <pre className="p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[340px] leading-relaxed">
                  {currentGasCode}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
