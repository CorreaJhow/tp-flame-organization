import React, { useState, useEffect } from 'react';
import { Flame, Shield, RefreshCw, WifiOff } from 'lucide-react';
import { ViewTab } from '../types';

interface HeaderProps {
  onOpenGasModal?: () => void;
  onNavigateTab: (tab: ViewTab) => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigateTab,
  onSync,
  isSyncing = false
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#0c0c0c]/95 backdrop-blur-md border-b border-slate-800/80 text-white px-4 py-3 shadow-xl">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigateTab('inicio')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FF4D00] flex items-center justify-center shadow-lg shadow-[#FF4D00]/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-none">
                TP FLAME
              </h1>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">
              Louvor & Adoração
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Offline Mode Indicator */}
          {!isOnline && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-bold shadow-sm"
              title="Sem conexão de internet. Todas as cifras e dados locais continuam disponíveis!"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* Sync / Refresh Button (Clean & Simple) */}
          {onSync && (
            <button
              id="header-sync-refresh-btn"
              onClick={onSync}
              disabled={isSyncing || !isOnline}
              className={`p-2 rounded-xl transition-all border ${
                isSyncing
                  ? 'bg-[#181818] text-[#FF4D00] border-[#FF4D00]/40'
                  : !isOnline
                  ? 'bg-[#121212] text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                  : 'text-slate-400 hover:text-white bg-[#121212] hover:bg-[#181818] border-slate-800'
              }`}
              title={!isOnline ? "Indisponível sem internet" : "Atualizar repertório com a planilha"}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Admin Button */}
          <button
            id="header-admin-nav-button"
            onClick={() => onNavigateTab('admin')}
            className="p-2 rounded-xl text-slate-400 hover:text-[#FF4D00] hover:bg-[#181818] transition-all border border-slate-800"
            title="Painel de Administração (Acesso Restrito)"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
