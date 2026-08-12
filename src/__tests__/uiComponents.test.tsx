import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { AdminView } from '../components/AdminView';
import { ToastProvider } from '../context/ToastContext';

describe('4. Component & UI Interaction Tests', () => {

  it('4.1 Header should render app title and navigation controls', () => {
    const handleSync = vi.fn();
    render(
      <ToastProvider>
        <Header
          activeTab="musicas"
          onSelectTab={() => {}}
          onSync={handleSync}
          isSyncing={false}
        />
      </ToastProvider>
    );

    expect(screen.getByText('TP FLAME')).toBeDefined();
    expect(screen.getByTitle(/Sincronizar/i)).toBeDefined();
  });

  it('4.2 AdminView should enforce typing "ZERAR" before executing full database wipe', () => {
    const handleDataChanged = vi.fn();
    render(
      <ToastProvider>
        <AdminView
          onDataChanged={handleDataChanged}
          onSelectTab={() => {}}
        />
      </ToastProvider>
    );

    // 1. First authenticate in restricted Admin area
    const passwordInput = screen.getByPlaceholderText('Digite sua senha...') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'admin' } });
    
    const loginBtn = screen.getByText('Entrar na Administração');
    fireEvent.click(loginBtn);

    // 2. Find and click Zerar Banco de Dados button
    const clearBtn = screen.getByText('Zerar Banco de Dados');
    expect(clearBtn).toBeDefined();
    fireEvent.click(clearBtn);

    // 3. Modal should be visible now
    expect(screen.getByText(/Atenção: Esta ação vai apagar/i)).toBeDefined();
    const executeBtn = screen.getByText('Sim, Apagar Tudo') as HTMLButtonElement;
    
    // Initially disabled
    expect(executeBtn.disabled).toBe(true);

    // 4. Type incorrect string
    const input = screen.getByPlaceholderText('Digite ZERAR') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'errado' } });
    expect(executeBtn.disabled).toBe(true);

    // 5. Type correct string ZERAR
    fireEvent.change(input, { target: { value: 'ZERAR' } });
    expect(executeBtn.disabled).toBe(false);

    // 6. Click confirm button
    fireEvent.click(executeBtn);
    expect(handleDataChanged).toHaveBeenCalled();
  });
});
