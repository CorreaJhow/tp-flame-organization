/**
 * Camada de dados da tabela Cultos via Firestore (Fase 4, Fase B —
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
import { Culto } from '../types';
import { generateUUID } from './storage';
import { quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'cultos';

export async function getCultosFirestore(): Promise<Culto[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Culto)
    .filter((c) => !c.Excluido_Em);
}

type CamposEditaveisCulto = Pick<Culto, 'Data' | 'Nome_Evento' | 'Status' | 'Observacoes'>;

export async function addCultoFirestore(input: CamposEditaveisCulto): Promise<Culto> {
  const id = generateUUID();
  const culto: Culto = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // stripUndefined: `Observacoes` é opcional (ver firestoreUtils.ts).
  await setDoc(doc(db, COLLECTION, id), stripUndefined(culto));
  return culto;
}

export async function updateCultoFirestore(
  id: string,
  changes: Partial<CamposEditaveisCulto>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteCultoFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
