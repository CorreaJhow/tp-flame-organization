import React, { useState } from 'react';
import { Flame, Mail, Lock, Eye, EyeOff, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth, traduzErroAuth } from '../context/AuthContext';

/**
 * Tela de login (Fase 4 — ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * Dois métodos, decisão do usuário em 05/09/2026: "Entrar com Google" (sem
 * senha nova pra memorizar) ou e-mail+senha (com opção de criar conta e de
 * redefinir senha esquecida). Quem decide se o e-mail tem permissão de
 * verdade são as Security Rules do Firestore, não este componente — aqui é
 * só a experiência de autenticar.
 *
 * Ainda não está ligada em App.tsx — ver PLANO-FASE4, Fase C/D (corte só
 * depois da camada de dados nova estar pronta e testada).
 */
type Mode = 'login' | 'signup' | 'forgot' | 'verify-sent' | 'reset-sent';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogle = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(traduzErroAuth(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setErrorMsg(traduzErroAuth(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não são iguais.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      setMode('verify-sent');
    } catch (err: any) {
      setErrorMsg(traduzErroAuth(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setMode('reset-sent');
    } catch (err: any) {
      setErrorMsg(traduzErroAuth(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormAndGoTo = (target: Mode) => {
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    setMode(target);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF4D00]" />

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center mx-auto shadow-inner">
            <Flame className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">TP Flame</h1>
        </div>

        {/* ESTADO: e-mail de verificação enviado após criar conta */}
        {mode === 'verify-sent' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div>
              <p className="text-sm font-bold text-white">Confirme seu e-mail</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Mandamos um link de confirmação pra <strong className="text-slate-300">{email}</strong>.
                Clique nele e depois volte aqui pra entrar.
              </p>
            </div>
            <button
              onClick={() => resetFormAndGoTo('login')}
              className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Ir para o login
            </button>
          </div>
        )}

        {/* ESTADO: e-mail de redefinição de senha enviado */}
        {mode === 'reset-sent' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div>
              <p className="text-sm font-bold text-white">E-mail enviado</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Mandamos um link pra redefinir a senha de <strong className="text-slate-300">{email}</strong>.
                Verifique também a caixa de spam.
              </p>
            </div>
            <button
              onClick={() => resetFormAndGoTo('login')}
              className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Voltar ao login
            </button>
          </div>
        )}

        {/* ESTADO: recuperar senha */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <button
              type="button"
              onClick={() => resetFormAndGoTo('login')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar
            </button>
            <p className="text-xs text-slate-400">
              Digite o e-mail da sua conta — mandamos um link pra você criar uma senha nova.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
              autoFocus
              className="w-full bg-[#080808] border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
            />
            {errorMsg && <p className="text-xs text-red-400 font-medium bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-center">{errorMsg}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>{isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}</span>
            </button>
          </form>
        )}

        {/* ESTADO: login ou criar conta */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Entrar com Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] text-slate-500 font-bold">OU</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full bg-[#080808] border border-slate-800 rounded-xl pl-9 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha..."
                    required
                    minLength={6}
                    className="w-full bg-[#080808] border border-slate-800 rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Confirmar senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha de novo..."
                    required
                    minLength={6}
                    className="w-full bg-[#080808] border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              )}

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => resetFormAndGoTo('forgot')}
                  className="text-xs font-bold text-[#FF4D00] hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              )}

              {errorMsg && <p className="text-xs text-red-400 font-medium bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-center">{errorMsg}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>{isSubmitting ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <>Não tem conta? <button onClick={() => resetFormAndGoTo('signup')} className="text-[#FF4D00] font-bold hover:underline cursor-pointer">Criar conta</button></>
              ) : (
                <>Já tem conta? <button onClick={() => resetFormAndGoTo('login')} className="text-[#FF4D00] font-bold hover:underline cursor-pointer">Entrar</button></>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
