import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { AdminView } from '../components/AdminView';
import { ToastProvider } from '../context/ToastContext';

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

    const syncBtn = screen.getByTitle('Atualizar repertório com a planilha');
    fireEvent.click(syncBtn);
    expect(handleSync).toHaveBeenCalled();
  });

  it('4.2 AdminView should gate the settings behind the admin password', () => {
    render(
      <ToastProvider>
        <AdminView
          onOpenGasModal={() => {}}
          onDataChanged={() => {}}
          totalMusicas={0}
          totalVersoes={0}
          totalCultos={0}
          totalIntegrantes={0}
        />
      </ToastProvider>
    );

    // Antes de autenticar, as configurações de conexão não aparecem
    expect(screen.queryByText('Salvar Conexão')).toBeNull();

    // Senha errada mantém o bloqueio
    const passwordInput = screen.getByPlaceholderText('Digite sua senha...');
    fireEvent.change(passwordInput, { target: { value: 'senha-errada' } });
    fireEvent.click(screen.getByText('Entrar na Administração'));
    expect(screen.getByText(/Senha incorreta/i)).toBeDefined();
    expect(screen.queryByText('Salvar Conexão')).toBeNull();

    // Senha correta libera o painel
    fireEvent.change(passwordInput, { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('Entrar na Administração'));
    expect(screen.getByText('Salvar Conexão')).toBeDefined();
  });
});
