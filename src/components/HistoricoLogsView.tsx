import React, { useState } from 'react';
import { History, ArrowLeft } from 'lucide-react';
import { HistoricoItem, LogItem, Versao, Musica, Culto, ViewTab } from '../types';

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
  const [tab, setTab] = useState<'historico' | 'logs'>('historico');

  return (
    <div className="space-y-4 pb-24">
      {/* Top Mobile Back Navigation */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('mais')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4D00] hover:underline bg-[#121212] border border-slate-800/80 px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Mais</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#FF4D00]" />
            Histórico & Registros
          </h2>
          <p className="text-xs text-slate-400">
            Registro das execuções em cultos e auditoria do sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab('historico')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'historico'
              ? 'bg-[#FF4D00] text-slate-950 font-black shadow-md'
              : 'bg-[#121212] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Histórico de Músicas
        </button>

        <button
          onClick={() => setTab('logs')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'logs'
              ? 'bg-[#FF4D00] text-slate-950 font-black shadow-md'
              : 'bg-[#121212] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Logs do Sistema ({logs.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'historico' ? (
        <div className="space-y-2">
          {historico.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center bg-[#121212] rounded-2xl border border-slate-800/80">
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
                  className="bg-[#121212] border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {musica?.Nome || 'Música'} ({musica?.Artista})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {culto?.Nome_Evento || 'Culto'} • Versão {versao?.Nome_Versao} (Tom {versao?.Tom})
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#FF4D00] bg-[#080808] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 font-bold">
                    {item.Data_Execucao}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-[#121212] border border-slate-800/80 rounded-2xl divide-y divide-slate-800/60 overflow-hidden shadow-sm">
          {logs.map((log) => (
            <div key={log.ID} className="p-3.5 text-xs flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#FF4D00] uppercase text-[10px] block tracking-wide">
                  {log.Acao}
                </span>
                <p className="text-slate-300 text-xs font-medium">{log.Detalhes}</p>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {new Date(log.Data_Hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
