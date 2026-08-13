import React, { useState, useMemo } from 'react';
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
  Copy
} from 'lucide-react';
import { Musica, Versao, Arquivo, Nota } from '../types';
import { getNextKey } from '../utils/chordTransposer';
import { storage } from '../services/storage';
import { ChordViewer } from './ChordViewer';
import { SongFormModal } from './SongFormModal';
import { getLastPlayedInfo } from '../utils/songHistory';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../context/ToastContext';

interface SongDetailModalProps {
  musica: Musica;
  versoes: Versao[];
  arquivos: Arquivo[];
  notas: Nota[];
  onClose: () => void;
  onDataChanged: () => void;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({
  musica,
  versoes,
  arquivos,
  notas,
  onClose,
  onDataChanged
}) => {
  const { showToast } = useToast();
  const [showConfirmDeleteMusica, setShowConfirmDeleteMusica] = useState(false);

  const [selectedVersaoId, setSelectedVersaoId] = useState<string>(
    versoes.length > 0 ? versoes[0].ID : ''
  );
  const [semitones, setSemitones] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'letra' | 'notas' | 'arquivos'>('letra');

  // Edit Song Modal State
  const [showEditSongModal, setShowEditSongModal] = useState(false);

  // Form states for adding notes/files
  const [showAddNota, setShowAddNota] = useState(false);
  const [newNotaInst, setNewNotaInst] = useState<Nota['Instrumento']>('Teclado');
  const [newNotaObs, setNewNotaObs] = useState('');

  const [showAddArq, setShowAddArq] = useState(false);
  const [newArqTipo, setNewArqTipo] = useState<Arquivo['Tipo']>('Spotify');
  const [newArqUrl, setNewArqUrl] = useState('');
  const [newArqNome, setNewArqNome] = useState('');

  const currentVersao = versoes.find(v => v.ID === selectedVersaoId) || versoes[0];

  const currentKeyDisplay = currentVersao
    ? getNextKey(currentVersao.Tom, semitones)
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
    return getLastPlayedInfo(currentVersao.ID, cultosList, repList, histList);
  }, [currentVersao, versoes]);

  const handleAddNotaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersao || !newNotaObs.trim()) return;

    storage.addNota({
      ID_Versao: currentVersao.ID,
      Instrumento: newNotaInst,
      Observacao: newNotaObs.trim()
    });

    setNewNotaObs('');
    setShowAddNota(false);
    showToast('Nota de instrumento adicionada!', 'success');
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
      <div className="bg-[#121212] border border-slate-800 w-full max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-[#121212] sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
                {musica.Categoria}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {musica.Nome}
            </h2>
            <p className="text-xs text-slate-400">
              {musica.Artista}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditSongModal(true)}
              className="py-1.5 px-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
              title="Editar Cifra e Detalhes"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => setShowConfirmDeleteMusica(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-slate-800 transition-colors"
              title="Excluir Música"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              id="close-song-detail-modal"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-400 font-bold transition-all shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center border border-slate-700"
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#FF4D00]" />
                Versões Disponíveis ({versoes.length})
              </span>
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
                      ? 'bg-[#FF4D00] text-slate-950 border-[#FF4D00] shadow-md font-black'
                      : 'bg-[#080808] text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {v.Nome_Versao} (Tom {v.Tom})
                </button>
              ))}
            </div>
          </div>

          {currentVersao && (
            <>
              {/* Key, BPM & Compasso Bar */}
              <div className="bg-[#080808] border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Tom da Versão
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-[#FF4D00]">
                        Tom {currentKeyDisplay}
                      </span>
                      {semitones !== 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          (Original: {currentVersao.Tom})
                        </span>
                      )}
                    </div>
                  </div>

                  {(currentVersao.BPM || currentVersao.Compasso) && (
                    <div className="border-l border-slate-800 pl-4">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#FF4D00]" />
                        Andamento
                      </span>
                      <div className="text-xs font-black text-slate-200 mt-0.5">
                        {currentVersao.BPM ? `${currentVersao.BPM} BPM` : 'BPM N/I'}
                        <span className="text-slate-500 font-medium ml-1">
                          ({currentVersao.Compasso || '4/4'})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transpose Buttons */}
                <div className="flex items-center gap-1.5 bg-[#121212] border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setSemitones(s => s - 1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="Diminuir meio tom (-1)"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>-1</span>
                  </button>

                  <button
                    onClick={() => setSemitones(s => s + 1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="Aumentar meio tom (+1)"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>+1</span>
                  </button>

                  {semitones !== 0 && (
                    <button
                      onClick={() => setSemitones(0)}
                      className="p-1.5 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] hover:bg-[#FF4D00]/30 text-xs font-bold"
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
                      : 'bg-[#080808] border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 shrink-0 ${lastPlayedInfo.isRecent ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>
                      <strong>Última Execução:</strong> {lastPlayedInfo.formattedBadge}
                    </span>
                  </div>
                  {lastPlayedInfo.lastCultoName && (
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      {lastPlayedInfo.lastCultoName}
                    </span>
                  )}
                </div>
              )}

              {/* Structure Display */}
              {currentVersao.Estrutura && (
                <div className="bg-[#080808] border border-slate-800/80 rounded-2xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#FF4D00]" />
                    Estrutura da Música:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {String(currentVersao.Estrutura || '')
                      .split('-')
                      .map((part, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#121212] border border-slate-800 text-[#FF4D00]"
                        >
                          {part.trim()}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Tabs for Letra/Notas/Arquivos */}
              <div className="border-b border-slate-800 flex items-center gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('letra')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'letra'
                      ? 'border-[#FF4D00] text-[#FF4D00]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Letra & Cifra</span>
                </button>

                <button
                  onClick={() => setActiveTab('notas')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'notas'
                      ? 'border-[#FF4D00] text-[#FF4D00]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Notas Instrumentos ({currentNotas.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('arquivos')}
                  className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'arquivos'
                      ? 'border-[#FF4D00] text-[#FF4D00]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Anexos & Links ({currentArquivos.length})</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'letra' && (
                <div className="bg-[#080808] border border-slate-800/80 rounded-2xl p-4 sm:p-5 font-mono text-xs text-slate-200 leading-relaxed shadow-inner relative group">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => {
                        if (currentVersao?.Letra) {
                          navigator.clipboard.writeText(currentVersao.Letra);
                          showToast('Cifra copiada para a área de transferência!', 'success');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181818] hover:bg-[#222] text-slate-300 hover:text-white border border-slate-700 font-sans font-bold text-xs transition-all active:scale-95"
                      title="Copiar Cifra"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Copiar Cifra</span>
                    </button>
                  </div>
                  <ChordViewer text={currentVersao.Letra} semitones={semitones} />
                </div>
              )}

              {activeTab === 'notas' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Orientações específicas por instrumento
                    </span>
                    <button
                      onClick={() => setShowAddNota(!showAddNota)}
                      className="py-1 px-2.5 rounded-xl bg-[#FF4D00]/20 text-[#FF4D00] hover:bg-[#FF4D00]/30 text-xs font-bold flex items-center gap-1 border border-[#FF4D00]/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Nota</span>
                    </button>
                  </div>

                  {showAddNota && (
                    <form onSubmit={handleAddNotaSubmit} className="bg-[#080808] p-3 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={newNotaInst}
                          onChange={(e) => setNewNotaInst(e.target.value as Nota['Instrumento'])}
                          className="bg-[#121212] border border-slate-800 rounded-xl text-xs text-white p-2"
                        >
                          <option value="Teclado">Teclado</option>
                          <option value="Guitarra">Guitarra</option>
                          <option value="Violão">Violão</option>
                          <option value="Baixo">Baixo</option>
                          <option value="Bateria">Bateria</option>
                          <option value="Vocal">Vocal</option>
                          <option value="Som/Mídia">Som/Mídia</option>
                          <option value="Geral">Geral</option>
                        </select>
                      </div>

                      <textarea
                        value={newNotaObs}
                        onChange={(e) => setNewNotaObs(e.target.value)}
                        placeholder="Escreva a observação técnica ou instrução..."
                        className="w-full bg-[#121212] border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        rows={2}
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddNota(false)}
                          className="px-2.5 py-1 rounded-xl text-xs text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs"
                        >
                          Salvar Nota
                        </button>
                      </div>
                    </form>
                  )}

                  {currentNotas.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center bg-[#080808] rounded-xl border border-slate-800/80">
                      Nenhuma nota técnica cadastrada para esta versão.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentNotas.map((n) => (
                        <div key={n.ID} className="bg-[#080808] border border-slate-800 rounded-2xl p-3 text-xs flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-[#FF4D00] block mb-1">
                              [{n.Instrumento}]
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {n.Observacao}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNota(n.ID)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900"
                            title="Remover nota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'arquivos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Links e documentos da versão
                    </span>
                    <button
                      onClick={() => setShowAddArq(!showAddArq)}
                      className="py-1 px-2.5 rounded-xl bg-[#FF4D00]/20 text-[#FF4D00] hover:bg-[#FF4D00]/30 text-xs font-bold flex items-center gap-1 border border-[#FF4D00]/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Anexar Link</span>
                    </button>
                  </div>

                  {showAddArq && (
                    <form onSubmit={handleAddArquivoSubmit} className="bg-[#080808] p-3 rounded-2xl border border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newArqTipo}
                          onChange={(e) => setNewArqTipo(e.target.value as Arquivo['Tipo'])}
                          className="bg-[#121212] border border-slate-800 rounded-xl text-xs text-white p-2"
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
                          className="bg-[#121212] border border-slate-800 rounded-xl p-2 text-xs text-white"
                        />
                      </div>

                      <input
                        type="url"
                        value={newArqUrl}
                        onChange={(e) => setNewArqUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#121212] border border-slate-800 rounded-xl p-2 text-xs text-white"
                        required
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddArq(false)}
                          className="px-2.5 py-1 rounded-xl text-xs text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs"
                        >
                          Anexar
                        </button>
                      </div>
                    </form>
                  )}

                  {currentArquivos.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center bg-[#080808] rounded-xl border border-slate-800/80">
                      Nenhum anexo ou link cadastrado para esta versão.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentArquivos.map((a) => (
                        <div
                          key={a.ID}
                          className="bg-[#080808] hover:bg-[#121212] border border-slate-800 rounded-2xl p-3 text-xs flex items-center justify-between transition-colors group"
                        >
                          <a
                            href={a.URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 min-w-0 flex-1"
                          >
                            <ExternalLink className="w-4 h-4 text-[#FF4D00] shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">
                                {a.Nome || a.Tipo}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                                {a.URL}
                              </span>
                            </div>
                          </a>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                              {a.Tipo}
                            </span>
                            <button
                              onClick={() => handleDeleteArquivo(a.ID)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900"
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
        <div className="p-3 border-t border-slate-800/80 bg-[#121212] flex justify-end shrink-0 sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
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
