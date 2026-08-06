import React, { useState } from 'react';
import { X, Music2, Plus } from 'lucide-react';
import { ALL_KEYS } from '../utils/chordTransposer';
import { storage } from '../services/storage';

interface SongFormModalProps {
  onClose: () => void;
  onDataChanged: () => void;
}

export const SongFormModal: React.FC<SongFormModalProps> = ({ onClose, onDataChanged }) => {
  const [nome, setNome] = useState('');
  const [artista, setArtista] = useState('');
  const [categoria, setCategoria] = useState('Adoração');
  const [nomeVersao, setNomeVersao] = useState('Versão Principal');
  const [tom, setTom] = useState('E');
  const [estrutura, setEstrutura] = useState('INTRO - V1 - REFRÃO - V2 - REFRÃO - PONTE - OUTRO');
  const [letra, setLetra] = useState('');
  const [obs, setObs] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !artista.trim()) return;

    storage.addMusicaWithVersao(
      {
        Nome: nome.trim(),
        Artista: artista.trim(),
        Categoria: categoria
      },
      {
        Nome_Versao: nomeVersao.trim() || 'Versão Principal',
        Tom: tom,
        Letra: letra.trim() || '[INTRO]\n[E] [B] [C#m] [A]',
        Estrutura: estrutura.trim(),
        Obs: obs.trim()
      }
    );

    onDataChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Music2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cadastrar Nova Música</h2>
              <p className="text-xs text-slate-400">Insira a música e sua versão principal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Song Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nome da Música *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="ex: Ruja o Leão"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Artista / Ministério *
              </label>
              <input
                type="text"
                value={artista}
                onChange={(e) => setArtista(e.target.value)}
                placeholder="ex: FHOP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Adoração">Adoração</option>
                <option value="Celebração">Celebração</option>
                <option value="Oferta">Oferta</option>
                <option value="Ceia">Ceia</option>
                <option value="Avulsa">Avulsa</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Tom Original *
              </label>
              <select
                value={tom}
                onChange={(e) => setTom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
              >
                {ALL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    Tom {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Nome da Versão
            </label>
            <input
              type="text"
              value={nomeVersao}
              onChange={(e) => setNomeVersao(e.target.value)}
              placeholder="ex: Versão Oficial Ao Vivo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Estrutura
            </label>
            <input
              type="text"
              value={estrutura}
              onChange={(e) => setEstrutura(e.target.value)}
              placeholder="ex: INTRO - V1 - REFRÃO - V2 - REFRÃO - PONTE - OUTRO"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Letra com Cifras em Colchetes e.g. [G], [D/F#]
            </label>
            <textarea
              value={letra}
              onChange={(e) => setLetra(e.target.value)}
              placeholder={`[INTRO]\n[E] [B] [C#m] [A]\n\n[VERSO 1]\n[E] Sobre o trono de glória...`}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Observações Gerais
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="ex: Arranjo acústico de violão na intro"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Salvar Música
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
