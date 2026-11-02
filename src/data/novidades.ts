/**
 * Aviso "O que mudou no app". Em cada versão nova que mereça aviso, troque o
 * `id` e os itens: quem ainda não viu aquele `id` recebe o aviso uma vez.
 */
export interface NovidadeItem {
  titulo: string;
  texto: string;
}

export const NOVIDADES: { id: string; itens: NovidadeItem[] } = {
  id: '2026-11-letra-sucinta',
  itens: [
    {
      titulo: 'Letra sucinta para quem canta',
      texto:
        'No Modo Palco, toque em "Sucinta". Cada parte repetida aparece uma vez só, com quantas vezes cantar. Exemplo: "Refrão (4x)".'
    },
    {
      titulo: 'Cultos em ordem',
      texto: 'O próximo culto vem primeiro. Os que já passaram ficam no fim da lista.'
    },
    {
      titulo: 'Sugerir uma música',
      texto: 'Na tela inicial, envie o nome da música e o link do YouTube ou do Spotify.'
    },
    {
      titulo: 'Sugestão e bug separados',
      texto: 'Agora cada um tem seu botão na tela inicial, o que facilita mandar sua ideia ou avisar de um problema.'
    },
    {
      titulo: 'Mais acordes reconhecidos',
      texto: 'Acordes como Gm7(11) e Am7(5+) agora mudam de tom junto com a música e não aparecem mais no meio da letra.'
    }
  ]
};

const STORAGE_KEY = 'tp_flame_novidades_vistas_v1';

export function novidadesPendentes(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== NOVIDADES.id;
  } catch {
    // Sem localStorage, não dá para lembrar: melhor não repetir o aviso sempre.
    return false;
  }
}

export function marcarNovidadesVistas(): void {
  try {
    localStorage.setItem(STORAGE_KEY, NOVIDADES.id);
  } catch {
    // Sem persistência neste navegador.
  }
}
