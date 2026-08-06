import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { storage } from '../services/storage';
import { ViewTab } from '../types';

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => storage.isAdminLoggedIn());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin settings state
  const [endpointInput, setEndpointInput] = useState(storage.getGasEndpoint());
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(storage.getGasSpreadsheetId());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Change password state
  const [newPassword, setNewPassword] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState(false);

  const isConnected = Boolean(endpointInput.trim());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = storage.loginAdmin(passwordInput);
    if (success) {
      setIsLoggedIn(true);
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Senha incorreta. Tente novamente (senha padrão: admin).');
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
    storage.setGasSpreadsheetId(spreadsheetIdInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onDataChanged();
  };

  const handleClearAllData = () => {
    const confirmText = window.prompt(
      'ATENÇÃO: Esta ação vai apagar TODAS as músicas, cultos, equipe e registros para deixar o sistema limpo!\n\nDigite ZERAR para confirmar:'
    );
    if (confirmText && confirmText.trim().toUpperCase() === 'ZERAR') {
      storage.clearAllData();
      onDataChanged();
      setActionSuccessMsg('✓ Banco de dados zerado com sucesso!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Deseja restaurar os dados de exemplo do TP Flame?')) {
      storage.resetToDefaults();
      onDataChanged();
      setActionSuccessMsg('✓ Dados de exemplo restaurados com sucesso.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  // If not logged in, render Admin Login Card
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        {/* Top Mobile Back Navigation */}
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
              Área Restrita (GAS)
            </h2>
            <p className="text-xs text-slate-400">
              Digite a senha de administrador para acessar o painel
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
              className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Entrar na Administração</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Senha padrão: <span className="font-mono text-[#FF4D00] font-bold">admin</span>
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard (Authenticated)
  return (
    <div className="space-y-6 pb-28">
      {/* Top Mobile Back Navigation */}
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
              Modo de Gerenciamento & Integração Google Sheets (SSOT)
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="py-2 px-3.5 rounded-xl bg-[#1a1a1a] hover:bg-red-950/60 text-slate-300 hover:text-red-400 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-3 rounded-2xl text-xs font-bold text-center">
          {actionSuccessMsg}
        </div>
      )}

      {/* Connection & Setup Google Apps Script */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#FF4D00]" />
            <h3 className="text-sm font-bold text-white">
              Integração Google Apps Script (GAS)
            </h3>
          </div>
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                : 'bg-[#181818] text-[#FF4D00] border-[#FF4D00]/30'
            }`}
          >
            {isConnected ? '• CONECTADO' : '• MODO LOCAL'}
          </span>
        </div>

        <form onSubmit={handleSaveConnection} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              URL da Web App Executável (Google Apps Script)
            </label>
            <input
              type="text"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              ID da Planilha Google (Spreadsheet ID)
            </label>
            <input
              type="text"
              value={spreadsheetIdInput}
              onChange={(e) => setSpreadsheetIdInput(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onOpenGasModal}
              className="text-xs font-bold text-[#FF4D00] hover:underline flex items-center gap-1"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Instruções & Código do Script GAS</span>
            </button>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md"
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
            className="py-2 px-4 rounded-xl bg-[#181818] border border-slate-700 hover:border-[#FF4D00] text-white font-bold text-xs"
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
            className="flex-1 py-3 px-4 rounded-xl bg-[#181818] hover:bg-[#202020] border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-[#FF4D00]" />
            <span>Restaurar Dados de Exemplo</span>
          </button>

          <button
            onClick={handleClearAllData}
            className="flex-1 py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Zerar Banco de Dados</span>
          </button>
        </div>
      </section>
    </div>
  );
};
