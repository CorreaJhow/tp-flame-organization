import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { storage } from '../services/storage';
import { LogItem } from '../types';
import { FeedbackKind, parseFeedback } from '../utils/feedbackLog';

type Filtro = 'todos' | 'melhoria' | 'outra' | 'bug' | 'musica';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'melhoria', label: 'Melhoria' },
  { id: 'outra', label: 'Outra ideia' },
  { id: 'bug', label: 'Bugs' },
  { id: 'musica', label: 'Músicas' }
];

const ROTULOS: Record<FeedbackKind, string> = {
  melhoria: 'Melhoria',
  outra: 'Outra ideia',
  bug: 'Bug',
  musica: 'Música',
  sugestao: 'Sugestão',
  desconhecido: 'Feedback'
};

const formatarData = (iso: string): string => {
  const data = new Date(iso);
  if (isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export const FeedbacksPanel: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<LogItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [incompleto, setIncompleto] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    const resultado = await storage.getFeedbacks();
    setFeedbacks(resultado.items);
    setIncompleto(!resultado.completo);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const itens = useMemo(
    () =>
      feedbacks
        .map((log) => ({ log, parsed: parseFeedback(log.Registro_Afetado ?? '') }))
        .filter(({ parsed }) => filtro === 'todos' || parsed.kind === filtro),
    [feedbacks, filtro]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {FILTROS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              aria-pressed={filtro === id}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                filtro === id
                  ? 'bg-brand/15 text-brand border-brand/40'
                  : 'bg-surface text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={carregar}
          disabled={carregando}
          aria-label="Atualizar feedbacks"
          className="p-2 rounded-xl bg-surface border border-slate-800 text-slate-400 hover:text-white shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {incompleto && (
        <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
          Sem conexão com o banco: mostrando só os feedbacks recentes salvos neste aparelho.
        </p>
      )}

      {itens.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-8 text-center bg-surface rounded-2xl border border-slate-800/80">
          {carregando ? 'Carregando feedbacks...' : 'Nenhum feedback aqui ainda.'}
        </p>
      ) : (
        <div className="bg-surface border border-slate-800/80 rounded-2xl divide-y divide-slate-800/60 overflow-hidden shadow-sm">
          {itens.map(({ log, parsed }) => (
            <article key={log.ID} className="p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-brand uppercase text-[10px] tracking-wide">
                  {ROTULOS[parsed.kind]}
                </span>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">{formatarData(log.Data)}</span>
              </div>

              {parsed.kind === 'musica' && parsed.musica ? (
                <>
                  <p className="text-xs font-bold text-white">{parsed.musica}</p>
                  {parsed.link ? (
                    <a
                      href={parsed.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline inline-flex items-center gap-1 break-all"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {parsed.link}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 break-all">{parsed.mensagem}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-200 whitespace-pre-wrap break-words">{parsed.mensagem}</p>
              )}

              <p className="text-[11px] text-slate-500">
                {parsed.de || log.Usuario}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
