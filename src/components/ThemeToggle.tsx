import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../utils/theme';

/** Botão rápido (Header e Modo Palco): mostra o tema pra onde vai trocar. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggle } = useTheme();
  const paraClaro = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2 rounded-xl border text-fg-muted hover:text-fg bg-surface hover:bg-surface-hover border-line transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${className}`}
      title={paraClaro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={paraClaro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {paraClaro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

/** Escolha explícita (Mais > Aparência). */
export const ThemeChoice: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const opts = [
    { v: 'dark' as const, label: 'Escuro', Icon: Moon },
    { v: 'light' as const, label: 'Claro', Icon: Sun }
  ];
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tema do app">
      {opts.map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          onClick={() => setTheme(v)}
          className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            theme === v
              ? 'bg-brand text-slate-950 border-brand shadow-sm'
              : 'bg-canvas text-fg-muted border-line hover:text-fg'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
};
