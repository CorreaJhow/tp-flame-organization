import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Trash2, 
  Layers, 
  FileText, 
  ExternalLink, 
  Plus, 
  Tag, 
  MessageSquare,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Edit3,
  Clock,
  Activity,
  Copy,
  Mic,
  Music2,
  Sparkles,
  Eye,
  Check
} from 'lucide-react';
import { Musica, Versao, Arquivo, Nota } from '../types';
import { formatKeyDisplay, keyOffset } from '../utils/chordTransposer';
import { storage } from '../services/storage';
import { ChordViewer } from './ChordViewer';
import { SongFormModal } from './SongFormModal';
import { getLastPlayedInfo } from '../utils/songHistory';
import { ConfirmModal } from './ConfirmModal';
import { HistoricoExecucoes } from './HistoricoExecucoes';
import { useToast } from '../context/ToastContext';
import { getVocalConfig } from '../utils/vocalColors';

interface SongDetailModalProps {
  musica: Musica;
  initialVersaoId?: string;
  initialTom?: string; // tom salvo no culto de onde a ficha foi aberta
  versoes: Versao[];
  arquivos: Arquivo[];
  notas: Nota[];
  onClose: () => void;
  onDataChanged: () => void;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({
  musica,
  initialVersaoId,
  initialTom,
  versoes,
  arquivos,
  notas,
  onClose,
  onDataChanged
}) => {
  const { showToast } = useToast();
  const [showConfirmDeleteMusica, setShowConfirmDeleteMusica] = useState(false);

  const [selectedVersaoId, setSelectedVersaoId] = useState<string>(
    versoes.find((v) => v.ID === initialVersaoId)?.ID ?? (versoes.length > 0 ? versoes[0].ID : '')
  );
  const [semitones, setSemitones] = useState<number>(() => {
    const v = versoes.find((x) => x.ID === initialVersaoId);
    return v ? keyOffset(v.Tom, initialTom) : 0;
  });
  const [activeTab, setActiveTab] = useState<'letra' | 'notas' | 'arquivos'>('letra');

  // Edit Song Modal State
  const [showEditSongModal, setShowEditSongModal] = useState(false);

  // Vocal Annotation & Focus State in Song Detail
  const [focusVoice, setFocusVoice] = useState<string | null>(null);
  const [showVocalHighlights, setShowVocalHighlights] = useState(true);

  // Form states for adding notes/files
  const [showAddNota, setShowAddNota] = useState(false);
  const [newNotaInst, setNewNotaInst] = useState<Nota['Instrumento']>('Teclado');
  const [newNotaObs, setNewNotaObs] = useState('');
  const [isCustomCifraMode, setIsCustomCifraMode] = useState(false);

  const [showAddArq, setShowAddArq] = useState(false);
  const [newArqTipo, setNewArqTipo] = useState<Arquivo['Tipo']>('Spotify');
  const [newArqUrl, setNewArqUrl] = useState('');
  const [newArqNome, setNewArqNome] = useState('');

  const [histTick, setHistTick] = useState(0); // refaz o selo quando o histórico muda

  const currentVersao = versoes.find(v => v.ID === selectedVersaoId) || versoes[0];

  // Available vocals from integrantes
  const availableVocals = useMemo(() => {
    const integrantes = storage.getIntegrantes();
    const vocalMembers = integrantes
      .filter((i) => i.Funcao?.toLowerCase().includes('vocal') || i.Funcao?.toLowerCase().includes('ministro'))
      .map((i) => i.Nome.split(' ')[0]);

    const defaultVocals = ['Larissa', 'Bianca', 'Leticia', 'Jhow', 'Todos'];
    return Array.from(new Set([...defaultVocals, ...vocalMembers]));
  }, []);

  const currentKeyDisplay = currentVersao
    ? formatKeyDisplay(currentVersao.Tom, currentVersao.Modo, semitones)
    : 'C';

  const currentNotas = currentVersao
    ? notas.filter(n => n.ID_Versao === currentVersao.ID)
    : [];

  const currentArquivos = currentVersao
    ? arquivos.filter(a => a.ID_Versao === currentVersao.ID)
    : [];

  // Calculate Last Played info across all cultos and history
  const lastPlayedInfo = useMemo(() => {
    if (!currentVersao) return null;
    const cultosList = storage.getCultos();
    const repList = storage.getRepertorio();
    const histList = storage.getHistorico();
    return getLastPlayedInfo(currentVersao.ID, cultosList, repList, histList, versoes);
  }, [currentVersao, versoes, histTick]);

  const handleStartCifrarBase = () => {
    if (!currentVersao) return;
    setNewNotaObs(currentVersao.Letra || '');
    setIsCustomCifraMode(true);
    setShowAddNota(true);
  };

  const handleAddNotaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersao || !newNotaObs.trim()) return;

    storage.addNota({
      ID_Versao: currentVersao.ID,
      Instrumento: newNotaInst,
      Observacao: newNotaObs.trim()
    });

    setNewNotaObs('');
    setIsCustomCifraMode(false);
    setShowAddNota(false);
    showToast(isCustomCifraMode ? 'Cifra do músico salva com sucesso!' : 'Nota de instrumento adicionada!', 'success');
    onDataChanged();
  };

  const handleDeleteNota = (notaId: string) => {
    storage.deleteNota(notaId);
    showToast('Nota removida', 'info');
    onDataChanged();
  };

  const handleAddArquivoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersao || !newArqUrl.trim()) return;

    storage.addArquivo({
      ID_Versao: currentVersao.ID,
      Tipo: newArqTipo,
      URL: newArqUrl.trim(),
      Nome: newArqNome.trim() || undefined
    });

    setNewArqUrl('');
    setNewArqNome('');
    setShowAddArq(false);
    showToast('Anexo adicionado com sucesso!', 'success');
    onDataChanged();
  };

  const handleDeleteArquivo = (arqId: string) => {
    storage.deleteArquivo(arqId);
    showToast('Anexo removido', 'info');
    onDataChanged();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-line w-full max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-start justify-between bg-surface sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand/20 text-brand-ink border border-brand/30">
                {musica.Categoria}
              </span>
            </div>
            <h2 className="text-lg font-bold text-fg leading-tight">
              {musica.Nome}
            </h2>
            <p className="text-xs text-fg-muted">
              {musica.Artista}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditSongModal(true)}
              className="py-1.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-slate-950 font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
              title="Editar Cifra e Detalhes"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => setShowConfirmDeleteMusica(true)}
              className="p-2 rounded-xl text-fg-muted hover:text-red-400 hover:bg-red-950/40 border border-line transition-colors"
              title="Excluir Música"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="close-song-detail-modal"
              onClick={onClose}
              className="p-2 rounded-xl bg-inset-2 hover:bg-red-950/80 text-fg-soft hover:text-red-400 font-bold transition-all shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center border border-line-strong"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Versions Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-brand-ink" />
                Versões Disponíveis ({versoes.length})
              </span>
              {currentVersao && (
                <button
                  onClick={() => {
                    const nova = storage.duplicateVersao(currentVersao.ID, `Cópia de ${currentVersao.Nome_Versao}`);
                    if (!nova) return;
                    onDataChanged();
                    setSelectedVersaoId(nova.ID);
                    showToast('Versão duplicada. Toque em Editar para ajustar nome, tom e cifra.', 'success');
                  }}
                  className="text-[11px] font-bold text-brand-ink flex items-center gap-1 active:scale-95"
                  title="Duplicar esta versão"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicar versão
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {versoes.map((v) => (
                <button
                  key={v.ID}
                  onClick={() => {
                    setSelectedVersaoId(v.ID);
                    setSemitones(0); // reset transpose on version switch
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedVersaoId === v.ID
                      ? 'bg-brand text-slate-950 border-brand shadow-md font-black'
                      : 'bg-canvas text-fg-muted border-line hover:text-fg'
                  }`}
                >
                  {v.Nome_Versao} (Tom {formatKeyDisplay(v.Tom, v.Modo)})
                </button>
              ))}
            </div>
          </div>

          {currentVersao && (
            <>
              {/* Key, BPM & Compasso Bar */}
              <div className="bg-canvas border border-line/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-fg-subtle uppercase font-bold block">
                      Tom da Versão
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-brand-ink">
                        Tom {currentKeyDisplay}
                      </span>
                      {semitones !== 0 && (
                        <span className="text-[10px] text-fg-muted font-medium">
                          (Original: {formatKeyDisplay(currentVersao.Tom, currentVersao.Modo)})
                        </span>
                      )}
                    </div>
                  </div>

                  {(currentVersao.BPM || currentVersao.Compasso) && (
                    <div className="border-l border-line pl-4">
                      <span className="text-[10px] text-fg-subtle uppercase font-bold block flex items-center gap-1">
                        <Activity className="w-3 h-3 text-brand-ink" />
                        Andamento
                      </span>
                      <div className="text-xs font-black text-fg-2 mt-0.5">
                        {currentVersao.BPM ? `${currentVersao.BPM} BPM` : 'BPM N/I'}
                        <span className="text-fg-subtle font-medium ml-1">
                          ({currentVersao.Compasso || '4/4'})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transpose Buttons */}
                <div className="flex items-center gap-1.5 bg-surface border border-line p-1 rounded-xl">
                  <button
                    onClick={() => setSemitones(s => s - 1)}
                    className="p-1.5 rounded-lg bg-inset hover:bg-inset-2 text-fg-2 text-xs font-bold flex items-center gap-1"
                    title="Diminuir meio tom (-1)"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-brand-ink" />
                    <span>-1</span>
                  </button>

                  <button
                    onClick={() => setSemitones(s => s + 1)}
                    className="p-1.5 rounded-lg bg-inset hover:bg-inset-2 text-fg-2 text-xs font-bold flex items-center gap-1"
                    title="Aumentar meio tom (+1)"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-brand-ink" />
                    <span>+1</span>
                  </button>

                  {semitones !== 0 && (
                    <button
                      onClick={() => setSemitones(0)}
                      className="p-1.5 rounded-lg bg-brand/20 text-brand-ink hover:bg-brand/30 text-xs font-bold"
                      title="Restaurar Tom Original"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Last Played Badge / Alert */}
              {lastPlayedInfo && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    lastPlayedInfo.isRecent
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-canvas border-line text-fg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 shrink-0 ${lastPlayedInfo.isRecent ? 'text-amber-400 animate-pulse' : 'text-fg-subtle'}`} />
                    <span>
                      <strong>Última Execução:</strong> {lastPlayedInfo.formattedBadge}
                    </span>
                  </div>
                  {lastPlayedInfo.lastCultoName && (
                    <span className="text-[10px] text-fg-subtle hidden sm:inline">
                      {lastPlayedInfo.lastCultoName}
                    </span>
                  )}
                </div>
              )}

              <HistoricoExecucoes
                versao={currentVersao}
                versoes={versoes}
                onChanged={() => { setHistTick((t) => t + 1); onDataChanged(); }}
              />

              {/* Structure Display */}
              {currentVersao.Estrutura && (
                <div className="bg-canvas border border-line/80 rounded-2xl p-3">
                  <span className="text-[10px] uppercase font-bold text-fg-subtle block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-brand-ink" />
                    Estrutura da Música:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {String(currentVersao.Estrutura || '')
                      .split('-')
                      .map((part, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-surface border border-line text-brand-ink"
                        >
                          {part.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Tabs for Letra/Notas/Arquivos */}
              <div className="border-b border-line flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('letra')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'letra'
                      ? 'border-brand text-brand-ink'
                      : 'border-transparent text-fg-muted hover:text-fg-2'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Letra & Cifra</span>
                </button>

                <button
                  onClick={() => setActiveTab('notas')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'notas'
                      ? 'border-brand text-brand-ink'
                      : 'border-transparent text-fg-muted hover:text-fg-2'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Notas Instrumentos ({currentNotas.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('arquivos')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'arquivos'
                      ? 'border-brand text-brand-ink'
                      : 'border-transparent text-fg-muted hover:text-fg-2'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Anexos & Links ({currentArquivos.length})</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'letra' && (
                <div className="space-y-3">
                  {/* Vocal Controls & Voice Filter Chips */}
                  <div className="bg-canvas border border-line/80 rounded-2xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowVocalHighlights(!showVocalHighlights)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                            showVocalHighlights
                              ? 'bg-brand/20 text-brand-ink border border-brand/40'
                              : 'bg-surface text-fg-subtle border border-line'
                          }`}
                          title="Ativar/Desativar Destaques de Vozes"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Destaques de Vozes: {showVocalHighlights ? 'ON' : 'OFF'}</span>
                        </button>

                        {focusVoice && (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Foco: {focusVoice}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (currentVersao?.Letra) {
                              navigator.clipboard.writeText(currentVersao.Letra);
                              showToast('Cifra copiada para a área de transferência!', 'success');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-hover hover:bg-chip text-fg-soft hover:text-fg border border-line-strong font-sans font-bold text-xs transition-all active:scale-95"
                          title="Copiar Cifra"
                        >
                          <Copy className="w-3.5 h-3.5 text-brand-ink" />
                          <span>Copiar Cifra</span>
                        </button>
                      </div>
                    </div>

                    {showVocalHighlights && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-line/60">
                        <span className="text-[10px] font-bold text-fg-subtle uppercase shrink-0">
                          Filtrar Voz:
                        </span>
                        <button
                          onClick={() => setFocusVoice(null)}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                            focusVoice === null
                              ? 'bg-fg text-canvas shadow-md font-extrabold'
                              : 'bg-surface text-fg-muted hover:text-fg border border-line'
                          }`}
                        >
                          Todas as Vozes
                        </button>

                        {availableVocals.map((vocal) => {
                          const cfg = getVocalConfig(vocal);
                          const isSelected = focusVoice?.toLowerCase() === vocal.toLowerCase();
                          return (
                            <button
                              key={vocal}
                              onClick={() => setFocusVoice(isSelected ? null : vocal)}
                              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border shrink-0 transition-all ${
                                isSelected
                                  ? `${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText} ring-2 ring-fg/40 shadow-sm`
                                  : 'bg-surface border-line text-fg-muted hover:text-fg-2'
                              }`}
                            >
                              {isSelected ? `✓ ${vocal}` : vocal}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-canvas border border-line/80 rounded-2xl p-4 sm:p-5 font-mono text-xs text-fg-2 leading-relaxed shadow-inner">
                    <ChordViewer 
                      text={currentVersao.Letra} 
                      semitones={semitones}
                      focusVoice={focusVoice}
                      showVocalHighlights={showVocalHighlights}
                      knownSingers={availableVocals}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'notas' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-fg-muted">
                      Cifras personalizadas e orientações por integrante/instrumento
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStartCifrarBase}
                        className="py-1 px-2.5 rounded-xl bg-gradient-to-r from-brand to-orange-600 text-slate-950 hover:opacity-90 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        title="Criar versão cifrada personalizada a partir da letra base"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Cifrar a partir da Letra Base</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCustomCifraMode(false);
                          setShowAddNota(!showAddNota);
                        }}
                        className="py-1 px-2.5 rounded-xl bg-surface-hover text-fg-soft hover:bg-chip text-xs font-bold flex items-center gap-1 border border-line-strong"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nota Rápida</span>
                      </button>
                    </div>
                  </div>

                  {showAddNota && (
                    <form onSubmit={handleAddNotaSubmit} className="bg-canvas p-3.5 rounded-2xl border border-line space-y-2.5 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-fg-soft">Instrumento / Integrante:</span>
                          <select
                            value={newNotaInst}
                            onChange={(e) => setNewNotaInst(e.target.value as Nota['Instrumento'])}
                            className="bg-surface border border-line-strong rounded-xl text-xs text-fg p-2 font-bold"
                          >
                            <option value="Teclado">Teclado</option>
                            <option value="Violão">Violão</option>
                            <option value="Guitarra">Guitarra</option>
                            <option value="Baixo">Baixo</option>
                            <option value="Bateria">Bateria</option>
                            <option value="Vocal">Vocal</option>
                            <option value="Som/Mídia">Som/Mídia</option>
                            <option value="Geral">Geral</option>
                          </select>
                        </div>

                        {isCustomCifraMode && (
                          <span className="text-[10px] font-bold text-brand-ink bg-brand/10 border border-brand/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Music2 className="w-3 h-3" />
                            Cifra Personalizada
                          </span>
                        )}
                      </div>

                      {isCustomCifraMode && (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                          <span className="text-[10px] text-fg-subtle font-bold uppercase shrink-0">Inserir Acordes:</span>
                          {['[C]', '[G]', '[Am]', '[F]', '[D]', '[Em]', '[A]', '[E]', '[B]', '[C#m]', '[Bb]'].map((chord) => (
                            <button
                              key={chord}
                              type="button"
                              onClick={() => setNewNotaObs((prev) => `${prev} ${chord}`)}
                              className="px-1.5 py-0.5 rounded bg-surface-hover hover:bg-chip text-brand-ink font-mono text-[11px] font-black border border-line shrink-0"
                            >
                              {chord}
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        value={newNotaObs}
                        onChange={(e) => setNewNotaObs(e.target.value)}
                        placeholder={isCustomCifraMode ? "Edite e cifre a música diretamente a partir da letra base..." : "Escreva a observação técnica ou instrução..."}
                        className={`w-full bg-surface border border-line rounded-xl p-2.5 text-xs text-fg placeholder-fg-faint focus:outline-none focus:border-brand ${
                          isCustomCifraMode ? 'font-mono leading-relaxed' : ''
                        }`}
                        rows={isCustomCifraMode ? 10 : 3}
                        required
                      />

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddNota(false);
                            setIsCustomCifraMode(false);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs text-fg-muted hover:text-fg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl bg-brand text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCustomCifraMode ? 'Salvar Cifra Personalizada' : 'Salvar Nota'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {currentNotas.length === 0 ? (
                    <div className="py-6 text-center bg-canvas rounded-2xl border border-line/80 space-y-2">
                      <p className="text-xs text-fg-muted">
                        Nenhuma cifra ou nota personalizada cadastrada para esta versão.
                      </p>
                      <p className="text-[11px] text-fg-faint">
                        Cada músico da equipe pode criar sua própria cifra ou observação a partir da letra base.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {currentNotas.map((n) => {
                        const isFullCifra = n.Observacao && n.Observacao.includes('\n');
                        return (
                          <div key={n.ID} className="bg-canvas border border-line rounded-2xl p-3.5 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-brand-ink bg-brand/10 border border-brand/30 px-2.5 py-0.5 rounded-lg text-xs">
                                  [{n.Instrumento}]
                                </span>
                                {isFullCifra && (
                                  <span className="text-[10px] text-fg-subtle font-bold bg-chip px-2 py-0.5 rounded border border-line">
                                    Cifra Completa
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteNota(n.ID)}
                                className="p-1 text-fg-subtle hover:text-red-400 rounded-lg hover:bg-inset transition-colors"
                                title="Remover nota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {isFullCifra ? (
                              <div className="bg-surface p-3 rounded-xl border border-line/80 max-h-60 overflow-y-auto">
                                <ChordViewer text={n.Observacao} semitones={semitones} />
                              </div>
                            ) : (
                              <p className="text-fg-soft leading-relaxed font-sans">
                                {n.Observacao}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'arquivos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-fg-muted">
                      Links e documentos da versão
                    </span>
                    <button
                      onClick={() => setShowAddArq(!showAddArq)}
                      className="py-1 px-2.5 rounded-xl bg-brand/20 text-brand-ink hover:bg-brand/30 text-xs font-bold flex items-center gap-1 border border-brand/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Anexar Link</span>
                    </button>
                  </div>

                  {showAddArq && (
                    <form onSubmit={handleAddArquivoSubmit} className="bg-canvas p-3 rounded-2xl border border-line space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newArqTipo}
                          onChange={(e) => setNewArqTipo(e.target.value as Arquivo['Tipo'])}
                          className="bg-surface border border-line rounded-xl text-xs text-fg p-2"
                        >
                          <option value="Spotify">Spotify</option>
                          <option value="Youtube">Youtube</option>
                          <option value="Cifra">Cifra Club</option>
                          <option value="PDF">PDF / Partitura</option>
                          <option value="Drive">Google Drive</option>
                          <option value="Outro">Outro</option>
                        </select>

                        <input
                          type="text"
                          value={newArqNome}
                          onChange={(e) => setNewArqNome(e.target.value)}
                          placeholder="Nome do link (opcional)"
                          className="bg-surface border border-line rounded-xl p-2 text-xs text-fg"
                        />
                      </div>

                      <input
                        type="url"
                        value={newArqUrl}
                        onChange={(e) => setNewArqUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-surface border border-line rounded-xl p-2 text-xs text-fg"
                        required
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddArq(false)}
                          className="px-2.5 py-1 rounded-xl text-xs text-fg-muted"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-xl bg-brand text-slate-950 font-black text-xs"
                        >
                          Anexar
                        </button>
                      </div>
                    </form>
                  )}

                  {currentArquivos.length === 0 ? (
                    <p className="text-xs text-fg-subtle italic py-4 text-center bg-canvas rounded-xl border border-line/80">
                      Nenhum anexo ou link cadastrado para esta versão.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentArquivos.map((a) => (
                        <div
                          key={a.ID}
                          className="bg-canvas hover:bg-surface border border-line rounded-2xl p-3 text-xs flex items-center justify-between transition-colors group"
                        >
                          <a
                            href={a.URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 min-w-0 flex-1"
                          >
                            <ExternalLink className="w-4 h-4 text-brand-ink shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-fg block truncate">
                                {a.Nome || a.Tipo}
                              </span>
                              <span className="text-[10px] text-fg-muted truncate block max-w-xs">
                                {a.URL}
                              </span>
                            </div>
                          </a>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-inset text-fg-soft border border-line">
                              {a.Tipo}
                            </span>
                            <button
                              onClick={() => handleDeleteArquivo(a.ID)}
                              className="p-1 text-fg-subtle hover:text-red-400 rounded-lg hover:bg-inset"
                              title="Remover anexo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Sticky Footer for Easy Close on Mobile */}
        <div className="p-3 border-t border-line/80 bg-surface flex justify-end shrink-0 sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-inset-2 hover:bg-inset-3 text-fg-2 font-bold text-xs flex items-center justify-center gap-2 border border-line-strong active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            <span>Fechar Visualização</span>
          </button>
        </div>
      </div>

      {/* Edit Song Modal Overlay */}
      {showEditSongModal && (
        <SongFormModal
          musicaToEdit={musica}
          versaoToEdit={currentVersao}
          onClose={() => setShowEditSongModal(false)}
          onDataChanged={() => {
            onDataChanged();
            setShowEditSongModal(false);
          }}
        />
      )}

      {/* Confirm Delete Song Modal */}
      <ConfirmModal
        isOpen={showConfirmDeleteMusica}
        title="Excluir Música"
        message={`Deseja mesmo excluir a música "${musica.Nome}" e todas as suas versões? Esta ação é irreversível.`}
        confirmText="Sim, Excluir Música"
        onConfirm={() => {
          storage.deleteMusica(musica.ID);
          onDataChanged();
          showToast('Música excluída com sucesso', 'info');
          onClose();
        }}
        onClose={() => setShowConfirmDeleteMusica(false)}
      />
    </div>
  );
};
