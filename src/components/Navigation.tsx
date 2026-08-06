import React from 'react';
import { Home, Music2, Calendar, MoreHorizontal } from 'lucide-react';
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
    { id: 'cultos', label: 'Escala/Cultos', icon: Calendar, badge: nextCultoSongCount },
    { id: 'mais', label: 'Mais', icon: MoreHorizontal }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0c0c0c]/95 backdrop-blur-md border-t border-slate-800/80 py-1 px-2 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Tab is active if tab.id matches currentTab OR if in sub-views of 'mais'
          const isActive = 
            currentTab === tab.id || 
            (tab.id === 'mais' && ['integrantes', 'historico', 'admin'].includes(currentTab));

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`relative min-h-[50px] px-2 flex flex-col items-center justify-center rounded-xl transition-all flex-1 ${
                isActive
                  ? 'text-[#FF4D00] font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#FF4D00]' : ''}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF4D00] text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#0c0c0c]">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-1 leading-tight tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-[#FF4D00] rounded-full shadow-[0_0_8px_#FF4D00]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

