import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Server, 
  HardDrive, 
  Trash2, 
  RotateCcw, 
  Code2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ChevronRight,
  ArrowLeft,
  FileSpreadsheet,
  ExternalLink,
  PlusCircle,
  FolderOpen,
  CloudCheck,
  AlertCircle
} from 'lucide-react';
import { storage } from '../services/storage';
import { ViewTab } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { 
  googleSignIn, 
  googleLogout, 
  getCurrentUser, 
  getAccessToken, 
  initAuth 
} from '../services/googleAuth';
import { createTPFlameSpreadsheet } from '../services/googleSheetsApi';
import { User } from 'firebase/auth';

interface AdminViewProps {
  onOpenGasModal: () => void;
  onDataChanged: () => void;
  totalMusicas: number;
  totalVersoes: number;
  totalCultos: number;
  totalIntegrantes: number;
  onNavigate?: (tab: ViewTab) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  onOpenGasModal,
  onDataChanged,
  totalMusicas,
  totalVersoes,
  totalCultos,
  totalIntegrantes,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => storage.isAdminLoggedIn());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Google OAuth User State
  const [googleUser, setGoogleUser] = useState<User | null>(getCurrentUser());
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isCreatingInDrive, setIsCreatingInDrive] = useState(false);

  // Admin settings state
  const [endpointInput, setEndpointInput] = useState(storage.getGasEndpoint());
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(storage.getGasSpreadsheetId());
  const [spreadsheetName, setSpreadsheetName] = useState(storage.getSpreadsheetName());
  const [showSensitiveConfig, setShowSensitiveConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);

  useEffect(() => {
    const unsub = initAuth(
      (u) => setGoogleUser(u),
      () => setGoogleUser(null)
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = storage.loginAdmin(passwordInput);
    if (success) {
      setIsLoggedIn(true);
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Senha incorreta. Tente novamente.');
    }
  };

  const handleLogout = () => {
    storage.logoutAdmin();
    setIsLoggedIn(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        showToast('Autenticado com a conta Google com sucesso!', 'success');
        onDataChanged();
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha ao autenticar com o Google', 'error');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    showToast('Conta Google desconectada.', 'info');
    onDataChanged();
  };

  const handleCreateSpreadsheetInDrive = async () => {
    const token = getAccessToken();
    if (!token) {
      showToast('Faça login com o Google primeiro!', 'warning');
      return;
    }

    setIsCreatingInDrive(true);
    try {
      const result = await createTPFlameSpreadsheet(token);
      storage.setGasSpreadsheetId(result.id);
      storage.setSpreadsheetName(result.name);
      setSpreadsheetIdInput(result.id);
      setSpreadsheetName(result.name);
      showToast(`Planilha criada com sucesso no seu Google Drive!`, 'success');
      await storage.syncWithGas();
      onDataChanged();
    } catch (err: any) {
      showToast(err?.message || 'Erro criando planilha no Drive', 'error');
    } finally {
      setIsCreatingInDrive(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    storage.setAdminPassword(newPassword.trim());
    setChangePassSuccess(true);
    setNewPassword('');
    setTimeout(() => setChangePassSuccess(false), 3000);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setGasEndpoint(endpointInput);
    storage.setGasSpreadsheetId(spreadsheetIdInput);
    setSaveSuccess(true);
    showToast('Configurações salvas com sucesso!', 'success');
    setTimeout(() => setSaveSuccess(false), 3000);
    onDataChanged();
  };

  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [clearConfirmInput, setClearConfirmInput] = useState('');

  const handleClearAllData = () => {
    setClearConfirmInput('');
    setShowClearAllConfirm(true);
  };

  const handleExecuteClearAll = () => {
    if (clearConfirmInput.trim().toUpperCase() === 'ZERAR') {
      storage.clearAllData();
      onDataChanged();
      showToast('Banco de dados zerado com sucesso!', 'info');
      setActionSuccessMsg('✓ Banco de dados zerado com sucesso!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      setShowClearAllConfirm(false);
    } else {
      showToast('Palavra de confirmação incorreta. Digite ZERAR.', 'warning');
    }
  };

  const handleResetToDefaults = () => {
    setShowResetConfirm(true);
  };

  // If not logged in, render Admin Login Card
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        {onNavigate && (
          <button
            onClick={() => onNavigate('mais')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4D00] hover:underline bg-[#121212] border border-slate-800/80 px-3 py-2 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Mais</span>
          </button>
        )}

        <div className="bg-[#121212] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF4D00]" />
          
          <div className="w-16 h-16 rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Área do Administrador
            </h2>
            <p className="text-xs text-slate-400">
              Digite a senha de administrador para gerenciar o Google Sheets
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Senha do Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00] transition-colors pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-xs text-red-400 font-medium bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>Entrar na Administração</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const hasGoogleToken = Boolean(getAccessToken());
  const currentSpreadsheetUrl = spreadsheetIdInput ? `https://docs.google.com/spreadsheets/d/${spreadsheetIdInput}/edit` : null;

  // Admin Dashboard (Authenticated)
  return (
    <div className="space-y-6 pb-28">
      {onNavigate && (
        <button
          onClick={() => onNavigate('mais')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4D00] hover:underline bg-[#121212] border border-slate-800/80 px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Mais</span>
        </button>
      )}

      {/* Header Banner */}
      <div className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white leading-tight">
              Painel do Administrador
            </h2>
            <p className="text-xs text-slate-400">
              Modo de Gerenciamento & Integração Google Workspace / Sheets
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="py-2 px-3.5 rounded-xl bg-[#1a1a1a] hover:bg-red-950/60 text-slate-300 hover:text-red-400 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Administração</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl text-xs font-bold text-center">
          {actionSuccessMsg}
        </div>
      )}

      {/* Google Workspace Direct Integration Hub */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Google Workspace & Sheets Hub
            </h3>
          </div>
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
              hasGoogleToken
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                : 'bg-[#181818] text-[#FF4D00] border-[#FF4D00]/30'
            }`}
          >
            {hasGoogleToken ? '• GOOGLE OAUTH ATIVO' : '• LOGIN PENDENTE'}
          </span>
        </div>

        {/* Google User Info / Login */}
        <div className="p-4 bg-[#080808] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {googleUser ? (
            <div className="flex items-center gap-3">
              {googleUser.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt={googleUser.displayName || 'Google'} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FF4D00] text-slate-950 font-black flex items-center justify-center">
                  G
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-white">
                  {googleUser.displayName || 'Conta Google'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {googleUser.email}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-bold text-white">
                Autentique com a sua Conta Google
              </h4>
              <p className="text-[11px] text-slate-400">
                Acesse planilhas diretamente pelo Google Sheets API v4 e Drive API v3
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {googleUser ? (
              <button
                onClick={handleGoogleLogout}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingInGoogle}
                className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingInGoogle ? 'Entrando...' : 'Entrar com Google'}</span>
              </button>
            )}

            <button
              onClick={onOpenGasModal}
              className="py-2 px-3 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Gerenciar Planilhas</span>
            </button>
          </div>
        </div>

        {/* Quick Spreadsheet Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleCreateSpreadsheetInDrive}
            disabled={isCreatingInDrive || !hasGoogleToken}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#e04400] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreatingInDrive ? 'Criando no Google Drive...' : 'Criar Banco de Dados no Google Drive'}</span>
          </button>

          {currentSpreadsheetUrl && (
            <a
              href={currentSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-[#181818] hover:bg-[#222] border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Abrir Planilha no Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>
      </section>

      {/* Manual GAS Endpoint Section */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#FF4D00]" />
            <h3 className="text-sm font-bold text-white">
              Google Apps Script (Web App Endpoint)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowSensitiveConfig(!showSensitiveConfig)}
            className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 underline"
          >
            {showSensitiveConfig ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showSensitiveConfig ? 'Ocultar' : 'Exibir'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveConnection} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              URL da Web App Executável (Google Apps Script)
            </label>
            <input
              type={showSensitiveConfig ? 'text' : 'password'}
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00] font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              ID da Planilha Google (Spreadsheet ID)
            </label>
            <input
              type={showSensitiveConfig ? 'text' : 'password'}
              value={spreadsheetIdInput}
              onChange={(e) => setSpreadsheetIdInput(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00] font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onOpenGasModal}
              className="text-xs font-bold text-[#FF4D00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Instruções & Scripts do GAS</span>
            </button>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md cursor-pointer"
            >
              Salvar Conexão
            </button>
          </div>

          {saveSuccess && (
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Conexão salva com sucesso!
            </p>
          )}
        </form>
      </section>

      {/* Change Admin Password */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#FF4D00]" />
          Alterar Senha de Administrador
        </h3>

        <form onSubmit={handleChangePassword} className="flex gap-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha do admin..."
            className="flex-1 bg-[#080808] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
          />
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-[#181818] border border-slate-700 hover:border-[#FF4D00] text-white font-bold text-xs cursor-pointer"
          >
            Atualizar
          </button>
        </form>

        {changePassSuccess && (
          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Senha atualizada!
          </p>
        )}
      </section>

      {/* Database Actions */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#FF4D00]" />
          Manutenção do Banco de Dados
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-[#080808] border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block">Músicas</span>
            <span className="text-base font-extrabold text-white">{totalMusicas}</span>
          </div>
          <div className="bg-[#080808] border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block">Versões</span>
            <span className="text-base font-extrabold text-white">{totalVersoes}</span>
          </div>
          <div className="bg-[#080808] border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block">Cultos</span>
            <span className="text-base font-extrabold text-white">{totalCultos}</span>
          </div>
          <div className="bg-[#080808] border border-slate-800 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px] block">Integrantes</span>
            <span className="text-base font-extrabold text-white">{totalIntegrantes}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleResetToDefaults}
            className="flex-1 py-3 px-4 rounded-xl bg-[#181818] hover:bg-[#202020] border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#FF4D00]" />
            <span>Restaurar Dados de Exemplo</span>
          </button>

          <button
            onClick={handleClearAllData}
            className="py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Zerar Banco de Dados</span>
          </button>
        </div>
      </section>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Restaurar Dados de Exemplo?"
        message="Isso redefinirá todas as músicas, cultos e integrantes locais para o conjunto inicial de demonstração. Deseja prosseguir?"
        confirmText="Restaurar"
        isDanger={true}
        onConfirm={() => {
          storage.resetToDefaults();
          onDataChanged();
          showToast('Dados de exemplo restaurados!', 'info');
          setActionSuccessMsg('✓ Dados de exemplo restaurados!');
          setTimeout(() => setActionSuccessMsg(''), 4000);
        }}
        onClose={() => setShowResetConfirm(false)}
      />

      {/* Confirm Clear All Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-red-500/40 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Zerar Todo o Banco de Dados?
                </h3>
                <p className="text-xs text-slate-400">
                  Atenção: Esta ação vai apagar todas as tabelas locais de forma irreversível.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#080808] border border-slate-800 rounded-xl space-y-2">
              <p className="text-xs text-slate-300">
                Para confirmar, digite <strong className="text-red-400 font-mono">ZERAR</strong> abaixo:
              </p>
              <input
                type="text"
                value={clearConfirmInput}
                onChange={(e) => setClearConfirmInput(e.target.value)}
                placeholder="Digite ZERAR"
                className="w-full bg-[#121212] border border-slate-700 rounded-xl p-2.5 text-xs text-white uppercase font-mono focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#181818] text-slate-400 text-xs font-bold hover:bg-[#222]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={clearConfirmInput.trim().toUpperCase() !== 'ZERAR'}
                onClick={handleExecuteClearAll}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
