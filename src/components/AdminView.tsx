import React, { useState } from 'react';
import { 
  Lock, 
  LogOut, 
  ShieldCheck, 
  HardDrive, 
  Code2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ChevronRight,
  ArrowLeft,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { storage } from '../services/storage';
import { ViewTab } from '../types';
import { useToast } from '../context/ToastContext';

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => storage.isAdminLoggedIn());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin settings state
  const [endpointInput, setEndpointInput] = useState(storage.getGasEndpoint());
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(storage.getGasSpreadsheetId());
  const [showSensitiveConfig, setShowSensitiveConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);

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
    setSaveSuccess(true);
    showToast('Endpoint salvo. Detectando a planilha...', 'success');
    // O ID vem do proprio endpoint; trocar de endpoint troca de planilha.
    storage.refreshBackendIdentity().then((info) => {
      if (info) {
        setSpreadsheetIdInput(info.spreadsheetId);
        showToast(`Conectado a "${info.spreadsheetName || info.spreadsheetId}"`, 'success');
      } else {
        showToast('Nao foi possivel falar com esse endpoint. Confira a URL /exec.', 'warning');
      }
      onDataChanged();
    });
    setTimeout(() => setSaveSuccess(false), 3000);
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

      {/* Database Connection Section (Google Sheets & Apps Script) */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Banco de Dados da Planilha Google
              </h3>
              <p className="text-xs text-slate-400">
                Conecta todos os celulares e computadores da equipe à mesma planilha
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-emerald-950 text-emerald-400 border-emerald-500/40">
            • GOOGLE SHEETS ATIVO
          </span>
        </div>

        <div className="p-3.5 bg-[#0a0a0a] border border-slate-800/80 rounded-2xl text-xs text-slate-300 space-y-1.5">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Como funciona para toda a equipe (Bianca, vocalistas e músicos):
          </p>
          <p className="text-slate-400">
            Qualquer integrante que abrir o app no celular ou computador acessa automaticamente este mesmo banco de dados. <strong>Ninguém precisa fazer login no Google</strong> nem autorizar permissões.
          </p>
        </div>

        {/* Quick Link to open spreadsheet in Google Sheets */}
        {currentSpreadsheetUrl && (
          <div className="pt-1">
            <a
              href={currentSpreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#202020] border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Abrir Planilha no Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        )}

        <form onSubmit={handleSaveConnection} className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Configurações da Conexão
            </label>
            <button
              type="button"
              onClick={() => setShowSensitiveConfig(!showSensitiveConfig)}
              className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 underline cursor-pointer"
            >
              {showSensitiveConfig ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showSensitiveConfig ? 'Ocultar' : 'Exibir Detalhes'}</span>
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              URL da Web App Executável (Google Apps Script)
            </label>
            <input
              type={showSensitiveConfig ? 'text' : 'password'}
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value.trim())}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00] font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400 block">
                Planilha conectada
              </label>
              <span className="text-[10px] text-slate-500">Detectada pelo endpoint</span>
            </div>
            <div className="w-full bg-[#0a0a0a] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 break-all">
              {spreadsheetIdInput
                ? (showSensitiveConfig ? spreadsheetIdInput : '•'.repeat(24))
                : 'aguardando primeira sincronização…'}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              O app pergunta ao endpoint qual planilha ele serve, então não há
              o que configurar aqui. Era justamente ter esse campo separado que
              permitia o app gravar em duas planilhas diferentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenGasModal}
                className="text-xs font-bold text-[#FF4D00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Ver Código do Script</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={async () => {
                  setIsSyncing(true);
                  showToast('Sincronizando com a planilha...', 'info');
                  const res = await storage.syncWithGas();
                  setIsSyncing(false);
                  if (res.success) {
                    showToast('Sincronização concluída com sucesso!', 'success');
                  } else {
                    showToast(res.message || 'Erro ao sincronizar', 'warning');
                  }
                  onDataChanged();
                }}
                className="py-2.5 px-3.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] disabled:opacity-50 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>

              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                Salvar Conexão
              </button>
            </div>
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#FF4D00]" />
            Status do Banco de Dados & Registros
          </h3>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Produção Ativa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-[#080808] border border-slate-800 p-3 rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Músicas</span>
            <span className="text-xl font-black text-white">{totalMusicas}</span>
          </div>
          <div className="bg-[#080808] border border-slate-800 p-3 rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Versões</span>
            <span className="text-xl font-black text-white">{totalVersoes}</span>
          </div>
          <div className="bg-[#080808] border border-slate-800 p-3 rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Cultos</span>
            <span className="text-xl font-black text-white">{totalCultos}</span>
          </div>
          <div className="bg-[#080808] border border-slate-800 p-3 rounded-2xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Integrantes</span>
            <span className="text-xl font-black text-white">{totalIntegrantes}</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#080808] border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">
            Todas as alterações, adições e exclusões são salvas e sincronizadas em tempo real.
          </span>
          <button
            onClick={async () => {
              setIsSyncing(true);
              showToast('Sincronizando com a planilha...', 'info');
              const res = await storage.syncWithGas();
              setIsSyncing(false);
              if (res.success) {
                showToast('Sincronização concluída com sucesso!', 'success');
              } else {
                showToast(res.message || 'Erro ao sincronizar', 'warning');
              }
              onDataChanged();
            }}
            disabled={isSyncing}
            className="py-1.5 px-3 rounded-xl bg-[#181818] hover:bg-[#222] border border-slate-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Verificar Planilha'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
