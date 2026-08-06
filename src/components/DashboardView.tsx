import React from 'react';
import { 
  Calendar, 
  Music2, 
  Play, 
  ChevronRight, 
  Clock, 
  Plus, 
  Sparkles,
  FileText
} from 'lucide-react';
import { Culto, Musica, Versao, RepertorioItem, ViewTab } from '../types';

interface DashboardViewProps {
  upcomingCulto?: Culto;
  upcomingRepertorio: { item: RepertorioItem; versao?: Versao; musica?: Musica }[];
  onNavigate: (tab: ViewTab) => void;
  onOpenStageMode: (culto: Culto) => void;
  onOpenNewCultoModal: () => void;
  onSelectSong?: (musica: Musica) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  upcomingCulto,
  upcomingRepertorio,
  onNavigate,
  onOpenStageMode,
  onOpenNewCultoModal,
  onSelectSong
}) => {
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 pb-28">
      {/* GIGANTIC HIGHLIGHT CARD: PRÓXIMO CULTO */}
      <section className="bg-gradient-to-br from-[#121212] via-[#121212] to-[#20100a] rounded-3xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden transition-all hover:border-[#FF4D00]/40">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF4D00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF4D00] animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest text-[#FF4D00]">
              PRÓXIMO CULTO
            </span>
          </div>
          {upcomingCulto && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900/90 text-[#FF4D00] border border-[#FF4D00]/30">
              {upcomingCulto.Status}
            </span>
          )}
        </div>

        {upcomingCulto ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white leading-tight mb-1">
                {upcomingCulto.Nome_Evento}
              </h2>
              <p className="text-xs font-semibold text-[#FF4D00]/90 flex items-center gap-1.5 capitalize">
                <Clock className="w-4 h-4 text-[#FF4D00]" />
                {formatDate(upcomingCulto.Data)}
              </p>
            </div>

            {/* Setlist Summary */}
            <div className="bg-[#080808]/90 rounded-2xl p-4 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
                  Repertório ({upcomingRepertorio.length} músicas)
                </span>
                <button
                  onClick={() => onNavigate('cultos')}
                  className="text-[#FF4D00] hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  Ver no Culto <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {upcomingRepertorio.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">
                  Nenhuma música adicionada ainda a este culto.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingRepertorio.slice(0, 4).map(({ item, versao, musica }, idx) => (
                    <div
                      key={item.ID}
                      onClick={() => musica && onSelectSong?.(musica)}
                      className={`flex items-center justify-between text-xs bg-[#121212] px-3 py-2 rounded-xl border border-slate-800/80 transition-all ${
                        musica ? 'cursor-pointer hover:border-slate-700 hover:bg-[#181818] group' : ''
                      }`}
                      title={musica ? 'Clique para abrir detalhes e cifra' : ''}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-5 h-5 rounded-full bg-[#FF4D00]/20 text-[#FF4D00] font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white truncate group-hover:text-[#FF4D00] transition-colors">
                          {musica?.Nome || 'Música'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {versao?.Tom && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#1f1f1f] text-[#FF4D00] border border-[#FF4D00]/30">
                            Tom {versao.Tom}
                          </span>
                        )}
                        {musica && (
                          <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#FF4D00] transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}
                  {upcomingRepertorio.length > 4 && (
                    <p className="text-[11px] text-slate-400 text-center pt-0.5 font-medium">
                      + {upcomingRepertorio.length - 4} outra(s) música(s)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Giant Action to Direct Stage Cifras View */}
            <button
              id="start-stage-mode-button"
              onClick={() => onOpenStageMode(upcomingCulto)}
              className="w-full py-4 px-5 rounded-2xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[#FF4D00]/20 active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>MODO PALCO</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm font-semibold text-slate-400">
              Nenhum culto agendado no momento.
            </p>
            <button
              onClick={onOpenNewCultoModal}
              className="py-3 px-5 rounded-xl bg-[#FF4D00] text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Novo Culto</span>
            </button>
          </div>
        )}
      </section>

      {/* 2 MAIN BIG BUTTONS BELOW */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          id="main-btn-buscar-musicas"
          onClick={() => onNavigate('biblioteca')}
          className="bg-[#121212] hover:bg-[#1a1a1a] border border-slate-800 rounded-2xl p-5 flex items-center justify-between text-left transition-all active:scale-[0.98] shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Music2 className="w-6 h-6 text-[#FF4D00]" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white block group-hover:text-[#FF4D00] transition-colors">
                Buscar Músicas
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Biblioteca & Cifras
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        <button
          id="main-btn-ver-cultos"
          onClick={() => onNavigate('cultos')}
          className="bg-[#121212] hover:bg-[#1a1a1a] border border-slate-800 rounded-2xl p-5 flex items-center justify-between text-left transition-all active:scale-[0.98] shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white block group-hover:text-blue-400 transition-colors">
                Agenda de Cultos
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Escala & Repertórios
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </section>
    </div>
  );
};
