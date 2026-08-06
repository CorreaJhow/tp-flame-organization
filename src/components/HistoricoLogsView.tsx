import React, { useState } from 'react';
import { History, Activity, Calendar, Music2 } from 'lucide-react';
import { HistoricoItem, LogItem, Versao, Musica, Culto } from '../types';

interface HistoricoLogsViewProps {
  historico: HistoricoItem[];
  logs: LogItem[];
  versoes: Versao[];
  musicas: Musica[];
  cultos: Culto[];
}

export const HistoricoLogsView: React.FC<HistoricoLogsViewProps> = ({
  historico,
  logs,
  versoes,
  musicas,
  cultos
}) => {
  const [tab, setTab] = useState<'historico' | 'logs'>('historico');

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Histórico & Trilha de Logs
          </h2>
          <p className="text-xs text-slate-400">
            Registro das execuções e auditoria SSOT
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab('historico')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'historico'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Histórico de Músicas
        </button>

        <button
          onClick={() => setTab('logs')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            tab === 'logs'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Logs do Sistema ({logs.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'historico' ? (
        <div className="space-y-2">
          {historico.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
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
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {musica?.Nome || 'Música'} ({musica?.Artista})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {culto?.Nome_Evento || 'Culto'} • Versão {versao?.Nome_Versao} (Tom {versao?.Tom})
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.Data_Execucao}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
          {logs.map((log) => (
            <div key={log.ID} className="p-3 text-xs flex items-start justify-between gap-2">
              <div>
                <span className="font-semibold text-white block">{log.Registro_Afetado}</span>
                <span className="text-[10px] text-slate-400">
                  {log.Usuario} • Ação: {log.Acao}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {new Date(log.Data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
