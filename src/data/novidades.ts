/**
 * Aviso "O que mudou no app". Em cada versão nova que mereça aviso, troque o
 * `id` e os itens: quem ainda não viu aquele `id` recebe o aviso uma vez.
 */
export interface NovidadeItem {
  titulo: string;
  texto: string;
}

export const NOVIDADES: { id: string; itens: NovidadeItem[] } = {
  id: '2026-11-tema-e-tom-do-culto',
  itens: [
    {
      titulo: 'Tema claro e escuro',
      texto: 'Toque no sol/lua no topo da tela (ou em Mais > Aparência, ou dentro do Modo Palco) para trocar. O escuro continua sendo o padrão.'
    },
    {
      titulo: 'Tom de cada culto',
      texto: 'No card da música, em Cultos, escolha o "Tom do culto". A música continua salva no tom original e o Modo Palco já abre no tom escolhido.'
    },
    {
      titulo: 'Músicas em ordem A–Z com busca',
      texto: 'Na Biblioteca e ao adicionar música ao culto, a busca acha pelo nome, artista ou por um trecho da letra.'
    },
    {
      titulo: 'Última vez tocada',
      texto: 'Agora vale para a música inteira, em qualquer versão ou tom. Duplicar uma versão não zera mais essa informação.'
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
