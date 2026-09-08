/**
 * Camada de dados da tabela Arquivos via Firestore (Fase 4 — ver
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
import { Arquivo } from '../types';
import { generateUUID, quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'arquivos';

export async function getArquivosFirestore(): Promise<Arquivo[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Arquivo)
    .filter((a) => !a.Excluido_Em);
}

type CamposEditaveisArquivo = Pick<Arquivo, 'ID_Versao' | 'Tipo' | 'URL' | 'Nome'>;

export async function addArquivoFirestore(input: CamposEditaveisArquivo, idPreGerado?: string): Promise<Arquivo> {
  const id = idPreGerado || generateUUID();
  const arquivo: Arquivo = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // stripUndefined: `Nome` é opcional em types.ts (ver firestoreUtils.ts).
  await setDoc(doc(db, COLLECTION, id), stripUndefined(arquivo));
  return arquivo;
}

export async function updateArquivoFirestore(
  id: string,
  changes: Partial<CamposEditaveisArquivo>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteArquivoFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
