/**
 * Camada de dados da tabela Historico via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts` (só
 * leitura — nenhuma tela do app cria/edita histórico ainda hoje). Sem
 * campos opcionais nesta tabela, então sem necessidade de `stripUndefined`.
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
import { generateUUID, quemEstaEditando } from './firestoreUtils';

const COLLECTION = 'historico';

export async function getHistoricoFirestore(): Promise<HistoricoItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as HistoricoItem)
    .filter((h) => !h.Excluido_Em);
}

type CamposEditaveisHistorico = Pick<HistoricoItem, 'ID_Versao' | 'ID_Culto' | 'Data_Execucao'>;

export async function addHistoricoItemFirestore(
  input: CamposEditaveisHistorico
): Promise<HistoricoItem> {
  const id = generateUUID();
  const item: HistoricoItem = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  await setDoc(doc(db, COLLECTION, id), item);
  return item;
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteHistoricoItemFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
