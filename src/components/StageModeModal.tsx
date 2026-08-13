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
  RotateCcw,
  Activity,
  Volume2,
  VolumeX,
  Clock,
  Mic,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import { Culto, RepertorioItem, Versao, Musica, Nota } from '../types';
import { getNextKey } from '../utils/chordTransposer';
import { ChordViewer } from './ChordViewer';
import { storage } from '../services/storage';
import { getVocalConfig } from '../utils/vocalColors';

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

  // Vocal Annotation & Focus State
  const [focusVoice, setFocusVoice] = useState<string | null>(null);
  const [showVocalHighlights, setShowVocalHighlights] = useState(true);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('oficial');

  // Metronome & Audio Click State
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [isAudioClick, setIsAudioClick] = useState(false); // Audio click disabled by default
  const [customBpm, setCustomBpm] = useState<number>(120);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [isVisualFlash, setIsVisualFlash] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentRep = setlist[currentIndex];
  const currentVersao = currentRep ? versoes.find((v) => v.ID === currentRep.ID_Versao) : undefined;
  const currentMusica = currentVersao ? musicas.find((m) => m.ID === currentVersao.ID_Musica) : undefined;
  const currentNotas = currentVersao ? notas.filter((n) => n.ID_Versao === currentVersao.ID) : [];

  // Registered vocalists
  const availableVocals = React.useMemo(() => {
    const integrantes = storage.getIntegrantes();
    const vocalMembers = integrantes
      .filter((i) => i.Funcao?.toLowerCase().includes('vocal') || i.Funcao?.toLowerCase().includes('ministro'))
      .map((i) => i.Nome.split(' ')[0]);

    const defaultVocals = ['Larissa', 'Bianca', 'Leticia', 'Jhow', 'Todos'];
    return Array.from(new Set([...defaultVocals, ...vocalMembers]));
  }, []);

  // Custom musician chord sheets (Notas that contain multiline text or chords)
  const customChordLayers = React.useMemo(() => {
    return currentNotas.filter((n) => n.Observacao && n.Observacao.length > 20);
  }, [currentNotas]);

  // Determine current active text to display in ChordViewer
  const currentDisplayText = React.useMemo(() => {
    if (!currentVersao) return '';
    if (selectedLayerId !== 'oficial') {
      const selectedNota = currentNotas.find((n) => n.ID === selectedLayerId);
      if (selectedNota) return selectedNota.Observacao;
    }
    return currentVersao.Letra;
  }, [currentVersao, selectedLayerId, currentNotas]);

  const currentKeyDisplay = currentVersao ? getNextKey(currentVersao.Tom, semitones) : 'C';

  // Sync BPM when current version changes
  useEffect(() => {
    if (currentVersao?.BPM) {
      setCustomBpm(currentVersao.BPM);
    } else {
      setCustomBpm(120);
    }
    setCurrentBeat(1);
  }, [currentVersao?.ID]);

  // Determine beats per measure (e.g. 3/4 -> 3 beats, 6/8 -> 6 beats, default 4)
  const beatsPerMeasure = React.useMemo(() => {
    if (!currentVersao?.Compasso) return 4;
    const num = parseInt(String(currentVersao.Compasso).split('/')[0], 10);
    return isNaN(num) || num <= 0 ? 4 : num;
  }, [currentVersao?.Compasso]);

  // Web Audio click generator
  const playClick = (isBeatOne: boolean) => {
    if (!isAudioClick) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // High pitch on beat 1 (1050Hz), lower on rest (800Hz)
        osc.frequency.setValueAtTime(isBeatOne ? 1050 : 800, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (err) {
      // AudioContext failed or blocked by browser policy
    }
  };

  // Metronome Interval Loop
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (isMetronomeActive) {
      const bpmToUse = customBpm > 0 ? customBpm : 120;
      const intervalMs = (60 / bpmToUse) * 1000;

      timerId = setInterval(() => {
        setCurrentBeat((prev) => {
          const nextBeat = prev >= beatsPerMeasure ? 1 : prev + 1;
          const isBeatOne = nextBeat === 1;

          // Flash visual effect
          setIsVisualFlash(true);
          setTimeout(() => setIsVisualFlash(false), 120);

          // Audio click
          playClick(isBeatOne);

          return nextBeat;
        });
      }, intervalMs);
    } else {
      setCurrentBeat(1);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isMetronomeActive, customBpm, beatsPerMeasure, isAudioClick]);

  // Sub-pixel accumulator for smooth fractional auto-scroll (e.g., 0.5x speed)
  const subPixelRef = useRef(0);

  // Smooth Auto-scroll logic with requestAnimationFrame for absolute fluidity
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const scrollLoop = (time: number) => {
      if (isAutoScrolling && scrollContainerRef.current) {
        const delta = (time - lastTime) / 1000;
        // Base velocity: 30 pixels per second at 1x
        const rawPixels = scrollSpeed * 35 * delta + subPixelRef.current;
        const intPixels = Math.floor(rawPixels);
        subPixelRef.current = rawPixels - intPixels;

        if (intPixels > 0) {
          scrollContainerRef.current.scrollTop += intPixels;
        }
      }
      lastTime = time;
      if (isAutoScrolling) {
        animationFrameId = requestAnimationFrame(scrollLoop);
      }
    };

    if (isAutoScrolling) {
      subPixelRef.current = 0;
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
        <div className="bg-[#121212] border border-slate-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
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

            <div className="bg-[#080808] border border-slate-800 px-2.5 py-1 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Tempo</span>
              <span className="text-xs font-black text-slate-200">{customBpm} BPM</span>
            </div>

            {currentVersao.Estrutura && (
              <div className="text-[10px] text-slate-300 font-mono bg-[#080808] px-2.5 py-1 rounded-xl border border-slate-800">
                {currentVersao.Estrutura}
              </div>
            )}
          </div>
        </div>

        {/* Visual Metronome Display Panel */}
        <div className="bg-[#121212] border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMetronomeActive(!isMetronomeActive)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md ${
                isMetronomeActive
                  ? 'bg-[#FF4D00] text-slate-950 ring-2 ring-[#FF4D00]/50'
                  : 'bg-[#080808] text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Metrônomo {isMetronomeActive ? 'ON' : 'OFF'}</span>
            </button>

            {/* Audio Click Sound Toggle */}
            <button
              onClick={() => setIsAudioClick(!isAudioClick)}
              className={`p-1.5 rounded-xl border transition-colors ${
                isAudioClick
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-[#080808] text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title={isAudioClick ? 'Clique Áudio Ativado' : 'Ativar Clique de Áudio (Beep)'}
            >
              {isAudioClick ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Pulsing Visual Beat Dots */}
            <div className="flex items-center gap-1.5 bg-[#080808] px-3 py-1.5 rounded-xl border border-slate-800">
              {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
                const beatNumber = idx + 1;
                const isActiveBeat = isMetronomeActive && currentBeat === beatNumber;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-75 flex items-center justify-center text-[9px] font-black ${
                      isActiveBeat
                        ? beatNumber === 1
                          ? 'bg-[#FF4D00] text-slate-950 scale-125 shadow-lg shadow-[#FF4D00]/50'
                          : 'bg-amber-400 text-slate-950 scale-110'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {beatNumber}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BPM Adjust Controls */}
          <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCustomBpm((b) => Math.max(30, b - 5))}
              className="px-1.5 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Restar 5 BPM"
            >
              -5
            </button>
            <button
              onClick={() => setCustomBpm((b) => Math.max(30, b - 1))}
              className="px-1.5 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Restar 1 BPM"
            >
              -1
            </button>
            <span className="text-xs font-black text-[#FF4D00] px-2">{customBpm} BPM</span>
            <button
              onClick={() => setCustomBpm((b) => Math.min(300, b + 1))}
              className="px-1.5 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Somar 1 BPM"
            >
              +1
            </button>
            <button
              onClick={() => setCustomBpm((b) => Math.min(300, b + 5))}
              className="px-1.5 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              title="Somar 5 BPM"
            >
              +5
            </button>
          </div>
        </div>

        {/* Vocal Division & Voice Focus Mode Bar */}
        <div className="bg-[#121212] border border-slate-800/80 rounded-2xl p-3 space-y-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVocalHighlights(!showVocalHighlights)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  showVocalHighlights
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40'
                    : 'bg-[#080808] text-slate-500 border border-slate-800'
                }`}
                title="Ativar/Desativar Destaques de Vozes"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Vozes: {showVocalHighlights ? 'ATIVAS' : 'OCULTAS'}</span>
              </button>

              {focusVoice && (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Foco: {focusVoice}
                </span>
              )}
            </div>

            {/* Custom Musician Chord Layer Selector (if any member has custom notes/cifras) */}
            {customChordLayers.length > 0 && (
              <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 font-bold px-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#FF4D00]" />
                  Camada:
                </span>
                <button
                  onClick={() => setSelectedLayerId('oficial')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                    selectedLayerId === 'oficial'
                      ? 'bg-[#FF4D00] text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Oficial
                </button>
                {customChordLayers.map((layer) => (
                  <button
                    key={layer.ID}
                    onClick={() => setSelectedLayerId(layer.ID)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors ${
                      selectedLayerId === layer.ID
                        ? 'bg-[#FF4D00] text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer.Instrumento}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Voice Focus Filter Chips */}
          {showVocalHighlights && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">
                Filtrar Foco:
              </span>
              <button
                onClick={() => setFocusVoice(null)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                  focusVoice === null
                    ? 'bg-white text-slate-950 shadow-md font-extrabold scale-105'
                    : 'bg-[#181818] text-slate-400 hover:text-white border border-slate-800'
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
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border shrink-0 transition-all ${
                      isSelected
                        ? `${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText} ring-2 ring-white/50 scale-105 shadow-md`
                        : 'bg-[#181818] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${vocal}` : vocal}
                  </button>
                );
              })}
            </div>
          )}
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
            text={currentDisplayText} 
            semitones={semitones} 
            displayMode={displayMode}
            fontSizeStep={fontSizeStep}
            focusVoice={focusVoice}
            showVocalHighlights={showVocalHighlights}
            knownSingers={availableVocals}
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

