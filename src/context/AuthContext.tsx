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

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um <AuthProvider>');
  return ctx;
}
