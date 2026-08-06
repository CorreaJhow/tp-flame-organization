import React, { useState, useMemo } from 'react';
import { Search, Plus, Music2, Filter, Layers, FileText, ChevronRight } from 'lucide-react';
import { Musica, Versao, Arquivo, Nota } from '../types';

interface LibraryViewProps {
  musicas: Musica[];
  versoes: Versao[];
  arquivos: Arquivo[];
  notas: Nota[];
  onSelectSong: (musica: Musica) => void;
  onOpenNewSongModal: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  musicas,
  versoes,
  arquivos,
  notas,
  onSelectSong,
  onOpenNewSongModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedKey, setSelectedKey] = useState<string>('Todos');

  const categories = ['Todas', 'Adoração', 'Celebração', 'Oferta', 'Ceia', 'Avulsa'];
  const availableKeys = ['Todos', 'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Filter songs based on search, category, and key
  const filteredMusicas = useMemo(() => {
    return musicas.filter((musica) => {
      const songVersoes = versoes.filter((v) => v.ID_Musica === musica.ID);
      
      // Category check
      if (selectedCategory !== 'Todas' && musica.Categoria !== selectedCategory) {
        return false;
      }

      // Key check
      if (selectedKey !== 'Todos') {
        const hasKey = songVersoes.some((v) => v.Tom.toLowerCase() === selectedKey.toLowerCase());
        if (!hasKey) return false;
      }

      // Query check (Search in Name, Artist, Category, or Key in versions)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = musica.Nome.toLowerCase().includes(q);
        const matchesArtist = musica.Artista.toLowerCase().includes(q);
        const matchesCat = musica.Categoria.toLowerCase().includes(q);
        const matchesVersaoTom = songVersoes.some(v => v.Tom.toLowerCase().includes(q) || v.Nome_Versao.toLowerCase().includes(q));

        return matchesName || matchesArtist || matchesCat || matchesVersaoTom;
      }

      return true;
    });
  }, [musicas, versoes, searchQuery, selectedCategory, selectedKey]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Music2 className="w-5 h-5 text-amber-400" />
            Acervo de Músicas
          </h2>
          <p className="text-xs text-slate-400">
            {musicas.length} músicas e {versoes.length} versões cadastradas
          </p>
        </div>

        <button
          id="add-song-library-button"
          onClick={onOpenNewSongModal}
          className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar</span>
        </button>
      </div>

      {/* Robust Search Field */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          id="library-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por Nome, Artista, Categoria ou Tom (ex: Adoração, E)..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Filter Tabs (Categories) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Key Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-t border-slate-800/60 pt-2">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Tom:
        </span>
        {availableKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedKey(key)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedKey === key
                ? 'bg-slate-200 text-slate-950'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-amber-400'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Songs List */}
      <div className="space-y-2.5 pt-1">
        {filteredMusicas.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-6">
            <Music2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">Nenhuma música encontrada</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tente mudar o termo de busca ou filtros selecionados.
            </p>
            <button
              onClick={onOpenNewSongModal}
              className="py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Música</span>
            </button>
          </div>
        ) : (
          filteredMusicas.map((musica) => {
            const songVersoes = versoes.filter((v) => v.ID_Musica === musica.ID);
            const mainVersao = songVersoes[0];
            const songArquivosCount = songVersoes.reduce((acc, v) => acc + arquivos.filter(a => a.ID_Versao === v.ID).length, 0);

            return (
              <div
                key={musica.ID}
                id={`song-card-${musica.ID}`}
                onClick={() => onSelectSong(musica)}
                className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {musica.Categoria}
                    </span>
                    {mainVersao && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Tom {mainVersao.Tom}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {musica.Nome}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {musica.Artista}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {songVersoes.length} {songVersoes.length === 1 ? 'versão' : 'versões'}
                    </span>
                    {songArquivosCount > 0 && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <FileText className="w-3 h-3" />
                        {songArquivosCount} anexo(s)
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
