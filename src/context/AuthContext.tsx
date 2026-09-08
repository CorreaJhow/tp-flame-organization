/**
 * Contexto de autenticação (Fase 4 — ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * Dois métodos de login, decisão do usuário em 05/09/2026: Google ou
 * e-mail+senha. Os dois caem na mesma verificação nas Security Rules do
 * Firestore (email_verified == true + e-mail na lista da equipe) — aqui no
 * cliente só cuidamos da experiência de entrar/sair/criar conta/redefinir
 * senha, a autorização de verdade mora no servidor (Firestore), não aqui.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /**
   * Acrescenta e-mail/senha como método de login numa conta que hoje só
   * entra por Google — o mesmo usuário (mesmo UID) passa a aceitar os dois
   * caminhos. Existe pra contas compartilhadas (ex.: a conta da banda no
   * Google) que precisam de um login alternativo pra alguém sem acesso à
   * senha do Google — como a skill /donna, que não deve nunca usar
   * credencial de conta Google de verdade.
   */
  linkPasswordToAccount: (password: string) => Promise<void>;
  /** true se a conta atual já aceita login por e-mail/senha (além de/no lugar de Google). */
  hasPasswordProvider: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Traduz os códigos de erro mais comuns do Firebase Auth. Sem isso, o
 * usuário veria strings tipo "auth/wrong-password" — informação real, mas
 * inútil pra quem não programa.
 */
export function traduzErroAuth(err: any): string {
  const code = err?.code || '';
  const mapa: Record<string, string> = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Não existe conta com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Tente entrar em vez de criar uma nova.',
    'auth/weak-password': 'Senha muito curta — use pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
    'auth/popup-closed-by-user': 'Janela do Google fechada antes de terminar o login.',
    'auth/network-request-failed': 'Sem conexão com a internet.'
  };
  return mapa[code] || 'Não foi possível completar essa ação. Tente novamente.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    // Ver nota em firestore.rules: sem isto, alguém poderia criar uma conta
    // usando o e-mail de outra pessoa da equipe antes dela mesma criar a
    // dela, e ganhar acesso se passando por ela.
    await sendEmailVerification(cred.user);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const linkPasswordToAccount = useCallback(async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Precisa estar logado, com e-mail conhecido, pra adicionar uma senha.');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await linkWithCredential(auth.currentUser, credential);
  }, []);

  const hasPasswordProvider = !!user?.providerData?.some((p) => p.providerId === 'password');

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, linkPasswordToAccount, hasPasswordProvider, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um <AuthProvider>');
  return ctx;
}
