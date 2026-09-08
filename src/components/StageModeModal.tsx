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
  Mic,
  Eye,
  Layers,
  WifiOff
} from 'lucide-react';
import { Culto, RepertorioItem, Versao, Musica, Nota } from '../types';
import { formatKeyDisplay } from '../utils/chordTransposer';
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

// Preferências do Modo Palco lembradas por aparelho (não por pessoa — não
// há login separado por instrumento/voz). Cobre o caso comum de "esse
// celular é sempre o da Larissa, sempre no modo Letra, sempre com foco na
// própria voz" — sem isso, toda música/todo culto exigia reconfigurar do
// zero, e quem mais sentia isso era o vocalista.
const STAGE_PREFS_KEY = 'tp_flame_stage_prefs_v1';

interface StagePrefs {
  displayMode: 'cifra' | 'letra';
  fontSizeStep: number;
  showVocalHighlights: boolean;
  focusVoice: string | null;
}

const loadStagePrefs = (): Partial<StagePrefs> => {
  try {
    const raw = localStorage.getItem(STAGE_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

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

  // "Toque de novo pra sair": o botão vermelho de Sair fica exatamente
  // onde o polegar passa ao segurar o celular numa mão — no meio de uma
  // apresentação, um toque sem querer aí obriga a reabrir o culto, achar
  // a música de novo e reconfigurar os filtros. Sem virar um modal (que
  // atrapalharia quem realmente quer sair rápido), o primeiro toque só
  // "arma" o botão por alguns segundos; sai de verdade só no segundo
  // toque, ou sozinho se ninguém confirmar. Esc no teclado sai direto —
  // quem usa teclado não é o cenário do toque acidental.
  const EXIT_CONFIRM_WINDOW_MS = 2500;
  const [exitArmed, setExitArmed] = useState(false);
  const exitArmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exitArmTimeoutRef.current) clearTimeout(exitArmTimeoutRef.current);
    };
  }, []);

  // O aviso de "Offline" do header principal fica escondido atrás do Modo
  // Palco (ele cobre a tela toda). Sem repetir esse indicador aqui, se a
  // internet cair no meio do culto ninguém percebe — não que trave nada
  // (tudo já funciona local), mas some a segurança de saber que os dados
  // não estão sincronizando com o resto da equipe naquele momento.
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleExitTap = () => {
    if (exitArmed) {
      if (exitArmTimeoutRef.current) clearTimeout(exitArmTimeoutRef.current);
      onClose();
      return;
    }
    setExitArmed(true);
    exitArmTimeoutRef.current = setTimeout(() => setExitArmed(false), EXIT_CONFIRM_WINDOW_MS);
  };
  const [displayMode, setDisplayMode] = useState<'cifra' | 'letra'>(
    () => loadStagePrefs().displayMode ?? 'cifra'
  );
  const [fontSizeStep, setFontSizeStep] = useState(
    () => loadStagePrefs().fontSizeStep ?? 0
  ); // -1, 0, 1, 2, 3

  // Auto-scroll State & Speed
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 0.5, 1, 1.5, 2, 3, 4
  const [showNotes, setShowNotes] = useState(false);

  // Vocal Annotation & Focus State
  const [focusVoice, setFocusVoice] = useState<string | null>(
    () => loadStagePrefs().focusVoice ?? null
  );
  const [showVocalHighlights, setShowVocalHighlights] = useState(
    () => loadStagePrefs().showVocalHighlights ?? true
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string>('oficial');

  // Grava a preferência a cada mudança. Guardado por aparelho (localStorage
  // simples) — não faz sentido sincronizar isso entre integrantes.
  useEffect(() => {
    try {
      const prefs: StagePrefs = { displayMode, fontSizeStep, showVocalHighlights, focusVoice };
      localStorage.setItem(STAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // localStorage indisponível (aba anônima, etc.) — sem persistência, sem quebrar nada.
    }
  }, [displayMode, fontSizeStep, showVocalHighlights, focusVoice]);

  // Tempo (BPM) da versão atual — só leitura, mostrada no banner de
  // informações. O metrônomo que existia aqui foi removido a pedido do
  // usuário (simplifica a tela mais usada no palco; instrumentistas que
  // precisam de metrônomo já têm um separado no pedal/afinador).
  const [customBpm, setCustomBpm] = useState<number>(120);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const currentKeyDisplay = currentVersao ? formatKeyDisplay(currentVersao.Tom, currentVersao.Modo, semitones) : 'C';

  // Sync BPM when current version changes
  useEffect(() => {
    if (currentVersao?.BPM) {
      setCustomBpm(currentVersao.BPM);
    } else {
      setCustomBpm(120);
    }
  }, [currentVersao?.ID]);

  // Mostra as observações de arranjo sozinho quando a música tem alguma.
  //
  // A informação já era visível pra qualquer instrumento — não havia filtro
  // por autor —, mas ficava atrás de um botão que só quem soubesse da
  // funcionalidade clicaria. Um baixista abrindo o Modo Palco não tinha como
  // adivinhar que o tecladista deixou uma nota ali. Continua possível
  // esconder de volta a qualquer momento; isso só decide o estado inicial ao
  // trocar de música.
  useEffect(() => {
    setShowNotes(currentNotas.length > 0);
  }, [currentVersao?.ID]);

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

  // Mantém a tela acesa enquanto o Modo Palco está aberto.
  //
  // Quem está cantando não fica tocando a tela — lê a letra e usa o
  // auto-scroll. Sem isso, o celular apaga sozinho no meio da música (o
  // comportamento padrão de qualquer Android/iPhone) e a pessoa perde a
  // letra bem na hora que mais precisa dela. Simplesmente não existia
  // nenhum controle disso antes. Se o navegador não suportar a API (ainda
  // existe algum Android antigo por aí), falha em silêncio — sem isso o
  // app já funcionava do jeito que funcionava, não piora nada.
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Não suportado, negado pelo usuário, ou aba em segundo plano --
        // segue sem travar a tela.
      }
    };

    requestWakeLock();

    // O sistema solta o wake lock sozinho ao minimizar o app/trocar de
    // aba; se a pessoa voltar pro Modo Palco (deu uma checada no WhatsApp
    // e voltou, por exemplo), pede de novo.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLock?.release?.().catch(() => {});
    };
  }, []);

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

  // Trocar de música arrastando o dedo na letra — segurando o microfone
  // numa mão, arrastar é mais natural do que mirar num botão pequeno. Os
  // botões continuam funcionando normalmente, isso é só um atalho extra.
  //
  // Decide a direção só no touchend (comparando o deslocamento total) e
  // nunca chama preventDefault no touchmove — a rolagem vertical normal da
  // letra (dedo ou auto-scroll) continua funcionando exatamente igual. Só
  // dispara troca de música quando o arrasto é claramente mais horizontal
  // que vertical, pra não confundir com o gesto de rolar a letra.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    const SWIPE_THRESHOLD = 70;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) handleNextSong();
      else handlePrevSong();
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
        {/* Linha 1: navegação entre músicas + sair. Sempre visível e sem
            disputar espaço com as ferramentas — é o que mais precisa estar
            fácil de acertar no meio de uma música, no palco. */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              onClick={handlePrevSong}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-20 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Música Anterior (Seta Esquerda)"
            >
              <ChevronLeft className="w-5 h-5 text-[#FF4D00]" />
            </button>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-black text-[#FF4D00] uppercase tracking-wider flex items-center gap-1.5">
                {currentIndex + 1} DE {setlist.length}
                {!isOnline && (
                  <span
                    className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded normal-case tracking-normal"
                    title="Sem conexão — os dados continuam salvos neste aparelho e sincronizam sozinhos quando voltar"
                  >
                    <WifiOff className="w-2.5 h-2.5" />
                    Offline
                  </span>
                )}
              </span>
              <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">
                {currentMusica.Nome}
              </h2>
            </div>

            {/* Próxima Música — a ação mais repetida no meio de um culto,
                por isso ganha destaque visual (preenchida, maior) em vez de
                dividir o mesmo estilo discreto da seta "Anterior". */}
            <button
              onClick={handleNextSong}
              disabled={currentIndex === setlist.length - 1}
              className="p-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] disabled:opacity-20 disabled:bg-[#1a1a1a] transition-colors shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center shadow-lg shadow-[#FF4D00]/30 active:scale-95"
              title="Próxima Música (Seta Direita)"
            >
              <ChevronRight className="w-6 h-6 text-slate-950" strokeWidth={3} />
            </button>
          </div>

          {/* High Visibility Close Button — toque de novo pra confirmar */}
          <button
            id="exit-stage-mode-top-button"
            onClick={handleExitTap}
            className={`py-2.5 px-3 rounded-xl text-white font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-lg active:scale-95 transition-all border min-h-[40px] ${
              exitArmed
                ? 'bg-red-500 border-red-300 ring-2 ring-red-400/60 animate-pulse'
                : 'bg-red-600 hover:bg-red-700 border-red-400/30'
            }`}
            title={exitArmed ? 'Toque de novo pra confirmar' : 'Sair do Modo Palco (Esc)'}
          >
            <X className="w-4 h-4" />
            <span className={exitArmed ? 'inline' : 'hidden sm:inline'}>
              {exitArmed ? 'Confirmar' : 'Sair'}
            </span>
          </button>
        </div>

        {/* Linha 2: ferramentas de exibição — rolagem horizontal própria
            (com indicador de sombra) em vez de espremer tudo numa linha só
            com a navegação. */}
        <div className="relative -mx-3 px-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Display Mode Toggle (Cifra / Letra) */}
            <div className="bg-[#080808] p-1 border border-slate-800 rounded-xl flex items-center gap-1 shrink-0">
              <button
                onClick={() => setDisplayMode('cifra')}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all min-h-[36px] ${
                  displayMode === 'cifra'
                    ? 'bg-[#FF4D00] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Cifra (para Instrumentistas)"
              >
                <Music2 className="w-3.5 h-3.5" />
                <span>Cifra</span>
              </button>
              <button
                onClick={() => setDisplayMode('letra')}
                className={`px-2.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all min-h-[36px] ${
                  displayMode === 'letra'
                    ? 'bg-[#FF4D00] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Letra (para Vocais - Fonte Grande)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Letra</span>
              </button>
            </div>

            {/* Font Sizing Controls (A- / A+) */}
            <div className="bg-[#080808] p-1 border border-slate-800 rounded-xl flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setFontSizeStep((s) => Math.max(-1, s - 1))}
                disabled={fontSizeStep <= -1}
                className="p-2 rounded text-slate-400 hover:text-white disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Diminuir Fonte"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[12px] font-bold text-slate-300 px-1">A</span>
              <button
                onClick={() => setFontSizeStep((s) => Math.min(3, s + 1))}
                disabled={fontSizeStep >= 3}
                className="p-2 rounded text-slate-400 hover:text-white disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Aumentar Fonte"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Transposer (Only in Cifra mode or when applicable) */}
            {displayMode === 'cifra' && (
              <div className="flex items-center gap-1 bg-[#080808] border border-slate-800 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setSemitones((s) => s - 1)}
                  className="p-2 rounded text-[#FF4D00] hover:bg-[#1a1a1a] min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Baixar 1 Tom"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-[#FF4D00] px-1">{currentKeyDisplay}</span>
                <button
                  onClick={() => setSemitones((s) => s + 1)}
                  className="p-2 rounded text-[#FF4D00] hover:bg-[#1a1a1a] min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Subir 1 Tom"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2.5 rounded-xl border transition-colors shrink-0 min-w-[40px] min-h-[36px] flex items-center justify-center ${
                showNotes
                  ? 'bg-[#FF4D00] text-slate-950 border-[#FF4D00] font-bold'
                  : 'bg-[#1a1a1a] text-slate-300 border-slate-800'
              }`}
              title="Ver Observações de Arranjo"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
          {/* Sombra indicando que a linha rola pra direita */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#121212] to-transparent" />
        </div>
      </div>

      {/* Main Full-Width Reader with Ref for Smooth Scroll */}
      <div
        ref={scrollContainerRef}
        // SEM "scroll-smooth": essa classe CSS faz o navegador animar cada
        // mudança de scrollTop — e o auto-scroll escreve um novo scrollTop
        // a cada frame (~60x/s). As animações se acumulam e brigam entre
        // si, e em navegadores mobile (que são mais rígidos com isso) o
        // resultado prático era simplesmente não mover a tela. Desktop
        // "disfarçava" o problema por ser mais tolerante. -webkit-overflow-
        // scrolling garante rolagem com inércia normal no iOS.
        className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 space-y-4"
        style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
              <span className="text-[12px] text-slate-500 uppercase font-bold block">Tom</span>
              <span className="text-xs font-black text-amber-400">{currentKeyDisplay}</span>
            </div>

            <div className="bg-[#080808] border border-slate-800 px-2.5 py-1 rounded-xl text-center">
              <span className="text-[12px] text-slate-500 uppercase font-bold block">Tempo</span>
              <span className="text-xs font-black text-slate-200">{customBpm} BPM</span>
            </div>

            {currentVersao.Estrutura && (
              <div className="text-[12px] text-slate-300 font-mono bg-[#080808] px-2.5 py-1 rounded-xl border border-slate-800">
                {currentVersao.Estrutura}
              </div>
            )}
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
                <span className="text-[13px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Foco: {focusVoice}
                </span>
              )}
            </div>

            {/* Custom Musician Chord Layer Selector (if any member has custom notes/cifras) */}
            {customChordLayers.length > 0 && (
              <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[12px] text-slate-400 font-bold px-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#FF4D00]" />
                  Camada:
                </span>
                <button
                  onClick={() => setSelectedLayerId('oficial')}
                  className={`px-2 py-0.5 rounded-lg text-[13px] font-bold transition-colors ${
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
                    className={`px-2 py-0.5 rounded-lg text-[13px] font-bold transition-colors ${
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
            <div className="relative pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[12px] font-bold text-slate-500 uppercase shrink-0">
                  Filtrar Foco:
                </span>
                <button
                  onClick={() => setFocusVoice(null)}
                  className={`px-2.5 py-1.5 rounded-xl text-[13px] font-bold shrink-0 transition-all ${
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
                      className={`px-2.5 py-1.5 rounded-xl text-[13px] font-extrabold border shrink-0 transition-all ${
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
              {/* Sombra indicando que a linha rola pra direita */}
              <div className="pointer-events-none absolute right-0 top-1 bottom-0 w-6 bg-gradient-to-l from-[#121212] to-transparent" />
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
          <div className="relative min-w-0">
            <div className="flex items-center gap-1 bg-[#080808] p-1 rounded-xl border border-slate-800 text-xs font-black overflow-x-auto no-scrollbar">
              <span className="text-[12px] text-slate-500 px-1 font-bold shrink-0">VEL:</span>
              {[0.5, 1, 1.5, 2, 3, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setScrollSpeed(speed)}
                  className={`px-2.5 py-2 rounded-lg text-[13px] shrink-0 min-h-[36px] transition-colors ${
                    scrollSpeed === speed ? 'bg-[#FF4D00] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            {/* Sombra indicando que a linha rola pra direita */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-[#080808] to-transparent rounded-r-xl" />
          </div>
        </div>

        {/* Shortcuts Hint & Exit */}
        <div className="flex items-center gap-2">
          <span className="hidden lg:inline-block text-[12px] text-slate-500 font-mono bg-[#080808] px-2 py-1 rounded-lg border border-slate-800">
            Atalhos: <span className="text-slate-300">Espaço</span> (Play/Pause) | <span className="text-slate-300">L</span> (Letra/Cifra) | <span className="text-slate-300">Seta</span> (Músicas)
          </span>

          <button
            id="exit-stage-mode-bottom-button"
            onClick={handleExitTap}
            title={exitArmed ? 'Toque de novo pra confirmar' : 'Sair do Modo Palco'}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
              exitArmed
                ? 'bg-red-950/80 text-red-400 border-red-500/50 animate-pulse'
                : 'bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-400 border-slate-700'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{exitArmed ? 'Toque de novo' : 'Sair'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

