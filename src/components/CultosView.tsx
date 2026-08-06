import React, { useState, useMemo } from 'react';
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
  Edit,
  Search,
  List,
  LayoutGrid,
  X,
  FileText,
  ExternalLink
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
  onSelectSong?: (musica: Musica) => void;
  onNavigate?: (tab: string) => void;
}

export const CultosView: React.FC<CultosViewProps> = ({
  cultos,
  repertorio,
  versoes,
  musicas,
  onOpenStageMode,
  onOpenNewCultoModal,
  onDataChanged,
  onSelectSong,
  onNavigate
}) => {
  const [selectedCultoId, setSelectedCultoId] = useState<string>(
    cultos.length > 0 ? cultos[0].ID : ''
  );

  // View mode: 'detail' (focused repertoire of single culto) or 'list' (grid of all cultos)
  const [viewMode, setViewMode] = useState<'detail' | 'list'>('detail');

  // Single clean search input (searches name, date, notes)
  const [searchQuery, setSearchQuery] = useState('');

  // Add song to setlist modal state
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectedVersaoIdToAdd, setSelectedVersaoIdToAdd] = useState('');
  const [dirigenteToAdd, setDirigenteToAdd] = useState('');
  const [obsToAdd, setObsToAdd] = useState('');

  // Edit culto modal state
  const [showEditCultoModal, setShowEditCultoModal] = useState(false);
  const [editCultoName, setEditCultoName] = useState('');
  const [editCultoData, setEditCultoData] = useState('');
  const [editCultoStatus, setEditCultoStatus] = useState<'Confirmado' | 'Planejamento' | 'Concluído'>('Confirmado');
  const [editCultoObs, setEditCultoObs] = useState('');

  // Helper to format date into rich display parts
  const parseCultoDate = (isoStr?: string) => {
    if (!isoStr) {
      return {
        shortBadge: 'Sem Data',
        time: '--:--',
        fullTitle: 'Data não informada',
        day: '--',
        month: '---',
        dayOfWeek: '---'
      };
    }

    try {
      const dateObj = new Date(isoStr);
      if (isNaN(dateObj.getTime())) {
        return {
          shortBadge: isoStr,
          time: '',
          fullTitle: isoStr,
          day: '--',
          month: '---',
          dayOfWeek: '---'
        };
      }

      const dayOfWeekShort = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
      const day = dateObj.toLocaleDateString('pt-BR', { day: '2-digit' });
      const monthShort = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
      const monthLong = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
      const year = dateObj.getFullYear();
      const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const weekDayFull = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const capitalizedWeekDay = weekDayFull.charAt(0).toUpperCase() + weekDayFull.slice(1);

      return {
        shortBadge: `${dayOfWeekShort} ${day}/${monthShort}`,
        time,
        fullTitle: `${capitalizedWeekDay}, ${day} de ${monthLong} às ${time}`,
        day,
        month: monthShort,
        year,
        dayOfWeek: dayOfWeekShort
      };
    } catch {
      return {
        shortBadge: isoStr,
        time: '',
        fullTitle: isoStr,
        day: '--',
        month: '---',
        dayOfWeek: '---'
      };
    }
  };

  // Filter cultos based on search query
  const filteredCultos = useMemo(() => {
    if (!searchQuery.trim()) return cultos;
    const q = searchQuery.toLowerCase();
    return cultos.filter((c) => {
      const nameMatch = c.Nome_Evento.toLowerCase().includes(q);
      const obsMatch = c.Observacoes ? c.Observacoes.toLowerCase().includes(q) : false;
      const dateMatch = c.Data ? c.Data.toLowerCase().includes(q) : false;
      
      // Also format date to search by day/month names (ex: "domingo", "agosto", "10/08")
      const parsed = parseCultoDate(c.Data);
      const parsedMatch = 
        parsed.fullTitle.toLowerCase().includes(q) || 
        parsed.shortBadge.toLowerCase().includes(q) ||
        parsed.time.includes(q);

      return nameMatch || obsMatch || dateMatch || parsedMatch;
    });
  }, [cultos, searchQuery]);

  // Active selected Culto
  const currentCulto = cultos.find((c) => c.ID === selectedCultoId) || filteredCultos[0] || cultos[0];

  const currentSetlist = currentCulto
    ? repertorio
        .filter((r) => r.ID_Culto === currentCulto.ID)
        .sort((a, b) => a.Ordem - b.Ordem)
    : [];

  const handleOpenEditModal = (culto: Culto) => {
    setEditCultoName(culto.Nome_Evento);
    setEditCultoData(culto.Data || '');
    setEditCultoStatus(culto.Status || 'Confirmado');
    setEditCultoObs(culto.Observacoes || '');
    setShowEditCultoModal(true);
  };

  const handleSaveEditCulto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCulto || !editCultoName.trim()) return;

    storage.updateCulto(currentCulto.ID, {
      Nome_Evento: editCultoName.trim(),
      Data: editCultoData,
      Status: editCultoStatus,
      Observacoes: editCultoObs.trim()
    });

    setShowEditCultoModal(false);
    onDataChanged();
  };

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

  return (
    <div className="space-y-4 pb-28">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF4D00]" />
            Escala & Agenda de Cultos
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {cultos.length} cultos agendados • Seleção rápida e controle de louvor
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle (Repertório Detalhado vs Quadradinhos/Lista Completa) */}
          <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'detail'
                  ? 'bg-[#FF4D00] text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[#FF4D00] text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="add-culto-button"
            onClick={onOpenNewCultoModal}
            className="py-2.5 px-3.5 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Culto</span>
          </button>
        </div>
      </div>

      {/* Clean Single Search Field */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por data, dia da semana ou nome do culto (ex: 10/08, Domingo, Celebração)..."
          className="w-full bg-[#121212] border border-slate-800 rounded-xl pl-10 pr-8 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Tabs Bar with PROMINENT DATES (No Scrollbar) */}
      {filteredCultos.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {filteredCultos.map((culto) => {
            const isSelected = currentCulto && currentCulto.ID === culto.ID;
            const dateInfo = parseCultoDate(culto.Data);
            const songCount = repertorio.filter((r) => r.ID_Culto === culto.ID).length;

            return (
              <button
                key={culto.ID}
                onClick={() => {
                  setSelectedCultoId(culto.ID);
                  setViewMode('detail');
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border text-left shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-[#FF4D00] text-slate-950 border-[#FF4D00] shadow-lg ring-2 ring-[#FF4D00]/30 font-black'
                    : 'bg-[#121212] text-slate-300 border-slate-800/80 hover:border-slate-700 hover:text-white'
                }`}
              >
                {/* Large Date Badge Header */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-black tracking-wide uppercase flex items-center gap-1 ${
                      isSelected ? 'text-slate-950' : 'text-[#FF4D00]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {dateInfo.shortBadge} • {dateInfo.time}
                  </span>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-[#080808] text-slate-400 border border-slate-800'
                    }`}
                  >
                    {songCount}m
                  </span>
                </div>

                {/* Culto Title */}
                <div
                  className={`text-xs mt-1 truncate max-w-[170px] ${
                    isSelected ? 'font-black text-slate-950' : 'font-medium text-slate-300'
                  }`}
                >
                  {culto.Nome_Evento}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 1: REPERTOIRE DETAIL VIEW FOR SELECTED CULTO */}
      {viewMode === 'detail' && currentCulto && (
        <div className="space-y-4">
          {/* Culto Banner with HIGH VISIBILITY DATE & TIME */}
          {(() => {
            const dateInfo = parseCultoDate(currentCulto.Data);
            return (
              <div className="bg-[#121212] border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                {/* Top Date Highlight Banner */}
                <div className="bg-[#181818] border border-[#FF4D00]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Calendar Square Badge */}
                    <div className="bg-[#FF4D00] text-slate-950 font-black px-3.5 py-2 rounded-2xl text-center shrink-0 shadow-lg">
                      <span className="text-[10px] uppercase tracking-wider block font-black opacity-90">
                        {dateInfo.dayOfWeek}
                      </span>
                      <span className="text-2xl leading-none font-black block">
                        {dateInfo.day}
                      </span>
                      <span className="text-[10px] uppercase font-bold block">
                        {dateInfo.month}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FF4D00]" />
                        <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                          {dateInfo.fullTitle}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-[#FF4D00] tracking-tight mt-0.5">
                        {currentCulto.Nome_Evento}
                      </h3>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                        currentCulto.Status === 'Confirmado'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                          : currentCulto.Status === 'Concluído'
                          ? 'bg-slate-900 text-slate-400 border-slate-700'
                          : 'bg-orange-950/60 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {currentCulto.Status || 'Confirmado'}
                    </span>

                    <button
                      id="stage-mode-service-button"
                      onClick={() => onOpenStageMode(currentCulto)}
                      className="py-2.5 px-3.5 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Modo Palco</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(currentCulto)}
                      className="p-2.5 rounded-xl text-slate-300 bg-[#181818] hover:text-[#FF4D00] hover:bg-[#202020] border border-slate-700 transition-colors"
                      title="Editar Culto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja mesmo excluir o culto "${currentCulto.Nome_Evento}"?`)) {
                          storage.deleteCulto(currentCulto.ID);
                          onDataChanged();
                        }
                      }}
                      className="p-2.5 rounded-xl text-slate-400 bg-[#181818] hover:text-red-400 hover:bg-red-950/40 border border-slate-700 transition-colors"
                      title="Excluir Culto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {currentCulto.Observacoes && (
                  <p className="text-xs text-slate-300 bg-[#080808] p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                    <span className="font-bold text-[#FF4D00] block text-[10px] uppercase mb-0.5">
                      Observações para o Louvor:
                    </span>
                    {currentCulto.Observacoes}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Setlist Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-[#FF4D00]" />
              Repertório ({currentSetlist.length} Músicas)
            </h3>

            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('biblioteca')}
                  className="py-1.5 px-3 rounded-xl bg-[#080808] hover:bg-[#181818] text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 border border-slate-800 transition-all"
                  title="Ir para Biblioteca de Músicas"
                >
                  <Music2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Biblioteca</span>
                </button>
              )}

              <button
                id="add-song-to-setlist-button"
                onClick={() => setShowAddSongModal(true)}
                className="py-1.5 px-3 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] hover:bg-[#FF4D00]/20 text-xs font-bold flex items-center gap-1 border border-[#FF4D00]/30 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Música</span>
              </button>
            </div>
          </div>

          {/* Setlist Items */}
          {currentSetlist.length === 0 ? (
            <div className="text-center py-10 bg-[#121212] rounded-2xl border border-slate-800/80 p-4 space-y-3">
              <Music2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Nenhuma música no repertório deste culto.
              </p>
              <button
                onClick={() => setShowAddSongModal(true)}
                className="py-2 px-3.5 rounded-xl bg-[#FF4D00] text-slate-950 font-bold text-xs inline-flex items-center gap-1"
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
                    className="bg-[#121212] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm transition-all"
                  >
                    <div
                      onClick={() => musica && onSelectSong?.(musica)}
                      className={`flex items-center gap-3 min-w-0 flex-1 ${musica ? 'cursor-pointer group' : ''}`}
                      title={musica ? 'Clique para abrir detalhes, cifra e observações' : ''}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#FF4D00]/10 text-[#FF4D00] font-black text-xs flex items-center justify-center shrink-0 border border-[#FF4D00]/20 group-hover:scale-105 transition-transform">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D00] transition-colors flex items-center gap-1">
                            <span>{musica?.Nome || 'Música'}</span>
                            {musica && (
                              <ExternalLink className="w-3 h-3 text-[#FF4D00] opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </h4>
                          {versao && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#080808] text-[#FF4D00] border border-slate-800">
                              Tom {versao.Tom}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate">
                          {musica?.Artista} • {versao?.Nome_Versao}
                        </p>

                        {rep.Dirigente && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-[#FF4D00]" />
                            Ministro: {rep.Dirigente}
                          </span>
                        )}

                        {rep.Observacao_Culto && (
                          <span className="text-[10px] text-[#FF4D00] italic block mt-0.5">
                            Obs: {rep.Observacao_Culto}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reorder, Details and Delete Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      {musica && (
                        <button
                          onClick={() => onSelectSong?.(musica)}
                          className="p-1.5 rounded-lg bg-[#080808] hover:bg-[#FF4D00]/20 text-slate-300 hover:text-[#FF4D00] border border-slate-800 transition-colors flex items-center gap-1"
                          title="Ver Cifra e Detalhes da Música"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#FF4D00]" />
                          <span className="hidden sm:inline text-[10px] font-bold">Cifra</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-[#080808] text-slate-400 hover:text-white border border-slate-800 disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === currentSetlist.length - 1}
                        className="p-1.5 rounded-lg bg-[#080808] text-slate-400 hover:text-white border border-slate-800 disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveSong(rep.ID)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/50 border border-slate-800"
                        title="Remover do Repertório"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: ALL CULTOS GRID/QUADRADINHOS (Easy for 10-20+ Cultos) */}
      {viewMode === 'list' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Exibindo {filteredCultos.length} cultos agendados:</span>
          </div>

          {filteredCultos.length === 0 ? (
            <div className="text-center py-12 bg-[#121212] rounded-2xl border border-slate-800 p-6 space-y-3">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Nenhum culto encontrado com o termo buscado.</p>
              <button
                onClick={onOpenNewCultoModal}
                className="py-2 px-3.5 rounded-xl bg-[#FF4D00] text-slate-950 font-bold text-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Culto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCultos.map((culto) => {
                const songsCount = repertorio.filter((r) => r.ID_Culto === culto.ID).length;
                const isSelected = currentCulto && currentCulto.ID === culto.ID;
                const dateInfo = parseCultoDate(culto.Data);

                return (
                  <div
                    key={culto.ID}
                    className={`bg-[#121212] border rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between space-y-3 ${
                      isSelected ? 'border-[#FF4D00] ring-1 ring-[#FF4D00]' : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Prominent Date Banner Header inside Card */}
                      <div className="bg-[#181818] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#FF4D00] text-slate-950 font-black px-2 py-0.5 rounded-lg text-xs">
                            {dateInfo.dayOfWeek} {dateInfo.day}/{dateInfo.month}
                          </div>
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#FF4D00]" />
                            {dateInfo.time}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            culto.Status === 'Confirmado'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                              : culto.Status === 'Concluído'
                              ? 'bg-slate-900 text-slate-400 border-slate-700'
                              : 'bg-orange-950/60 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          {culto.Status || 'Confirmado'}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-white leading-snug">
                        {culto.Nome_Evento}
                      </h4>

                      <div className="text-xs text-[#FF4D00] font-bold mt-1">
                        {dateInfo.fullTitle}
                      </div>

                      {culto.Observacoes && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 bg-[#080808] p-2 rounded-lg border border-slate-800/80">
                          {culto.Observacoes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => {
                          setSelectedCultoId(culto.ID);
                          setViewMode('detail');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-[#181818] hover:bg-[#222] text-white font-bold text-xs flex items-center gap-1 border border-slate-700"
                      >
                        <Music2 className="w-3.5 h-3.5 text-[#FF4D00]" />
                        <span>Ver Repertório ({songsCount})</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenStageMode(culto)}
                          className="py-1.5 px-3 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs flex items-center gap-1 shadow"
                        >
                          <Play className="w-3 h-3 fill-slate-950" />
                          <span>Palco</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(culto)}
                          className="p-1.5 rounded-xl bg-[#181818] text-slate-300 hover:text-[#FF4D00] border border-slate-700"
                          title="Editar Culto"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja mesmo excluir o culto "${culto.Nome_Evento}"?`)) {
                              storage.deleteCulto(culto.ID);
                              onDataChanged();
                            }
                          }}
                          className="p-1.5 rounded-xl bg-[#181818] text-slate-400 hover:text-red-400 border border-slate-700"
                          title="Excluir Culto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT CULTO MODAL */}
      {showEditCultoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#FF4D00]" />
                Editar Culto / Evento
              </h3>
              <button
                onClick={() => setShowEditCultoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCulto} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Evento / Culto *
                </label>
                <input
                  type="text"
                  value={editCultoName}
                  onChange={(e) => setEditCultoName(e.target.value)}
                  placeholder="ex: Culto de Domingo - Celebração"
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Data e Hora do Evento
                </label>
                <input
                  type="datetime-local"
                  value={editCultoData}
                  onChange={(e) => setEditCultoData(e.target.value)}
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={editCultoStatus}
                  onChange={(e) => setEditCultoStatus(e.target.value as any)}
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                >
                  <option value="Confirmado">Confirmado</option>
                  <option value="Planejamento">Planejamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Observações
                </label>
                <textarea
                  value={editCultoObs}
                  onChange={(e) => setEditCultoObs(e.target.value)}
                  placeholder="Instruções para os músicos, dirigente, observações..."
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white h-20 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditCultoModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SONG TO SETLIST MODAL */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Adicionar Música ao Repertório
              </h3>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSongToSetlist} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Selecione a Versão da Música *
                </label>
                <select
                  value={selectedVersaoIdToAdd}
                  onChange={(e) => setSelectedVersaoIdToAdd(e.target.value)}
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
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
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
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
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs shadow-md"
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
