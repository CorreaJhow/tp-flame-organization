/**
 * Camada de dados da tabela Notas via Firestore (Fase 4, Fase B —
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
import { Nota } from '../types';
import { generateUUID } from './storage';
import { quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'notas';

export async function getNotasFirestore(): Promise<Nota[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Nota)
    .filter((n) => !n.Excluido_Em);
}

type CamposEditaveisNota = Pick<
  Nota,
  'ID_Versao' | 'Instrumento' | 'Observacao' | 'Autor' | 'Titulo' | 'TipoNota'
>;

export async function addNotaFirestore(input: CamposEditaveisNota): Promise<Nota> {
  const id = generateUUID();
  const nota: Nota = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // stripUndefined: Autor/Titulo/TipoNota são opcionais (ver firestoreUtils.ts).
  await setDoc(doc(db, COLLECTION, id), stripUndefined(nota));
  return nota;
}

export async function updateNotaFirestore(
  id: string,
  changes: Partial<CamposEditaveisNota>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteNotaFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
