/**
 * Camada de dados da tabela Config via Firestore (Fase 4, Fase B —
 * ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * ISOLADO DE PROPÓSITO, mesmo padrão das tabelas anteriores.
 *
 * Diferente das outras 9 tabelas: Config é hoje vestigial no app real
 * (`INITIAL_CONFIG` em `initialData.ts` é um array vazio; nenhuma tela usa
 * `ConfigItem` de verdade). Mantém o desenho já registrado no plano — um
 * documento único chave-valor (`config/geral`), em vez de uma coleção com
 * um doc por chave — sem inventar um caso de uso que não existe hoje.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { stripUndefined } from './firestoreUtils';

const DOC_PATH = 'geral';
const COLLECTION = 'config';

export async function getConfigFirestore(): Promise<Record<string, string>> {
  const snap = await getDoc(doc(db, COLLECTION, DOC_PATH));
  return snap.exists() ? (snap.data() as Record<string, string>) : {};
}

/** Merge (não substitui o documento inteiro) — preserva outras chaves já salvas. */
export async function setConfigValueFirestore(chave: string, valor: string): Promise<void> {
  await setDoc(doc(db, COLLECTION, DOC_PATH), stripUndefined({ [chave]: valor }), { merge: true });
}
