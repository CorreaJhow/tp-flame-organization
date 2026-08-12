import React, { useState, useEffect } from 'react';
import { X, Smartphone, Share, PlusSquare, Download, CheckCircle2, Flame, ArrowUpRight } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Check if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#121212] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Instalar App no Celular</h2>
              <p className="text-xs text-slate-400">Tenha o TP Flame na sua tela inicial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#080808] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isInstalled ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">App já Instalado!</h3>
              <p className="text-xs text-slate-400">
                Você já está utilizando o TP Flame em modo aplicativo nativo.
              </p>
            </div>
          ) : (
            <>
              {/* Native Android Install Button if available */}
              {deferredPrompt && (
                <div className="p-4 bg-gradient-to-r from-[#FF4D00]/20 to-transparent border border-[#FF4D00]/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">Instalação Rápida Detectada</span>
                    <Download className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <button
                    onClick={handleNativeInstall}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar Agora no Aparelho</span>
                  </button>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {deviceType === 'ios' ? '📱 Como Instalar no iPhone (iOS):' : '📱 Como Instalar no Android / Navegador:'}
                </h3>

                {deviceType === 'ios' ? (
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-3 bg-[#080808] p-3 rounded-xl border border-slate-800">
                      <span className="w-6 h-6 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] font-black text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <span className="font-bold text-white block">Abra no Safari</span>
                        <span className="text-slate-400 text-[11px]">Certifique-se de estar usando o navegador Safari do seu iPhone.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 bg-[#080808] p-3 rounded-xl border border-slate-800">
                      <span className="w-6 h-6 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] font-black text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          Toque no botão Compartilhar <Share className="w-3.5 h-3.5 text-[#FF4D00]" />
                        </span>
                        <span className="text-slate-400 text-[11px]">Localizado na barra inferior central do Safari.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 bg-[#080808] p-3 rounded-xl border border-slate-800">
                      <span className="w-6 h-6 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] font-black text-xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          Selecione "Adicionar à Tela de Início" <PlusSquare className="w-3.5 h-3.5 text-[#FF4D00]" />
                        </span>
                        <span className="text-slate-400 text-[11px]">Role o menu para baixo até encontrar essa opção.</span>
                      </div>
                    </li>
                  </ol>
                ) : (
                  <ol className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-3 bg-[#080808] p-3 rounded-xl border border-slate-800">
                      <span className="w-6 h-6 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] font-black text-xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <span className="font-bold text-white block">Menu do Navegador (3 Pontinhos)</span>
                        <span className="text-slate-400 text-[11px]">Toque nos 3 pontinhos no canto superior direito do Chrome.</span>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 bg-[#080808] p-3 rounded-xl border border-slate-800">
                      <span className="w-6 h-6 rounded-lg bg-[#FF4D00]/20 text-[#FF4D00] font-black text-xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <span className="font-bold text-white flex items-center gap-1.5">
                          Toque em "Instalar Aplicativo" ou "Adicionar à Tela Inicial"
                        </span>
                        <span className="text-slate-400 text-[11px]">O ícone do TP Flame será adicionado diretamente à tela inicial.</span>
                      </div>
                    </li>
                  </ol>
                )}
              </div>

              <div className="p-3 bg-[#080808] border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF4D00] shrink-0" />
                <span>O app roda em tela cheia, abre em 1 toque e recebe todas as atualizações automaticamente!</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
