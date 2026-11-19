import React, { useState, useMemo } from 'react';
import { Search, Plus, Music2, Filter, Layers, FileText, ChevronRight } from 'lucide-react';
import { Musica, Versao, Arquivo, Nota } from '../types';
import { formatKeyDisplay } from '../utils/chordTransposer';
import { matchMusica, sortMusicasAZ } from '../utils/songSearch';

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
  onSelectSong,
  onOpenNewSongModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedKey, setSelectedKey] = useState<string>('Todos');

  const categories = ['Todas', 'Adoração', 'Celebração', 'Oferta', 'Ceia', 'Avulsa'];
  const availableKeys = ['Todos', 'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Filter songs based on search, category, and key
  // Cada item traz o trecho da letra quando o termo só foi achado nela.
  const filteredMusicas = useMemo(() => {
    const trechos = new Map<string, string>();
    const lista = sortMusicasAZ(musicas).filter((musica) => {
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
      const m = matchMusica(musica, songVersoes, searchQuery);
      if (!m) return false;
      if (m.trecho) trechos.set(musica.ID, m.trecho);
      return true;
    });
    return { lista, trechos };
  }, [musicas, versoes, searchQuery, selectedCategory, selectedKey]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-fg tracking-tight flex items-center gap-2">
            <Music2 className="w-5 h-5 text-brand-ink" />
            Biblioteca de Músicas
          </h2>
          <p className="text-xs text-fg-muted">
            {musicas.length} músicas e {versoes.length} versões no acervo
          </p>
        </div>

        <button
          id="add-song-library-button"
          onClick={onOpenNewSongModal}
          className="py-2.5 px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar</span>
        </button>
      </div>

      {/* Robust Search Field */}
      <div className="relative">
        <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          id="library-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por nome, artista, tom ou trecho da letra..."
          className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-3 text-xs text-fg placeholder-fg-subtle focus:outline-none focus:border-brand transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-fg-subtle hover:text-fg text-xs font-bold"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Filter Tabs (Categories) & Active Reset */}
      <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const count = cat === 'Todas' 
              ? musicas.length 
              : musicas.filter(m => m.Categoria === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-brand text-slate-950 shadow-sm font-black'
                    : 'bg-surface text-fg-muted border border-line hover:text-fg'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === cat ? 'bg-white/30 text-slate-950' : 'bg-inset-2 text-fg-muted'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {(selectedCategory !== 'Todas' || selectedKey !== 'Todos' || searchQuery.trim()) && (
          <button
            onClick={() => {
              setSelectedCategory('Todas');
              setSelectedKey('Todos');
              setSearchQuery('');
            }}
            className="text-[11px] font-bold text-brand-ink hover:underline shrink-0 bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-xl whitespace-nowrap"
          >
            Resetar Filtros
          </button>
        )}
      </div>

      {/* Key Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-t border-line/60 pt-2">
        <span className="text-[10px] uppercase font-bold text-fg-subtle shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-brand-ink" /> Tom:
        </span>
        {availableKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedKey(key)}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedKey === key
                ? 'bg-brand text-slate-950 font-black'
                : 'bg-surface text-fg-muted border border-line hover:text-brand-ink'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Songs List */}
      <div className="space-y-2.5 pt-1">
        {filteredMusicas.lista.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-2xl border border-line/80 p-6 space-y-3">
            <Music2 className="w-10 h-10 text-fg-faint mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-fg">Nenhuma música encontrada</h3>
              <p className="text-xs text-fg-muted">
                Tente mudar o termo de busca ou filtros selecionados.
              </p>
            </div>
            <button
              onClick={onOpenNewSongModal}
              className="py-2.5 px-4 rounded-xl bg-brand text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Música</span>
            </button>
          </div>
        ) : (
          filteredMusicas.lista.map((musica) => {
            const songVersoes = versoes.filter((v) => v.ID_Musica === musica.ID);
            const mainVersao = songVersoes[0];
            const songArquivosCount = songVersoes.reduce((acc, v) => acc + arquivos.filter(a => a.ID_Versao === v.ID).length, 0);

            return (
              <div
                key={musica.ID}
                id={`song-card-${musica.ID}`}
                onClick={() => onSelectSong(musica)}
                className="bg-surface hover:bg-surface-hover border border-line/80 rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 group shadow-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-chip text-fg-soft border border-line-strong/80">
                      {musica.Categoria}
                    </span>
                    {mainVersao && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Tom {formatKeyDisplay(mainVersao.Tom, mainVersao.Modo)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-fg group-hover:text-brand-ink transition-colors truncate">
                    {musica.Nome}
                  </h3>
                  <p className="text-xs text-fg-muted truncate font-medium">
                    {musica.Artista}
                  </p>
                  {filteredMusicas.trechos.get(musica.ID) && (
                    <p className="text-[11px] text-brand-ink/90 italic truncate mt-0.5">
                      Na letra: {filteredMusicas.trechos.get(musica.ID)}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-fg-subtle mt-2">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-fg-muted" />
                      {songVersoes.length} {songVersoes.length === 1 ? 'versão' : 'versões'}
                    </span>
                    {songArquivosCount > 0 && (
                      <span className="flex items-center gap-1 text-fg-muted">
                        <FileText className="w-3 h-3" />
                        {songArquivosCount} anexo(s)
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-fg-subtle group-hover:text-brand-ink transition-colors shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
