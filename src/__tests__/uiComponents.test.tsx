import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// AdminView usa useAuth() (Fase 4) — precisa do Firebase Auth mockado pelo
// mesmo motivo do storage.test.ts: sem isso, tentaria conexão de verdade.
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth: any, cb: any) => {
    cb(null); // ninguém logado neste teste — AdminView não depende disso pra renderizar
    return () => {};
  }),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
  getAuth: vi.fn(() => ({}))
}));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({}))
}));
vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  googleProvider: {}
}));

import { Header } from '../components/Header';
import { AdminView } from '../components/AdminView';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';

describe('4. Component & UI Interaction Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('4.1 Header should render the brand and trigger a sync when the sync control is used', () => {
    const handleSync = vi.fn();
    render(
      <ToastProvider>
        <Header
          onNavigateTab={() => {}}
          onSync={handleSync}
          isSyncing={false}
        />
      </ToastProvider>
    );

    expect(screen.getByText('TP FLAME')).toBeDefined();

    const syncBtn = screen.getByTitle('Verificar conexão com o banco de dados');
    fireEvent.click(syncBtn);
    expect(handleSync).toHaveBeenCalled();
  });

  it('4.2 AdminView should gate the settings behind the admin password', () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <AdminView
            onDataChanged={() => {}}
            totalMusicas={0}
            totalVersoes={0}
            totalCultos={0}
            totalIntegrantes={0}
          />
        </AuthProvider>
      </ToastProvider>
    );

    // Antes de autenticar, o painel (com a troca de senha) não aparece
    expect(screen.queryByText('Alterar Senha de Administrador')).toBeNull();

    // Senha errada mantém o bloqueio
    const passwordInput = screen.getByPlaceholderText('Digite sua senha...');
    fireEvent.change(passwordInput, { target: { value: 'senha-errada' } });
    fireEvent.click(screen.getByText('Entrar na Administração'));
    expect(screen.getByText(/Senha incorreta/i)).toBeDefined();
    expect(screen.queryByText('Alterar Senha de Administrador')).toBeNull();

    // Senha correta libera o painel
    fireEvent.change(passwordInput, { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('Entrar na Administração'));
    expect(screen.getByText('Alterar Senha de Administrador')).toBeDefined();
  });
});
