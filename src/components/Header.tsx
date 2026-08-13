import React, { useState, useEffect } from 'react';
import { Flame, Shield, RefreshCw, WifiOff, User, Mic, Guitar, Music } from 'lucide-react';
import { ViewTab, Integrante } from '../types';

interface HeaderProps {
  onOpenGasModal?: () => void;
  onNavigateTab: (tab: ViewTab) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  onOpenMemberProfile?: () => void;
  activeMember?: Integrante | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNavigateTab,
  onSync,
  isSyncing = false,
  onOpenMemberProfile,
  activeMember
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

  const getRoleIcon = (funcao: string) => {
    const f = (funcao || '').toLowerCase();
    if (f.includes('vocal') || f.includes('ministro')) return <Mic className="w-3.5 h-3.5 text-pink-400" />;
    if (f.includes('baixo') || f.includes('guitarra') || f.includes('violão')) return <Guitar className="w-3.5 h-3.5 text-[#FF4D00]" />;
    return <Music className="w-3.5 h-3.5 text-cyan-400" />;
  };

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
          {/* Member Profile Quick Switcher */}
          {onOpenMemberProfile && (
            <button
              onClick={onOpenMemberProfile}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                activeMember
                  ? 'bg-gradient-to-r from-[#FF4D00]/15 to-slate-900 border-[#FF4D00]/40 text-white shadow-sm hover:border-[#FF4D00]'
                  : 'bg-[#121212] hover:bg-[#181818] border-slate-800 text-slate-300'
              }`}
              title={activeMember ? `Perfil ativo: ${activeMember.Nome} (${activeMember.Funcao})` : "Conectar perfil do integrante"}
            >
              {activeMember ? (
                <>
                  {getRoleIcon(activeMember.Funcao)}
                  <span className="max-w-[100px] sm:max-w-[120px] truncate">{activeMember.Nome.split(' ')[0]}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Meu Perfil</span>
                </>
              )}
            </button>
          )}

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
