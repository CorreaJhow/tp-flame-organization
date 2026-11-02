import { Culto } from '../types';

// O tipo Culto e o modal de edição usam nomes de status diferentes; os dois
// conjuntos existem nos dados.
const STATUS_ENCERRADOS = ['Concluído', 'Realizado', 'Cancelado'];

const parseData = (data?: string): Date | null => {
  if (!data) return null;
  // "2026-11-08" sem hora seria lido como UTC e cairia no dia anterior no Brasil
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(data) ? `${data}T00:00` : data);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const inicioDoDia = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** O culto de hoje segue como próximo até o fim do dia, mesmo depois do horário. */
export function isCultoEncerrado(culto: Culto, agora: Date = new Date()): boolean {
  if (STATUS_ENCERRADOS.includes(culto.Status as string)) return true;
  const data = parseData(culto.Data);
  return data !== null && inicioDoDia(data) < inicioDoDia(agora);
}

/** Próximos (do mais perto ao mais longe), sem data, encerrados (do mais recente ao mais antigo). */
export function sortCultos(cultos: Culto[], agora: Date = new Date()): Culto[] {
  const tempo = (c: Culto) => parseData(c.Data)?.getTime() ?? null;
  const grupo = (c: Culto) => (isCultoEncerrado(c, agora) ? 2 : tempo(c) === null ? 1 : 0);

  return [...cultos].sort((a, b) => {
    const diferenca = grupo(a) - grupo(b);
    if (diferenca !== 0) return diferenca;

    const ta = tempo(a);
    const tb = tempo(b);
    if (ta === null || tb === null) return ta === tb ? 0 : ta === null ? 1 : -1;
    return grupo(a) === 2 ? tb - ta : ta - tb;
  });
}
