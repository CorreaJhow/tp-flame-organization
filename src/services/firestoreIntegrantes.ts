/**
 * Camada de dados da tabela Integrantes via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts`.
 *
 * E-mail/telefone só ficam legíveis pra quem estiver autenticado e na
 * allowlist da equipe (ver firestore.rules) — diferente de hoje, onde
 * `?action=getAll` no Apps Script expõe isso pra qualquer um com a URL.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Integrante } from '../types';
import { generateUUID, quemEstaEditando, stripUndefined } from './firestoreUtils';

const COLLECTION = 'integrantes';

export async function getIntegrantesFirestore(): Promise<Integrante[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Integrante)
    .filter((i) => !i.Excluido_Em);
}

type CamposEditaveisIntegrante = Pick<Integrante, 'Nome' | 'Funcao' | 'Email' | 'Telefone' | 'Ativo'>;

export async function addIntegranteFirestore(input: CamposEditaveisIntegrante, idPreGerado?: string): Promise<Integrante> {
  const id = idPreGerado || generateUUID();
  const integrante: Integrante = {
    ID: id,
    ...input,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // stripUndefined: Telefone/Ativo são opcionais (ver firestoreUtils.ts).
  // `false` em Ativo é preservado normalmente -- só undefined é removido.
  await setDoc(doc(db, COLLECTION, id), stripUndefined(integrante));
  return integrante;
}

export async function updateIntegranteFirestore(
  id: string,
  changes: Partial<CamposEditaveisIntegrante>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), stripUndefined({
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  }));
}

/** Soft-delete — mesmo motivo de `deleteMusicaFirestore` (ver esse arquivo). */
export async function deleteIntegranteFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
