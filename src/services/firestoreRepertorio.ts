/**
 * Camada de dados da tabela Repertorio via Firestore (Fase 4, Fase B —
 * ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * ISOLADO DE PROPÓSITO, mesmo padrão das tabelas anteriores — nada no app
 * real importa este arquivo ainda.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { RepertorioItem } from '../types';
import { generateUUID } from './storage';
import { quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'repertorio';

export async function getRepertorioFirestore(): Promise<RepertorioItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as RepertorioItem)
    .filter((r) => !r.Excluido_Em);
}

type CamposEditaveisRepertorio = Pick<
  RepertorioItem,
  'ID_Culto' | 'ID_Versao' | 'Ordem' | 'Dirigente' | 'Observacao_Culto'
>;

export async function addRepertorioItemFirestore(
  input: CamposEditaveisRepertorio
): Promise<RepertorioItem> {
  const id = generateUUID();
  const item: RepertorioItem = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // stripUndefined: Dirigente/Observacao_Culto são opcionais (ver firestoreUtils.ts).
  await setDoc(doc(db, COLLECTION, id), stripUndefined(item));
  return item;
}

export async function updateRepertorioItemFirestore(
  id: string,
  changes: Partial<CamposEditaveisRepertorio>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteRepertorioItemFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
