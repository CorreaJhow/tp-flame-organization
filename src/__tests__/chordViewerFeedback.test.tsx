import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../services/storage', () => ({ storage: { addLog: vi.fn() } }));

import { ChordViewer } from '../components/ChordViewer';
import { FeedbackModal } from '../components/FeedbackModal';
import { storage } from '../services/storage';
import { marcarNovidadesVistas, novidadesPendentes } from '../data/novidades';

const CIFRA = `[Refrão]
[Gm7(11)]Santo é o [Am7(5+)]Senhor
Digno de louvor

[Refrão]
[Gm7(11)]Santo é o [Am7(5+)]Senhor
Digno de louvor`;

describe('ChordViewer', () => {
  beforeEach(() => cleanup());

  it('Modo Sucinta mostra o bloco uma vez com a contagem, sem acordes', () => {
    const { container } = render(<ChordViewer text={CIFRA} displayMode="sucinta" />);
    expect(screen.getByText('Refrão (2x)')).toBeDefined();
    expect(container.textContent?.match(/Digno de louvor/g)).toHaveLength(1);
    expect(container.textContent).not.toContain('Gm7');
  });

  it('Modo Cifra continua completo', () => {
    const { container } = render(<ChordViewer text={CIFRA} displayMode="cifra" />);
    expect(container.textContent?.match(/Digno de louvor/g)).toHaveLength(2);
    expect(container.textContent).toContain('Gm7(11)');
  });

  it('Modo Letra continua repetindo a letra inteira', () => {
    const { container } = render(<ChordViewer text={CIFRA} displayMode="letra" />);
    expect(container.textContent?.match(/Digno de louvor/g)).toHaveLength(2);
  });

  it('transpõe acorde com parênteses e não trata lista de acordes como título', () => {
    const { container } = render(<ChordViewer text={'Gm7(11)  C\n[Dm] [C] [A#]'} semitones={2} />);
    expect(container.textContent).toContain('Am7(11)');
    expect(container.textContent).toContain('Em');
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('Modo Letra esconde a linha de acordes com parênteses', () => {
    const { container } = render(<ChordViewer text={'Gm7(11)  Am7(5+)\n[Dm] [C] [A#]\nSanto'} displayMode="letra" />);
    expect(container.textContent).toBe('Santo');
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it('[E] no começo da linha é acorde, não cantor', () => {
    const { container } = render(<ChordViewer text="[E] Sobre o trono" semitones={2} />);
    expect(container.textContent).toContain('F#');
    expect(container.querySelector('.rounded-full')).toBeNull();
  });
});

describe('FeedbackModal', () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(storage.addLog).mockClear();
  });

  it('Sugestão grava o tipo escolhido', () => {
    render(<FeedbackModal mode="sugestao" onClose={() => {}} />);
    fireEvent.click(screen.getByText('Outra ideia'));
    fireEvent.change(screen.getByLabelText(/Qual é a sua ideia/), { target: { value: 'Ideia' } });
    fireEvent.click(screen.getByText('Enviar'));
    expect(storage.addLog).toHaveBeenCalledWith('FEEDBACK', '[SUGESTAO:OUTRA] Ideia');
  });

  it('Bug grava [BUG]', () => {
    render(<FeedbackModal mode="bug" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/O que aconteceu/), { target: { value: 'Quebrou' } });
    fireEvent.click(screen.getByText('Enviar'));
    expect(storage.addLog).toHaveBeenCalledWith('FEEDBACK', '[BUG] Quebrou');
  });

  it('Música recusa link inválido e grava o válido', () => {
    render(<FeedbackModal mode="musica" defaultName="Larissa" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Nome da música/), { target: { value: 'Santo' } });
    const link = screen.getByLabelText(/Link do YouTube/);
    fireEvent.change(link, { target: { value: 'https://example.com/x' } });
    fireEvent.click(screen.getByText('Enviar'));
    expect(screen.getByRole('alert')).toBeDefined();
    expect(storage.addLog).not.toHaveBeenCalled();

    fireEvent.change(link, { target: { value: 'youtu.be/abc' } });
    fireEvent.click(screen.getByText('Enviar'));
    expect(storage.addLog).toHaveBeenCalledWith(
      'FEEDBACK',
      '[MUSICA] De: Larissa - Nome: Santo - Link: https://youtu.be/abc'
    );
  });
});

describe('Novidades', () => {
  it('aparece uma vez por aparelho', () => {
    localStorage.clear();
    expect(novidadesPendentes()).toBe(true);
    marcarNovidadesVistas();
    expect(novidadesPendentes()).toBe(false);
  });
});
