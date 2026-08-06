import React, { useState } from 'react';
import { 
  X, 
  Music2, 
  Layers, 
  FileText, 
  ExternalLink, 
  Plus, 
  Sparkles, 
  Volume2, 
  FileCode, 
  Tag, 
  MessageSquare,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { Musica, Versao, Arquivo, Nota } from '../types';
import { transposeTextChords, getNextKey } from '../utils/chordTransposer';
import { storage } from '../services/storage';

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
  const [selectedVersaoId, setSelectedVersaoId] = useState<string>(
    versoes.length > 0 ? versoes[0].ID : ''
  );
  const [semitones, setSemitones] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'letra' | 'notas' | 'arquivos'>('letra');

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
    onDataChanged();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {musica.Categoria}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                SSOT ID: {musica.ID}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {musica.Nome}
            </h2>
            <p className="text-xs text-slate-400">
              {musica.Artista}
            </p>
          </div>

          <button
            id="close-song-detail-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Versions Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
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
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {v.Nome_Versao} (Tom {v.Tom})
                </button>
              ))}
            </div>
          </div>

          {currentVersao && (
            <>
              {/* Key Transposer & Controls Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Tom da Versão
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-amber-400">
                      Tom {currentKeyDisplay}
                    </span>
                    {semitones !== 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Original: {currentVersao.Tom})
                      </span>
                    )}
                  </div>
                </div>

                {/* Transpose Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setSemitones(s => s - 1)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="Diminuir meio tom (-1)"
                  >
                    <ArrowDown className="w-3 h-3 text-amber-400" />
                    <span>-1</span>
                  </button>

                  <button
                    onClick={() => setSemitones(s => s + 1)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                    title="Aumentar meio tom (+1)"
                  >
                    <ArrowUp className="w-3 h-3 text-amber-400" />
                    <span>+1</span>
                  </button>

                  {semitones !== 0 && (
                    <button
                      onClick={() => setSemitones(0)}
                      className="p-1.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold"
                      title="Restaurar Tom Original"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Structure Display */}
              {currentVersao.Estrutura && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-400" />
                    Estrutura da Música:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentVersao.Estrutura.split('-').map((part, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300"
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
                      ? 'border-amber-400 text-amber-400'
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
                      ? 'border-amber-400 text-amber-400'
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
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Anexos & Links ({currentArquivos.length})</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'letra' && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                  {transposeTextChords(currentVersao.Letra, semitones)}
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
                      className="py-1 px-2.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Nota</span>
                    </button>
                  </div>

                  {showAddNota && (
                    <form onSubmit={handleAddNotaSubmit} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={newNotaInst}
                          onChange={(e) => setNewNotaInst(e.target.value as Nota['Instrumento'])}
                          className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-1.5"
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        rows={2}
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddNota(false)}
                          className="px-2.5 py-1 rounded text-xs text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs"
                        >
                          Salvar Nota
                        </button>
                      </div>
                    </form>
                  )}

                  {currentNotas.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center bg-slate-950/40 rounded-xl">
                      Nenhuma nota técnica cadastrada para esta versão.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentNotas.map((n) => (
                        <div key={n.ID} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                          <span className="font-bold text-amber-400 block mb-1">
                            [{n.Instrumento}]
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {n.Observacao}
                          </p>
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
                      className="py-1 px-2.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Anexar Link</span>
                    </button>
                  </div>

                  {showAddArq && (
                    <form onSubmit={handleAddArquivoSubmit} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newArqTipo}
                          onChange={(e) => setNewArqTipo(e.target.value as Arquivo['Tipo'])}
                          className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-1.5"
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
                          className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>

                      <input
                        type="url"
                        value={newArqUrl}
                        onChange={(e) => setNewArqUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        required
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddArq(false)}
                          className="px-2.5 py-1 rounded text-xs text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs"
                        >
                          Anexar
                        </button>
                      </div>
                    </form>
                  )}

                  {currentArquivos.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center bg-slate-950/40 rounded-xl">
                      Nenhum anexo ou link cadastrado para esta versão.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentArquivos.map((a) => (
                        <a
                          key={a.ID}
                          href={a.URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-amber-400" />
                            <div>
                              <span className="font-bold text-white block">
                                {a.Nome || a.Tipo}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                                {a.URL}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {a.Tipo}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
