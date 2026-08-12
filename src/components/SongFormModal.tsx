import React, { useState, useEffect } from 'react';
import { X, Music2, Edit3 } from 'lucide-react';
import { ALL_KEYS } from '../utils/chordTransposer';
import { Musica, Versao } from '../types';
import { storage } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface SongFormModalProps {
  onClose: () => void;
  onDataChanged: () => void;
  musicaToEdit?: Musica;
  versaoToEdit?: Versao;
}

export const SongFormModal: React.FC<SongFormModalProps> = ({
  onClose,
  onDataChanged,
  musicaToEdit,
  versaoToEdit
}) => {
  const { showToast } = useToast();
  const isEditing = !!(musicaToEdit && versaoToEdit);

  const [nome, setNome] = useState('');
  const [artista, setArtista] = useState('');
  const [categoria, setCategoria] = useState('Adoração');
  const [nomeVersao, setNomeVersao] = useState('Versão Principal');
  const [tom, setTom] = useState('E');
  const [bpm, setBpm] = useState<string>('120');
  const [compasso, setCompasso] = useState<string>('4/4');
  const [estrutura, setEstrutura] = useState('INTRO - V1 - REFRÃO - V2 - REFRÃO - PONTE - OUTRO');
  const [letra, setLetra] = useState('');
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (musicaToEdit && versaoToEdit) {
      setNome(musicaToEdit.Nome);
      setArtista(musicaToEdit.Artista);
      setCategoria(musicaToEdit.Categoria);
      setNomeVersao(versaoToEdit.Nome_Versao);
      setTom(versaoToEdit.Tom);
      setBpm(versaoToEdit.BPM ? versaoToEdit.BPM.toString() : '');
      setCompasso(versaoToEdit.Compasso || '4/4');
      setEstrutura(versaoToEdit.Estrutura || '');
      setLetra(versaoToEdit.Letra || '');
      setObs(versaoToEdit.Obs || '');
    }
  }, [musicaToEdit, versaoToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !artista.trim()) return;

    const numericBpm = bpm ? parseInt(bpm, 10) : undefined;

    if (isEditing && musicaToEdit && versaoToEdit) {
      // Update existing song
      storage.updateMusica(musicaToEdit.ID, {
        Nome: nome.trim(),
        Artista: artista.trim(),
        Categoria: categoria
      });

      storage.updateVersao(versaoToEdit.ID, {
        Nome_Versao: nomeVersao.trim() || 'Versão Principal',
        Tom: tom,
        BPM: numericBpm,
        Compasso: compasso,
        Letra: letra,
        Estrutura: estrutura.trim(),
        Obs: obs.trim()
      });
      showToast('Música e cifra atualizadas com sucesso!', 'success');
    } else {
      // Create new song
      storage.addMusicaWithVersao(
        {
          Nome: nome.trim(),
          Artista: artista.trim(),
          Categoria: categoria
        },
        {
          Nome_Versao: nomeVersao.trim() || 'Versão Principal',
          Tom: tom,
          BPM: numericBpm,
          Compasso: compasso,
          Letra: letra.trim() || '[INTRO]\n[E] [B] [C#m] [A]',
          Estrutura: estrutura.trim(),
          Obs: obs.trim()
        }
      );
      showToast('Nova música cadastrada com sucesso!', 'success');
    }

    onDataChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-slate-800 w-full max-w-xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center border border-[#FF4D00]/30">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isEditing ? 'Editar Música e Cifra' : 'Cadastrar Nova Música'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Altere o tom, letra, versão e arranjo' : 'Insira a música e sua versão principal'}
              </p>
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
                className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
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
                className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
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
                className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
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
                className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#FF4D00]"
              >
                {ALL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    Tom {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BPM and Compasso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                BPM (Andamento)
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="ex: 128"
                min="30"
                max="300"
                className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00] font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Compasso (Fórmula de Tempo)
              </label>
              <select
                value={compasso}
                onChange={(e) => setCompasso(e.target.value)}
                className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00] font-bold"
              >
                <option value="4/4">4/4 (Quaternário)</option>
                <option value="3/4">3/4 (Ternário / Valsa)</option>
                <option value="6/8">6/8 (Sextúpulo)</option>
                <option value="2/4">2/4 (Binário)</option>
                <option value="12/8">12/8 (Lento de Adoração)</option>
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
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
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
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00] font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Letra com Cifras (Colchetes ou linhas de acordes)
            </label>
            <textarea
              value={letra}
              onChange={(e) => setLetra(e.target.value)}
              placeholder={`[INTRO]\n[E] [B] [C#m] [A]\n\n[VERSO 1]\n[E] Sobre o trono de glória...`}
              rows={8}
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00] font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Observações do Arranjo / Instruções
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="ex: Arranjo acústico de violão na intro"
              className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
            >
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Música'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
