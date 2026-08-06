import React from 'react';
import { 
  Calendar, 
  Music2, 
  Play, 
  Plus, 
  Users, 
  Code2, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import { Culto, Musica, Versao, RepertorioItem, Integrante, LogItem, ViewTab } from '../types';

interface DashboardViewProps {
  upcomingCulto?: Culto;
  upcomingRepertorio: { item: RepertorioItem; versao?: Versao; musica?: Musica }[];
  totalMusicas: number;
  totalVersoes: number;
  totalCultos: number;
  totalIntegrantes: number;
  logs: LogItem[];
  onNavigate: (tab: ViewTab) => void;
  onOpenStageMode: (culto: Culto) => void;
  onOpenNewSongModal: () => void;
  onOpenNewCultoModal: () => void;
  onOpenNewMemberModal: () => void;
  onOpenGasModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  upcomingCulto,
  upcomingRepertorio,
  totalMusicas,
  totalVersoes,
  totalCultos,
  totalIntegrantes,
  logs,
  onNavigate,
  onOpenStageMode,
  onOpenNewSongModal,
  onOpenNewCultoModal,
  onOpenNewMemberModal,
  onOpenGasModal
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
    <div className="space-y-6 pb-24">
      {/* Welcome & Next Service Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Próximo Culto
            </span>
          </div>
          {upcomingCulto && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {upcomingCulto.Status}
            </span>
          )}
        </div>

        {upcomingCulto ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              {upcomingCulto.Nome_Evento}
            </h2>
            <p className="text-xs text-amber-200/80 flex items-center gap-1.5 mb-4">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(upcomingCulto.Data)}
            </p>

            {/* Setlist Summary */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Repertório Selecionado ({upcomingRepertorio.length} músicas)</span>
                <button
                  onClick={() => onNavigate('cultos')}
                  className="text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  Ver Detalhes <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {upcomingRepertorio.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">
                  Nenhuma música adicionada ainda a este culto.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingRepertorio.slice(0, 3).map(({ item, versao, musica }, idx) => (
                    <div
                      key={item.ID}
                      className="flex items-center justify-between text-xs bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white truncate">
                          {musica?.Nome || 'Música'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {versao?.Tom && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                            Tom {versao.Tom}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {upcomingRepertorio.length > 3 && (
                    <p className="text-[11px] text-slate-400 text-center pt-1 font-medium">
                      + {upcomingRepertorio.length - 3} outra(s) música(s) no repertório
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action to Stage Mode */}
            <button
              id="start-stage-mode-button"
              onClick={() => onOpenStageMode(upcomingCulto)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Abrir Modo Palco (Live Stage View)</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-400 mb-3">
              Nenhum culto agendado no momento.
            </p>
            <button
              onClick={onOpenNewCultoModal}
              className="py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Primeiro Culto</span>
            </button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            id="quick-add-song-button"
            onClick={onOpenNewSongModal}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Nova Música</span>
              <span className="text-[10px] text-slate-400">Cadastrar tom & letra</span>
            </div>
          </button>

          <button
            id="quick-add-culto-button"
            onClick={onOpenNewCultoModal}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-slate-950 transition-colors shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Agendar Culto</span>
              <span className="text-[10px] text-slate-400">Montar repertório</span>
            </div>
          </button>

          <button
            id="quick-add-member-button"
            onClick={onOpenNewMemberModal}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Novo Integrante</span>
              <span className="text-[10px] text-slate-400">Cadastrar músico</span>
            </div>
          </button>

          <button
            id="quick-gas-setup-button"
            onClick={onOpenGasModal}
            className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 text-left transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Script GAS (M1)</span>
              <span className="text-[10px] text-slate-400">Código de Setup Google</span>
            </div>
          </button>
        </div>
      </section>

      {/* Platform Key Stats */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Resumo do Ministério
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <Music2 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-lg font-extrabold text-white block leading-none">{totalMusicas}</span>
            <span className="text-[10px] text-slate-400 font-medium">Músicas</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-lg font-extrabold text-white block leading-none">{totalVersoes}</span>
            <span className="text-[10px] text-slate-400 font-medium">Versões</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-lg font-extrabold text-white block leading-none">{totalCultos}</span>
            <span className="text-[10px] text-slate-400 font-medium">Cultos</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-lg font-extrabold text-white block leading-none">{totalIntegrantes}</span>
            <span className="text-[10px] text-slate-400 font-medium">Equipe</span>
          </div>
        </div>
      </section>

      {/* Architecture Single Source of Truth Banner */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-white mb-0.5">
            Arquitetura SSOT & Mobile-First
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Todas as alterações são estruturadas no esquema do <strong>Google Sheets</strong> (10 tabelas). Nenhuma informação é duplicada.
          </p>
        </div>
      </section>

      {/* Recent Activity Log */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Atividades Recentes
          </h3>
          <button
            onClick={() => onNavigate('historico')}
            className="text-xs text-amber-400 hover:underline"
          >
            Ver Logs
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
          {logs.slice(0, 4).map((log) => (
            <div key={log.ID} className="p-3 text-xs flex items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-white block">{log.Registro_Afetado}</span>
                <span className="text-[10px] text-slate-400">{log.Usuario} • {log.Acao}</span>
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(log.Data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
