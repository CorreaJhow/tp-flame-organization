import React from 'react';
import { Flame, Database, Code2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { storage } from '../services/storage';

interface HeaderProps {
  onOpenGasModal: () => void;
  onDataChanged: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGasModal, onDataChanged }) => {
  const gasEndpoint = storage.getGasEndpoint();
  const gasSpreadsheetId = storage.getGasSpreadsheetId();
  const isConnected = Boolean(gasEndpoint);

  const handleReset = () => {
    if (window.confirm('Deseja mesmo restaurar os dados originais de exemplo do TP Flame?')) {
      storage.resetToDefaults();
      onDataChanged();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 text-slate-950 fill-amber-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white leading-none">
                TP FLAME
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                V1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-tight">
              Gestão de Ministérios de Louvor
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <button
            id="gas-status-badge-button"
            onClick={onOpenGasModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              isConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                : 'bg-slate-800/80 text-amber-300 border-amber-500/30 hover:bg-slate-800'
            }`}
            title="Configurar Integração Google Apps Script"
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GAS Conectado</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Simulador SSOT</span>
              </>
            )}
          </button>

          {/* GAS Setup Modal Button */}
          <button
            id="open-gas-setup-button"
            onClick={onOpenGasModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all active:scale-95"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Setup GAS (Milestone 1)</span>
            <span className="sm:hidden">Script GAS</span>
          </button>

          {/* Reset */}
          <button
            id="reset-data-button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Restaurar dados de exemplo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
