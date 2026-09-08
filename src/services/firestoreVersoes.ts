/**
 * Camada de dados da tabela Versoes via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts`.
 *
 * `getVersoesFirestore()` traz TODAS as versões, sem filtrar por música —
 * de propósito, espelha `storage.getVersoes()` de hoje. O app já filtra
 * por `ID_Musica` no lado do cliente onde precisa (SongDetailModal,
 * LibraryView, etc.); mudar isso é decisão pra quando essas telas forem
 * de fato religadas ao Firestore, não agora.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Versao } from '../types';
import { generateUUID, quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'versoes';

export async function getVersoesFirestore(): Promise<Versao[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Versao)
    .filter((v) => !v.Excluido_Em);
}

type CamposEditaveisVersao = Pick<
  Versao,
  'ID_Musica' | 'Nome_Versao' | 'Tom' | 'Modo' | 'BPM' | 'Compasso' | 'Letra' | 'Estrutura' | 'Obs'
>;

export async function addVersaoFirestore(input: CamposEditaveisVersao, idPreGerado?: string): Promise<Versao> {
  const id = idPreGerado || generateUUID();
  const versao: Versao = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // stripUndefined: Modo/BPM/Compasso são opcionais em types.ts — quando
  // não preenchidos chegam aqui como `undefined`, valor que o Firestore
  // rejeita gravar (ver firestoreUtils.ts).
  await setDoc(doc(db, COLLECTION, id), stripUndefined(versao));
  return versao;
}

export async function updateVersaoFirestore(
  id: string,
  changes: Partial<CamposEditaveisVersao>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteVersaoFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
