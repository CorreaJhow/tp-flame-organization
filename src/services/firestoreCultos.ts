/**
 * Camada de dados da tabela Cultos via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts`.
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
import { generateUUID, quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'cultos';

export async function getCultosFirestore(): Promise<Culto[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Culto)
    .filter((c) => !c.Excluido_Em);
}

type CamposEditaveisCulto = Pick<Culto, 'Data' | 'Nome_Evento' | 'Status' | 'Observacoes'>;

export async function addCultoFirestore(input: CamposEditaveisCulto, idPreGerado?: string): Promise<Culto> {
  const id = idPreGerado || generateUUID();
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
