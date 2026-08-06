import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  Zap
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
      window.scrollTo({ top: 0 });
    }
  };

  const handlePrevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSemitones(0);
      setIsAutoScrolling(false);
      window.scrollTo({ top: 0 });
    }
  };

  if (!currentRep || !currentVersao || !currentMusica) {
    return (
      <div className="fixed inset-0 z-50 bg-[#080808] flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-400">Nenhuma música no repertório para o Modo Palco.</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[#FF4D00] text-slate-950 font-bold text-xs">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#080808] text-white flex flex-col font-sans overflow-hidden">
      {/* Top Fixed Controls Bar */}
      <div className="bg-[#121212] border-b border-slate-800/80 px-3 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
        {/* Setlist Stepper */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevSong}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#FF4D00]" />
          </button>

          <div>
            <span className="text-[10px] font-black text-[#FF4D00] uppercase tracking-wider block">
              {currentIndex + 1} DE {setlist.length}
            </span>
            <h2 className="text-sm font-extrabold text-white leading-tight truncate max-w-[130px] sm:max-w-xs">
              {currentMusica.Nome}
            </h2>
          </div>

          <button
            onClick={handleNextSong}
            disabled={currentIndex === setlist.length - 1}
            className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[#FF4D00]" />
          </button>
        </div>

        {/* Transposer & Tools */}
        <div className="flex items-center gap-1.5">
          {/* Key Box */}
          <div className="bg-[#080808] border border-slate-800 px-2 py-0.5 rounded-lg text-center">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Tom</span>
            <span className="text-xs font-black text-[#FF4D00]">{currentKeyDisplay}</span>
          </div>

          <button
            onClick={() => setSemitones(s => s - 1)}
            className="p-2 rounded-xl bg-[#1a1a1a] text-[#FF4D00] hover:bg-[#252525] transition-colors"
            title="Baixar 1 Tom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSemitones(s => s + 1)}
            className="p-2 rounded-xl bg-[#1a1a1a] text-[#FF4D00] hover:bg-[#252525] transition-colors"
            title="Subir 1 Tom"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-xl border transition-colors ${
              showNotes
                ? 'bg-[#FF4D00] text-slate-950 border-[#FF4D00] font-bold'
                : 'bg-[#1a1a1a] text-slate-300 border-slate-800'
            }`}
            title="Ver Observações"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1a1a1a] hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Full-Width Reader */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-3">
        {/* Header Info Banner */}
        <div className="bg-[#121212] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block font-medium">{currentMusica.Artista}</span>
            {currentRep.Dirigente && (
              <span className="text-[#FF4D00] font-bold block">
                Ministro: {currentRep.Dirigente}
              </span>
            )}
          </div>
          {currentVersao.Estrutura && (
            <div className="text-[10px] text-slate-300 font-mono bg-[#080808] px-2.5 py-1 rounded-lg border border-slate-800">
              {currentVersao.Estrutura}
            </div>
          )}
        </div>

        {/* Instrument Notes Box */}
        {showNotes && (
          <div className="bg-[#121212] border border-[#FF4D00]/40 rounded-xl p-3 space-y-1.5 animate-in fade-in">
            <span className="text-xs font-black text-[#FF4D00] uppercase tracking-wider block">
              Observações do Arranjo
            </span>
            {currentNotas.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhuma observação cadastrada.</p>
            ) : (
              currentNotas.map((n) => (
                <div key={n.ID} className="text-xs text-slate-200">
                  <strong className="text-[#FF4D00]">[{n.Instrumento}]</strong>: {n.Observacao}
                </div>
              ))
            )}
          </div>
        )}

        {/* 100% Width Cifra & Letra Display */}
        <div className="w-full bg-[#080808] border border-slate-800/60 rounded-2xl p-4 sm:p-5 font-mono text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-wrap select-text shadow-inner">
          {transposeTextChords(currentVersao.Letra, semitones)}
        </div>
      </div>

      {/* Bottom Floating Bar: Auto-Scroll */}
      <div className="bg-[#121212] border-t border-slate-800/80 p-3 flex items-center justify-between sticky bottom-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              isAutoScrolling
                ? 'bg-[#FF4D00] text-slate-950 shadow-lg shadow-[#FF4D00]/20'
                : 'bg-[#1a1a1a] text-slate-300 border border-slate-700'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isAutoScrolling ? 'Pausar Rolagem' : 'Auto-Scroll'}</span>
          </button>

          {isAutoScrolling && (
            <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-xl border border-slate-800 text-xs font-black">
              <button onClick={() => setScrollSpeed(1)} className={`px-2 py-0.5 rounded-lg ${scrollSpeed === 1 ? 'bg-[#FF4D00] text-slate-950' : 'text-slate-400'}`}>1x</button>
              <button onClick={() => setScrollSpeed(2)} className={`px-2 py-0.5 rounded-lg ${scrollSpeed === 2 ? 'bg-[#FF4D00] text-slate-950' : 'text-slate-400'}`}>2x</button>
              <button onClick={() => setScrollSpeed(3)} className={`px-2 py-0.5 rounded-lg ${scrollSpeed === 3 ? 'bg-[#FF4D00] text-slate-950' : 'text-slate-400'}`}>3x</button>
            </div>
          )}
        </div>

        <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span>{currentIndex + 1} / {setlist.length}</span>
        </div>
      </div>
    </div>
  );
};
