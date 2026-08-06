import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Music2,
  Tag
} from 'lucide-react';
import { Culto, RepertorioItem, Versao, Musica, Nota } from '../types';
import { transposeTextChords, getNextKey } from '../utils/chordTransposer';

interface StageModeModalProps {
  culto: Culto;
  repertorio: RepertorioItem[];
  versoes: Versao[];
  musicas: Musica[];
  notas: Nota[];
  onClose: () => void;
}

export const StageModeModal: React.FC<StageModeModalProps> = ({
  culto,
  repertorio,
  versoes,
  musicas,
  notas,
  onClose
}) => {
  const setlist = repertorio
    .filter((r) => r.ID_Culto === culto.ID)
    .sort((a, b) => a.Ordem - b.Ordem);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [semitones, setSemitones] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showNotes, setShowNotes] = useState(false);

  const currentRep = setlist[currentIndex];
  const currentVersao = currentRep ? versoes.find((v) => v.ID === currentRep.ID_Versao) : undefined;
  const currentMusica = currentVersao ? musicas.find((m) => m.ID === currentVersao.ID_Musica) : undefined;
  const currentNotas = currentVersao ? notas.filter((n) => n.ID_Versao === currentVersao.ID) : [];

  const currentKeyDisplay = currentVersao ? getNextKey(currentVersao.Tom, semitones) : 'C';

  // Auto-scroll logic
  useEffect(() => {
    let interval: any;
    if (isAutoScrolling) {
      interval = setInterval(() => {
        window.scrollBy({ top: scrollSpeed, behavior: 'smooth' });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  const handleNextSong = () => {
    if (currentIndex < setlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSemitones(0);
      setIsAutoScrolling(false);
    }
  };

  const handlePrevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSemitones(0);
      setIsAutoScrolling(false);
    }
  };

  if (!currentRep || !currentVersao || !currentMusica) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-400">Nenhuma música no repertório para o Modo Palco.</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevSong}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-amber-400" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Música {currentIndex + 1} de {setlist.length}
            </span>
            <h2 className="text-sm font-extrabold text-white leading-none truncate max-w-[160px] sm:max-w-xs">
              {currentMusica.Nome}
            </h2>
          </div>
          <button
            onClick={handleNextSong}
            disabled={currentIndex === setlist.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-amber-400" />
          </button>
        </div>

        {/* Key Transposer & Controls */}
        <div className="flex items-center gap-2">
          {/* Key Display */}
          <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-center">
            <span className="text-[9px] text-slate-500 uppercase block font-bold">Tom</span>
            <span className="text-xs font-black text-amber-400">{currentKeyDisplay}</span>
          </div>

          <button
            onClick={() => setSemitones(s => s - 1)}
            className="p-1.5 rounded-lg bg-slate-800 text-amber-400 font-bold text-xs"
            title="-1 Tom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSemitones(s => s + 1)}
            className="p-1.5 rounded-lg bg-slate-800 text-amber-400 font-bold text-xs"
            title="+1 Tom"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showNotes
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Notas Instrumentos"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Reader */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Song Header Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">{currentMusica.Artista}</span>
            {currentRep.Dirigente && (
              <p className="text-xs text-amber-300 font-semibold">
                Ministro: {currentRep.Dirigente}
              </p>
            )}
          </div>
          {currentVersao.Estrutura && (
            <div className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {currentVersao.Estrutura}
            </div>
          )}
        </div>

        {/* Instrument Notes Box */}
        {showNotes && (
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Notas para Instrumentos
            </span>
            {currentNotas.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhuma nota cadastrada.</p>
            ) : (
              currentNotas.map((n) => (
                <div key={n.ID} className="text-xs text-slate-200">
                  <strong className="text-amber-300">[{n.Instrumento}]</strong>: {n.Observacao}
                </div>
              ))
            )}
          </div>
        )}

        {/* Chords & Lyrics Reader */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-sm sm:text-base text-slate-100 leading-loose whitespace-pre-wrap select-text shadow-inner">
          {transposeTextChords(currentVersao.Letra, semitones)}
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between sticky bottom-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              isAutoScrolling
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isAutoScrolling ? 'Pausar Scroll' : 'Auto Scroll'}</span>
          </button>

          {isAutoScrolling && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold">
              <button onClick={() => setScrollSpeed(1)} className={`px-2 py-0.5 rounded ${scrollSpeed === 1 ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>1x</button>
              <button onClick={() => setScrollSpeed(2)} className={`px-2 py-0.5 rounded ${scrollSpeed === 2 ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>2x</button>
              <button onClick={() => setScrollSpeed(3)} className={`px-2 py-0.5 rounded ${scrollSpeed === 3 ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>3x</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>Setlist ({currentIndex + 1}/{setlist.length})</span>
        </div>
      </div>
    </div>
  );
};
