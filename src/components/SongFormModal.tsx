import React, { useState, useEffect, useRef } from 'react';
import { X, Music2, Edit3, Mic, Sparkles } from 'lucide-react';
import { ALL_KEYS } from '../utils/chordTransposer';
import { Musica, Versao } from '../types';
import { storage } from '../services/storage';
import { useToast } from '../context/ToastContext';
import { getVocalConfig } from '../utils/vocalColors';

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
  const [modo, setModo] = useState<'Maior' | 'Menor'>('Maior');
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
      // Ausente = versão gravada antes do esquema v3 (ou fora do app) — trata
      // como Maior, o mesmo comportamento que sempre existiu implicitamente.
      setModo(versaoToEdit.Modo === 'Menor' ? 'Menor' : 'Maior');
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
        Modo: modo,
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
          Modo: modo,
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available vocals from integrantes or default team
  const availableVocals = React.useMemo(() => {
    const integrantes = storage.getIntegrantes();
    const vocalMembers = integrantes
      .filter((i) => i.Funcao?.toLowerCase().includes('vocal') || i.Funcao?.toLowerCase().includes('ministro'))
      .map((i) => i.Nome.split(' ')[0]);

    const defaultVocals = ['Larissa', 'Bianca', 'Leticia', 'Jhow', 'Todos'];
    return Array.from(new Set([...defaultVocals, ...vocalMembers]));
  }, []);

  const [selectedDuetVocals, setSelectedDuetVocals] = useState<string[]>([]);
  const [isDuetBuilderOpen, setIsDuetBuilderOpen] = useState(false);

  const toggleDuetVocal = (name: string) => {
    if (selectedDuetVocals.includes(name)) {
      setSelectedDuetVocals(selectedDuetVocals.filter(v => v !== name));
    } else {
      setSelectedDuetVocals([...selectedDuetVocals, name]);
    }
  };

  const handleInsertCustomDuet = () => {
    if (selectedDuetVocals.length === 0) return;
    const tag = `[Voz: ${selectedDuetVocals.join(' & ')}]`;
    insertTagAtCursor(tag);
    setSelectedDuetVocals([]);
    setIsDuetBuilderOpen(false);
  };

  const insertTagAtCursor = (tag: string) => {
    if (!textareaRef.current) {
      setLetra((prev) => prev ? `${prev}\n${tag}\n` : `${tag}\n`);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    let newText = '';
    let newCursorPos = start;

    if (selectedText) {
      // Wrap selected text or prefix it
      newText = text.substring(0, start) + `${tag} ` + selectedText + text.substring(end);
      newCursorPos = start + tag.length + 1 + selectedText.length;
    } else {
      // Insert at cursor
      const needsNewLineBefore = start > 0 && text[start - 1] !== '\n';
      const prefix = needsNewLineBefore ? '\n' : '';
      const insertion = `${prefix}${tag}\n`;
      newText = text.substring(0, start) + insertion + text.substring(end);
      newCursorPos = start + insertion.length;
    }

    setLetra(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
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
              <div className="flex gap-1.5">
                <select
                  value={tom}
                  onChange={(e) => setTom(e.target.value)}
                  className="flex-1 min-w-0 bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#FF4D00]"
                >
                  {ALL_KEYS.map((k) => (
                    <option key={k} value={k}>
                      Tom {k}
                    </option>
                  ))}
                </select>

                {/* Maior/Menor: guardado separado do Tom, nunca como "Bm" em
                    texto livre — é o que permite a transposição e o futuro
                    campo harmônico saberem a qualidade do tom, não só a nota. */}
                <div className="flex bg-[#080808] border border-slate-800 rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModo('Maior')}
                    className={`px-2.5 rounded-lg text-xs font-bold transition-all ${
                      modo === 'Maior' ? 'bg-[#FF4D00] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Maior
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo('Menor')}
                    className={`px-2.5 rounded-lg text-xs font-bold transition-all ${
                      modo === 'Menor' ? 'bg-[#FF4D00] text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Menor
                  </button>
                </div>
              </div>
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
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Letra com Cifras & Divisão de Vozes
              </label>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF4D00]" />
                Clique nos botões abaixo para marcar vozes
              </span>
            </div>

            {/* Vocal & Section Quick Insertion Toolbar */}
            <div className="bg-[#0c0c0c] border border-slate-800/80 rounded-xl p-2 mb-2 space-y-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1 mr-1">
                  <Mic className="w-3 h-3 text-[#FF4D00]" />
                  Vozes:
                </span>
                {availableVocals.map((vocal) => {
                  const cfg = getVocalConfig(vocal);
                  return (
                    <button
                      key={vocal}
                      type="button"
                      onClick={() => insertTagAtCursor(`[Voz: ${vocal}]`)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}
                      title={`Inserir tag [Voz: ${vocal}]`}
                    >
                      + {vocal}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsDuetBuilderOpen(!isDuetBuilderOpen)}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-black border border-amber-500/40 bg-amber-500/15 text-amber-300 shrink-0 transition-all hover:bg-amber-500/25 active:scale-95 flex items-center gap-1"
                  title="Criar marcação de Dueto ou 2+ Vozes cantando juntas"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>+ Dueto (2 Vozes)</span>
                </button>
              </div>

              {/* Duet Builder Panel */}
              {isDuetBuilderOpen && (
                <div className="p-2.5 rounded-xl bg-[#141414] border border-amber-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">
                      Selecione quem canta junto nessa estrofe:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedDuetVocals.length > 0 ? selectedDuetVocals.join(' & ') : 'Nenhuma selecionada'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {availableVocals.filter(v => v !== 'Todos' && v !== 'Uníssono').map((vocal) => {
                      const cfg = getVocalConfig(vocal);
                      const isSelected = selectedDuetVocals.includes(vocal);
                      return (
                        <button
                          key={vocal}
                          type="button"
                          onClick={() => toggleDuetVocal(vocal)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? `${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText} ring-2 ring-white/50 scale-105`
                              : 'bg-[#181818] border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isSelected ? `✓ ${vocal}` : `+ ${vocal}`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    {/* Quick presets */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Atalhos:</span>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('[Voz: Larissa & Leticia]')}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-pink-300 font-bold hover:bg-slate-800 shrink-0"
                      >
                        Larissa & Letícia
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('[Voz: Larissa & Bianca]')}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-purple-300 font-bold hover:bg-slate-800 shrink-0"
                      >
                        Larissa & Bianca
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTagAtCursor('[Voz: Joey & Leticia]')}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-amber-300 font-bold hover:bg-slate-800 shrink-0"
                      >
                        Joey & Letícia
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertCustomDuet}
                      disabled={selectedDuetVocals.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 ml-2"
                    >
                      Inserir Tag Dueto
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/60 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 mr-1">
                  Seções:
                </span>
                {['[INTRO]', '[VERSO 1]', '[REFRÃO]', '[PONTE]', '[FINAL]', '(2x)'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => insertTagAtCursor(sec)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#181818] hover:bg-[#222] text-slate-300 border border-slate-700 shrink-0 transition-all hover:text-white"
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={letra}
              onChange={(e) => setLetra(e.target.value)}
              placeholder={`[INTRO]\n[E] [B] [C#m] [A]\n\n[Voz: Larissa]\n[E] Sobre o trono de glória...\n\n[Voz: Bianca]\n[A] Te exaltamos para sempre...\n\n[Voz: Todos]\n[C#m] Santo, Santo...`}
              rows={9}
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
