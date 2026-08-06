import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Database, 
  Trash2, 
  RotateCcw, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  ExternalLink,
  Server,
  Settings,
  HardDrive
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
  const [endpointInput, setEndpointInput] = useState(storage.getGasEndpoint());
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(storage.getGasSpreadsheetId());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const isConnected = Boolean(endpointInput.trim());

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
      'ATENÇÃO: Esta ação vai apagar TODAS as músicas, cultos, equipe e registros locais para deixar o banco limpo!\n\nDigite ZERAR para confirmar:'
    );
    if (confirmText && confirmText.trim().toUpperCase() === 'ZERAR') {
      storage.clearAllData();
      onDataChanged();
      setActionSuccessMsg('✓ Banco de dados zerado com sucesso! Nenhuma música ou culto permanece.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Deseja restaurar os dados originais de exemplo do TP Flame?')) {
      storage.resetToDefaults();
      onDataChanged();
      setActionSuccessMsg('✓ Dados de exemplo restaurados com sucesso.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none mb-1">
              Painel de Administração
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie a conexão do Google Apps Script (GAS) e a manutenção de dados
            </p>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
          {actionSuccessMsg}
        </div>
      )}

      {/* GAS Connection & Endpoint Config */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Integração Google Apps Script (GAS)
            </h3>
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            isConnected
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isConnected ? 'GAS Conectado' : 'Modo Local SSOT'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Configure a URL da sua Web App implantada no Google Apps Script para sincronizar dados diretamente com a sua planilha do Google Sheets.
        </p>

        <form onSubmit={handleSaveConnection} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              ID da Planilha Google Sheets (Spreadsheet ID)
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
            <label className="text-xs font-bold text-slate-300 block mb-1">
              URL do Endpoint Google Apps Script (Web App)
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
              ✓ Configurações da API salvas com sucesso!
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onOpenGasModal}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Code2 className="w-4 h-4" />
              <span>Ver Scripts GAS (M1, M2 & M3)</span>
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
          <HardDrive className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-bold text-white">
            Gestão do Banco de Dados Local & Limpeza
          </h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          As ações abaixo foram movidas para esta área de administração restrita para evitar cliques acidentais na tela inicial do sistema.
        </p>

        {/* Action 1: Zerar Tudo */}
        <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-300 mb-0.5">
                Zerar Todos os Dados (Início do Zero)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Esvazia todas as tabelas (músicas, cultos, equipe e histórico). Útil quando o GAS está conectado e você deseja trabalhar exclusivamente com sua planilha oficial limpa.
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
              <span>Zerar Banco de Dados</span>
            </button>
          </div>
        </div>

        {/* Action 2: Restaurar Exemplos */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-0.5">
                Restaurar Dados de Exemplo (Demonstração TP Flame)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Recarrega o pacote de dados originais de demonstração com músicas, cultos e participantes cadastrados.
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
              <span>Restaurar Dados de Exemplo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Database Overview Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Estatísticas Atuais em Memória
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
