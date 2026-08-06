import React from 'react';
import { Home, Music2, Calendar, Users, History, Shield } from 'lucide-react';
import { ViewTab } from '../types';

interface NavigationProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  nextCultoSongCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  nextCultoSongCount
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'biblioteca', label: 'Biblioteca', icon: Music2 },
    { id: 'cultos', label: 'Cultos', icon: Calendar, badge: nextCultoSongCount },
    { id: 'integrantes', label: 'Equipe', icon: Users },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'admin', label: 'Admin', icon: Shield }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800 py-1 px-1.5 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative min-h-[48px] px-1 flex flex-col items-center justify-center rounded-xl transition-all flex-1 ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-slate-900">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 leading-tight tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
