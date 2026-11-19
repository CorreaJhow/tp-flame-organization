import React, { useState } from 'react';
import { History, ArrowLeft } from 'lucide-react';
import { formatKeyDisplay } from '../utils/chordTransposer';
import { HistoricoItem, LogItem, Versao, Musica, Culto, ViewTab } from '../types';
import { FeedbacksPanel } from './FeedbacksPanel';

interface HistoricoLogsViewProps {
  historico: HistoricoItem[];
  logs: LogItem[];
  versoes: Versao[];
  musicas: Musica[];
  cultos: Culto[];
  onNavigate?: (tab: ViewTab) => void;
}

export const HistoricoLogsView: React.FC<HistoricoLogsViewProps> = ({
  historico,
  logs,
  versoes,
  musicas,
  cultos,
  onNavigate
}) => {
  const [tab, setTab] = useState<'historico' | 'feedbacks' | 'logs'>('historico');

  return (
    <div className="space-y-4 pb-24">
      {/* Top Mobile Back Navigation */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('mais')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-ink hover:underline bg-surface border border-line/80 px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Mais</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-fg tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-brand-ink" />
            Histórico & Registros
          </h2>
          <p className="text-xs text-fg-muted">
            Registro das execuções em cultos e auditoria do sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('historico')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            tab === 'historico'
              ? 'bg-brand text-slate-950 font-black shadow-md'
              : 'bg-surface text-fg-muted hover:text-fg border border-line'
          }`}
        >
          Histórico de Músicas
        </button>

        <button
          onClick={() => setTab('feedbacks')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            tab === 'feedbacks'
              ? 'bg-brand text-slate-950 font-black shadow-md'
              : 'bg-surface text-fg-muted hover:text-fg border border-line'
          }`}
        >
          Feedbacks
        </button>

        <button
          onClick={() => setTab('logs')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            tab === 'logs'
              ? 'bg-brand text-slate-950 font-black shadow-md'
              : 'bg-surface text-fg-muted hover:text-fg border border-line'
          }`}
        >
          Logs do Sistema ({logs.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'historico' ? (
        <div className="space-y-2">
          {historico.length === 0 ? (
            <p className="text-xs text-fg-subtle italic py-8 text-center bg-surface rounded-2xl border border-line/80">
              Nenhum histórico de execução gravado.
            </p>
          ) : (
            historico.map((item) => {
              const versao = versoes.find((v) => v.ID === item.ID_Versao);
              const musica = versao ? musicas.find((m) => m.ID === versao.ID_Musica) : undefined;
              const culto = cultos.find((c) => c.ID === item.ID_Culto);

              return (
                <div
                  key={item.ID}
                  className="bg-surface border border-line/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div>
                    <span className="text-xs font-bold text-fg block">
                      {musica?.Nome || 'Música'} ({musica?.Artista})
                    </span>
                    <span className="text-[11px] text-fg-muted">
                      {culto?.Nome_Evento || 'Culto'} • Versão {versao?.Nome_Versao} (Tom {versao ? formatKeyDisplay(versao.Tom, versao.Modo) : ''})
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-brand-ink bg-canvas px-2.5 py-1 rounded-lg border border-line shrink-0 font-bold">
                    {item.Data_Execucao}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : tab === 'feedbacks' ? (
        <FeedbacksPanel />
      ) : (
        <div className="bg-surface border border-line/80 rounded-2xl divide-y divide-line/60 overflow-hidden shadow-sm">
          {logs.map((log) => (
            <div key={log.ID} className="p-3.5 text-xs flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-extrabold text-brand-ink uppercase text-[10px] block tracking-wide">
                  {log.Acao}
                </span>
                <p className="text-fg-soft text-xs font-medium">{log.Registro_Afetado}</p>
              </div>
              <span className="text-[10px] text-fg-subtle font-mono shrink-0">
                {new Date(log.Data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
