import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  Server, 
  Settings, 
  HardDrive, 
  Trash2, 
  RotateCcw, 
  Code2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ChevronRight
} from 'lucide-react';
import { storage } from '../services/storage';

interface AdminViewProps {
  onOpenGasModal: () => void;
  onDataChanged: () => void;
  totalMusicas: number;
  totalVersoes: number;
  totalCultos: number;
  totalIntegrantes: number;
}

export const AdminView: React.FC<AdminViewProps> = ({
  onOpenGasModal,
  onDataChanged,
  totalMusicas,
  totalVersoes,
  totalCultos,
  totalIntegrantes
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
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Área Restrita
            </h2>
            <p className="text-xs text-slate-400">
              Digite a senha de administrador para acessar as configurações do sistema
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors pr-10"
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
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Entrar na Administração</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Senha padrão de acesso: <span className="font-mono text-slate-400 font-bold">admin</span>
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard (Authenticated)
  return (
    <div className="space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              Painel de Administração
            </h2>
            <p className="text-xs text-slate-400">
              Conexão GAS e manutenção de dados
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          title="Sair da Administração"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
          {actionSuccessMsg}
        </div>
      )}

      {/* GAS Integration Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Integração Google Apps Script (GAS)
            </h3>
          </div>

          <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
            isConnected
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>{isConnected ? 'Conectado' : 'Sem Conexão'}</span>
          </div>
        </div>

        <form onSubmit={handleSaveConnection} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              ID da Planilha Google Sheets
            </label>
            <input
              type="text"
              value={spreadsheetIdInput}
              onChange={(e) => setSpreadsheetIdInput(e.target.value)}
              placeholder="ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              URL do Endpoint Web App (GAS)
            </label>
            <input
              type="url"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {saveSuccess && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              ✓ Conexão salva com sucesso!
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onOpenGasModal}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Ver Scripts GAS</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Salvar Conexão
            </button>
          </div>
        </form>
      </section>

      {/* Database Operations & Zero Data */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <HardDrive className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-white">
            Limpeza & Manutenção do Banco
          </h3>
        </div>

        {/* Action 1: Zerar Tudo */}
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-300 mb-0.5">
                Zerar Todos os Dados
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Apaga todas as músicas, cultos e participantes locais para deixar a aplicação limpa e pronta para sincronizar com sua planilha.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              id="clear-all-data-button"
              onClick={handleClearAllData}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Dados</span>
            </button>
          </div>
        </div>

        {/* Action 2: Restaurar Exemplos */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-0.5">
                Restaurar Dados de Exemplo
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Recarrega os registros de demonstração originais do TP Flame.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              id="reset-default-data-button"
              onClick={handleResetToDefaults}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurar Exemplos</span>
            </button>
          </div>
        </div>
      </section>

      {/* Security & Admin Password Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            Segurança da Administração
          </h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nova Senha do Administrador
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {changePassSuccess && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              ✓ Senha alterada com sucesso!
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!newPassword.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Alterar Senha
            </button>
          </div>
        </form>
      </section>

      {/* Database Overview Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Resumo do Sistema
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-amber-400 font-extrabold text-base block">{totalMusicas}</span>
            <span className="text-[10px] text-slate-400">Músicas</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-extrabold text-base block">{totalVersoes}</span>
            <span className="text-[10px] text-slate-400">Versões</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-blue-400 font-extrabold text-base block">{totalCultos}</span>
            <span className="text-[10px] text-slate-400">Cultos</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-purple-400 font-extrabold text-base block">{totalIntegrantes}</span>
            <span className="text-[10px] text-slate-400">Equipe</span>
          </div>
        </div>
      </section>
    </div>
  );
};

