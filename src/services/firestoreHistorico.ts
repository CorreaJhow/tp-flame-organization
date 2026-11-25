/**
 * Camada de dados da tabela Historico via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts`
 * (registro manual de execução na ficha da música).
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { HistoricoItem } from '../types';
import { generateUUID, quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'historico';

export async function getHistoricoFirestore(): Promise<HistoricoItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as HistoricoItem)
    .filter((h) => !h.Excluido_Em);
}

type CamposEditaveisHistorico = Pick<
  HistoricoItem,
  'ID_Versao' | 'ID_Culto' | 'Data_Execucao' | 'Tom_Tocado' | 'Evento' | 'Obs'
>;

export async function addHistoricoItemFirestore(
  input: CamposEditaveisHistorico,
  idPreGerado?: string
): Promise<HistoricoItem> {
  const id = idPreGerado || generateUUID();
  const item: HistoricoItem = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  await setDoc(doc(db, COLLECTION, id), stripUndefined(item));
  return item;
}

export async function updateHistoricoItemFirestore(
  id: string,
  changes: Partial<CamposEditaveisHistorico>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteHistoricoItemFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
