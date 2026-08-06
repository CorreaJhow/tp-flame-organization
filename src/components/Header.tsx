import React from 'react';
import { Flame, Database, CheckCircle2, Shield } from 'lucide-react';
import { storage } from '../services/storage';
import { ViewTab } from '../types';

interface HeaderProps {
  onOpenGasModal: () => void;
  onNavigateTab: (tab: ViewTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGasModal, onNavigateTab }) => {
  const gasEndpoint = storage.getGasEndpoint();
  const isConnected = Boolean(gasEndpoint);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigateTab('inicio')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
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

        {/* Right Actions - Clean Status Badge & Admin Link */}
        <div className="flex items-center gap-2">
          {/* Status Badge -> Opens Admin Tab */}
          <button
            id="header-admin-status-badge"
            onClick={() => onNavigateTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
              isConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                : 'bg-slate-800/90 text-amber-300 border-amber-500/30 hover:bg-slate-800'
            }`}
            title="Acessar Painel de Administração"
          >
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">GAS Conectado</span>
                <span className="sm:hidden">Conectado</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Modo Local SSOT</span>
                <span className="sm:hidden">Modo Local</span>
              </>
            )}
          </button>

          {/* Direct Admin Icon Button */}
          <button
            id="header-admin-nav-button"
            onClick={() => onNavigateTab('admin')}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all border border-slate-800"
            title="Painel de Administração"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
