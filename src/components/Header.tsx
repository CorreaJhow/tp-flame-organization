import React, { useState, useEffect } from 'react';
import { Flame, Shield, RefreshCw, WifiOff } from 'lucide-react';
import { ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onNavigateTab: (tab: ViewTab) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  /** Tabelas com escrita local ainda não confirmada pelo Firestore. Sem
   * isso visível em algum lugar, "salvou mesmo?" não tem resposta quando a
   * rede está ruim — o app já sincroniza sozinho em tempo real, mas nada na
   * tela dizia se havia algo esperando. */
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateTab,
  onSync,
  isSyncing = false,
  pendingCount = 0
}) => {
  const { user } = useAuth();
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
          {/* Quem está logado — foto (se tiver) + nome. Clicar leva pro
              Admin, onde dá pra ver a conta completa e sair. */}
          {user && (
            <button
              onClick={() => onNavigateTab('admin')}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 min-h-[40px] rounded-full bg-[#121212] hover:bg-[#181818] border border-slate-800 transition-all active:scale-95"
              title={user.displayName || user.email || 'Sua conta'}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 flex items-center justify-center text-[11px] font-black shrink-0">
                  {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-[11px] font-bold text-slate-300 max-w-[110px] truncate">
                {(user.displayName || user.email || '').split(' ')[0]}
              </span>
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
              className={`relative p-2 rounded-xl transition-all border ${
                isSyncing
                  ? 'bg-[#181818] text-[#FF4D00] border-[#FF4D00]/40'
                  : !isOnline
                  ? 'bg-[#121212] text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                  : 'text-slate-400 hover:text-white bg-[#121212] hover:bg-[#181818] border-slate-800'
              }`}
              title={
                !isOnline
                  ? 'Indisponível sem internet'
                  : pendingCount > 0
                  ? `Verificar conexão com o banco de dados — ${pendingCount} tabela(s) sincronizando`
                  : 'Verificar conexão com o banco de dados'
              }
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF4D00] text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-[#0c0c0c] shadow-sm">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
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
