import React from 'react';
import { Flame } from 'lucide-react';

interface InitialSyncOverlayProps {
  isOpen: boolean;
}

/**
 * Tela de espera enquanto a primeira sincronização da sessão roda.
 *
 * Antes disso, o app mostrava o `localStorage` do próprio aparelho
 * imediatamente — que pode estar desatualizado — e trocava pelo dado da
 * planilha em silêncio assim que a sincronização terminava. Esta tela cobre
 * essa janela: a pessoa vê que algo está carregando, em vez de ver dados
 * (possivelmente velhos) e não saber que vão mudar.
 *
 * `pointer-events-none` no conteúdo por trás não é necessário aqui porque o
 * overlay já ocupa a tela inteira com z-index acima de tudo — nada por trás
 * é clicável enquanto ele estiver visível.
 */
export const InitialSyncOverlay: React.FC<InitialSyncOverlayProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#121212] border border-slate-800 w-full max-w-xs rounded-3xl p-7 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF4D00]" />

        <div className="relative w-16 h-16 flex items-center justify-center">
          <span className="absolute inset-0 rounded-2xl border-2 border-slate-700 border-t-[#FF4D00] animate-spin" />
          <div className="w-11 h-11 rounded-xl bg-[#FF4D00] flex items-center justify-center shadow-lg shadow-[#FF4D00]/20">
            <Flame className="w-6 h-6 text-slate-950 fill-slate-950 stroke-[2.5]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-sm font-extrabold text-white">
            Carregando dados da equipe
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Buscando as músicas, cultos e integrantes mais recentes na planilha.
            Só um instante.
          </p>
        </div>
      </div>
    </div>
  );
};
