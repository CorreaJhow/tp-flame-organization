import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  LogOut,
  Type,
  Music2,
  FileText,
  Minus,
  Plus,
  FastForward,
  RotateCcw
} from 'lucide-react';
import { Culto, RepertorioItem, Versao, Musica, Nota } from '../types';
import { getNextKey } from '../utils/chordTransposer';
import { ChordViewer } from './ChordViewer';

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
  const [displayMode, setDisplayMode] = useState<'cifra' | 'letra'>('cifra');
  const [fontSizeStep, setFontSizeStep] = useState(0); // -1, 0, 1, 2, 3

  // Auto-scroll State & Speed
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 0.5, 1, 1.5, 2, 3, 4
  const [showNotes, setShowNotes] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentRep = setlist[currentIndex];
  const currentVersao = currentRep ? versoes.find((v) => v.ID === currentRep.ID_Versao) : undefined;
  const currentMusica = currentVersao ? musicas.find((m) => m.ID === currentVersao.ID_Musica) : undefined;
  const currentNotas = currentVersao ? notas.filter((n) => n.ID_Versao === currentVersao.ID) : [];

  const currentKeyDisplay = currentVersao ? getNextKey(currentVersao.Tom, semitones) : 'C';

  // Smooth Auto-scroll logic with requestAnimationFrame for absolute fluidity
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const scrollLoop = (time: number) => {
      if (isAutoScrolling && scrollContainerRef.current) {
        const delta = (time - lastTime) / 1000;
        // Base velocity: 30 pixels per second at 1x
        const pixelsToScroll = scrollSpeed * 30 * delta;
        scrollContainerRef.current.scrollTop += pixelsToScroll;
      }
      lastTime = time;
      if (isAutoScrolling) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    if (isAutoScrolling) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(scrollLoop);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Keyboard shortcuts support for Stage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        handleNextSong();
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        handlePrevSong();
      } else if (e.key === 'l' || e.key === 'L') {
        setDisplayMode((prev) => (prev === 'cifra' ? 'letra' : 'cifra'));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, setlist.length]);

  const handleNextSong = () => {
    if (currentIndex < setlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSemitones(0);
      setIsAutoScrolling(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handlePrevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSemitones(0);
      setIsAutoScrolling(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
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
      <div className="bg-[#121212] border-b border-slate-800 px-3 py-2 sticky top-0 z-40 shadow-2xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Setlist Stepper */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={handlePrevSong}
              disabled={currentIndex === 0}
              className="p-2 sm:p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-20 transition-colors shrink-0"
              title="Música Anterior (Seta Esquerda)"
            >
              <ChevronLeft className="w-5 h-5 text-[#FF4D00]" />
            </button>

            <div className="min-w-0">
              <span className="text-[10px] font-black text-[#FF4D00] uppercase tracking-wider block">
                {currentIndex + 1} DE {setlist.length}
              </span>
              <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">
                {currentMusica.Nome}
              </h2>
            </div>

            <button
              onClick={handleNextSong}
              disabled={currentIndex === setlist.length - 1}
              className="p-2 sm:p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-20 transition-colors shrink-0"
              title="Próxima Música (Seta Direita)"
            >
              <ChevronRight className="w-5 h-5 text-[#FF4D00]" />
            </button>
          </div>

          {/* Mode Switcher & Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Display Mode Toggle (Cifra / Letra) */}
            <div className="bg-[#080808] p-1 border border-slate-800 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setDisplayMode('cifra')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  displayMode === 'cifra'
                    ? 'bg-[#FF4D00] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Cifra (para Instrumentistas)"
              >
                <Music2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cifra</span>
              </button>
              <button
                onClick={() => setDisplayMode('letra')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  displayMode === 'letra'
                    ? 'bg-[#FF4D00] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Letra (para Vocais - Fonte Grande)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Letra</span>
              </button>
            </div>

            {/* Font Sizing Controls (A- / A+) */}
            <div className="bg-[#080808] p-1 border border-slate-800 rounded-xl flex items-center gap-0.5">
              <button
                onClick={() => setFontSizeStep((s) => Math.max(-1, s - 1))}
                disabled={fontSizeStep <= -1}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                title="Diminuir Fonte"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold text-slate-300 px-1">A</span>
              <button
                onClick={() => setFontSizeStep((s) => Math.min(3, s + 1))}
                disabled={fontSizeStep >= 3}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                title="Aumentar Fonte"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Transposer (Only in Cifra mode or when applicable) */}
            {displayMode === 'cifra' && (
              <div className="flex items-center gap-1 bg-[#080808] border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setSemitones((s) => s - 1)}
                  className="p-1 rounded text-[#FF4D00] hover:bg-[#1a1a1a]"
                  title="Baixar 1 Tom"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-[#FF4D00] px-1">{currentKeyDisplay}</span>
                <button
                  onClick={() => setSemitones((s) => s + 1)}
                  className="p-1 rounded text-[#FF4D00] hover:bg-[#1a1a1a]"
                  title="Subir 1 Tom"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-xl border transition-colors ${
                showNotes
                  ? 'bg-[#FF4D00] text-slate-950 border-[#FF4D00] font-bold'
                  : 'bg-[#1a1a1a] text-slate-300 border-slate-800'
              }`}
              title="Ver Observações de Arranjo"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* High Visibility Close Button */}
            <button
              id="exit-stage-mode-top-button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-lg active:scale-95 transition-all border border-red-400/30"
              title="Sair do Modo Palco (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Width Reader with Ref for Smooth Scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 space-y-4 scroll-smooth"
      >
        {/* Header Info Banner */}
        <div className="bg-[#121212] border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-md">
          <div>
            <span className="text-slate-400 block font-medium">{currentMusica.Artista}</span>
            {currentRep.Dirigente && (
              <span className="text-[#FF4D00] font-bold block mt-0.5">
                Ministro: {currentRep.Dirigente}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#080808] border border-slate-800 px-2.5 py-1 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Tom</span>
              <span className="text-xs font-black text-[#FF4D00]">{currentKeyDisplay}</span>
            </div>

            {currentVersao.Estrutura && (
              <div className="text-[10px] text-slate-300 font-mono bg-[#080808] px-2.5 py-1 rounded-xl border border-slate-800">
                {currentVersao.Estrutura}
              </div>
            )}
          </div>
        </div>

        {/* Instrument Notes Box */}
        {showNotes && (
          <div className="bg-[#121212] border border-[#FF4D00]/40 rounded-2xl p-4 space-y-2 animate-in fade-in">
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

        {/* 100% Width Formatted Cifra & Letra Display */}
        <div className="w-full bg-[#080808] border border-slate-800/80 rounded-3xl p-4 sm:p-8 shadow-inner">
          <ChordViewer 
            text={currentVersao.Letra} 
            semitones={semitones} 
            displayMode={displayMode}
            fontSizeStep={fontSizeStep}
          />
        </div>
      </div>

      {/* Bottom Floating Bar: Auto-Scroll Speed Controls & Quick Toggles */}
      <div className="bg-[#121212] border-t border-slate-800/80 p-3 flex flex-wrap items-center justify-between gap-2 sticky bottom-0 z-40">
        <div className="flex items-center gap-2">
          {/* Play/Pause Auto-Scroll */}
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              isAutoScrolling
                ? 'bg-[#FF4D00] text-slate-950 ring-2 ring-[#FF4D00]/50'
                : 'bg-[#1a1a1a] text-slate-300 border border-slate-700 hover:bg-[#222]'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isAutoScrolling ? 'Pausar Rolagem' : 'Auto-Scroll'}</span>
          </button>

          {/* Speed Selector Presets */}
          <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-xl border border-slate-800 text-xs font-black">
            <span className="text-[10px] text-slate-500 px-1 font-bold">VEL:</span>
            {[0.5, 1, 1.5, 2, 3, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setScrollSpeed(speed)}
                className={`px-2 py-0.5 rounded-lg text-[11px] transition-colors ${
                  scrollSpeed === speed ? 'bg-[#FF4D00] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts Hint & Exit */}
        <div className="flex items-center gap-2">
          <span className="hidden lg:inline-block text-[10px] text-slate-500 font-mono bg-[#080808] px-2 py-1 rounded-lg border border-slate-800">
            Atalhos: <span className="text-slate-300">Espaço</span> (Play/Pause) | <span className="text-slate-300">L</span> (Letra/Cifra) | <span className="text-slate-300">Seta</span> (Músicas)
          </span>

          <button
            id="exit-stage-mode-bottom-button"
            onClick={onClose}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-400 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
};

