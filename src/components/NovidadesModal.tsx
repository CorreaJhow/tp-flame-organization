import React from 'react';
import { Sparkles } from 'lucide-react';
import { NOVIDADES } from '../data/novidades';

interface NovidadesModalProps {
  onClose: () => void;
}

export const NovidadesModal: React.FC<NovidadesModalProps> = ({ onClose }) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="novidades-titulo"
    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
  >
    <div className="bg-surface border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3 bg-surface-hover">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 id="novidades-titulo" className="text-base font-extrabold text-white">
            O que mudou no app
          </h2>
          <p className="text-xs text-slate-400">Veja o que há de novo nesta versão</p>
        </div>
      </div>

      <ul className="p-5 overflow-y-auto space-y-4">
        {NOVIDADES.itens.map((item) => (
          <li key={item.titulo}>
            <h3 className="text-sm font-bold text-white">{item.titulo}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{item.texto}</p>
          </li>
        ))}
      </ul>

      <div className="p-5 pt-0">
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-slate-950 font-extrabold text-sm shadow-lg transition-all active:scale-95"
        >
          Entendi
        </button>
      </div>
    </div>
  </div>
);
