import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Play, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  User, 
  Music2, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Culto, RepertorioItem, Versao, Musica } from '../types';
import { storage } from '../services/storage';

interface CultosViewProps {
  cultos: Culto[];
  repertorio: RepertorioItem[];
  versoes: Versao[];
  musicas: Musica[];
  onOpenStageMode: (culto: Culto) => void;
  onOpenNewCultoModal: () => void;
  onDataChanged: () => void;
}

export const CultosView: React.FC<CultosViewProps> = ({
  cultos,
  repertorio,
  versoes,
  musicas,
  onOpenStageMode,
  onOpenNewCultoModal,
  onDataChanged
}) => {
  const [selectedCultoId, setSelectedCultoId] = useState<string>(
    cultos.length > 0 ? cultos[0].ID : ''
  );
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectedVersaoIdToAdd, setSelectedVersaoIdToAdd] = useState('');
  const [dirigenteToAdd, setDirigenteToAdd] = useState('');
  const [obsToAdd, setObsToAdd] = useState('');

  const currentCulto = cultos.find((c) => c.ID === selectedCultoId) || cultos[0];

  const currentSetlist = currentCulto
    ? repertorio
        .filter((r) => r.ID_Culto === currentCulto.ID)
        .sort((a, b) => a.Ordem - b.Ordem)
    : [];

  const handleAddSongToSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCulto || !selectedVersaoIdToAdd) return;

    storage.addSongToRepertorio(
      currentCulto.ID,
      selectedVersaoIdToAdd,
      dirigenteToAdd.trim(),
      obsToAdd.trim()
    );

    setSelectedVersaoIdToAdd('');
    setDirigenteToAdd('');
    setObsToAdd('');
    setShowAddSongModal(false);
    onDataChanged();
  };

  const handleRemoveSong = (repId: string) => {
    storage.removeSongFromRepertorio(repId);
    onDataChanged();
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!currentCulto) return;
    const items = [...currentSetlist];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    storage.reorderRepertorio(
      currentCulto.ID,
      items.map((i) => i.ID)
    );
    onDataChanged();
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Cultos & Repertórios
          </h2>
          <p className="text-xs text-slate-400">
            {cultos.length} eventos cadastrados no banco de dados
          </p>
        </div>

        <button
          id="add-culto-button"
          onClick={onOpenNewCultoModal}
          className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Culto</span>
        </button>
      </div>

      {/* Services Tabs Selector */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {cultos.map((culto) => (
          <button
            key={culto.ID}
            onClick={() => setSelectedCultoId(culto.ID)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border text-left ${
              selectedCultoId === culto.ID
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <div className="leading-tight">{culto.Nome_Evento}</div>
            <div className="text-[10px] opacity-80">{formatDate(culto.Data)}</div>
          </button>
        ))}
      </div>

      {currentCulto && (
        <div className="space-y-4">
          {/* Selected Service Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {currentCulto.Status}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {currentCulto.Nome_Evento}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {formatDate(currentCulto.Data)}
                </p>
              </div>

              <button
                id="stage-mode-service-button"
                onClick={() => onOpenStageMode(currentCulto)}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Modo Palco</span>
              </button>
            </div>

            {currentCulto.Observacoes && (
              <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                {currentCulto.Observacoes}
              </p>
            )}
          </div>

          {/* Setlist Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-amber-400" />
              Repertório ({currentSetlist.length} Músicas)
            </h3>

            <button
              id="add-song-to-setlist-button"
              onClick={() => setShowAddSongModal(true)}
              className="py-1 px-2.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Música</span>
            </button>
          </div>

          {/* Setlist Items */}
          {currentSetlist.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
              <Music2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-3">
                Nenhuma música no repertório deste culto.
              </p>
              <button
                onClick={() => setShowAddSongModal(true)}
                className="py-1.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Músicas</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {currentSetlist.map((rep, index) => {
                const versao = versoes.find((v) => v.ID === rep.ID_Versao);
                const musica = versao ? musicas.find((m) => m.ID === versao.ID_Musica) : undefined;

                return (
                  <div
                    key={rep.ID}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate">
                            {musica?.Nome || 'Música'}
                          </h4>
                          {versao && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                              Tom {versao.Tom}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate">
                          {musica?.Artista} • {versao?.Nome_Versao}
                        </p>

                        {rep.Dirigente && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-amber-400" />
                            Ministro: {rep.Dirigente}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order & Remove Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === currentSetlist.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveSong(rep.ID)}
                        className="p-1 rounded text-red-400 hover:bg-red-950/50"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Song to Setlist Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-4 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white">
              Adicionar Música ao Repertório
            </h3>

            <form onSubmit={handleAddSongToSetlist} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Selecione a Versão da Música *
                </label>
                <select
                  value={selectedVersaoIdToAdd}
                  onChange={(e) => setSelectedVersaoIdToAdd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Escolha uma versão --</option>
                  {versoes.map((v) => {
                    const m = musicas.find((item) => item.ID === v.ID_Musica);
                    return (
                      <option key={v.ID} value={v.ID}>
                        {m?.Nome} ({m?.Artista}) - {v.Nome_Versao} [Tom {v.Tom}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Ministro / Dirigente do Louvor
                </label>
                <input
                  type="text"
                  value={dirigenteToAdd}
                  onChange={(e) => setDirigenteToAdd(e.target.value)}
                  placeholder="ex: Davi Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Observações para este Culto
                </label>
                <input
                  type="text"
                  value={obsToAdd}
                  onChange={(e) => setObsToAdd(e.target.value)}
                  placeholder="ex: Iniciar em tom menor suave"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
