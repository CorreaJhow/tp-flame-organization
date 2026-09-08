/**
 * Camada de dados da tabela Musicas via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts`, que
 * mantém um cache em memória atualizado por `onSnapshot` e chama as funções
 * daqui pra escrever.
 *
 * Mesmos nomes de campo de `Musica` em `src/types.ts` — os componentes de
 * UI que leem `musica.Nome`, `musica.Artista` etc. não precisaram mudar.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Musica } from '../types';
import { generateUUID, quemEstaEditando } from './firestoreUtils';

const COLLECTION = 'musicas';

export async function getMusicasFirestore(): Promise<Musica[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as Musica)
    .filter((m) => !m.Excluido_Em); // soft-delete: excluído não aparece, mas não some do banco
}

export async function addMusicaFirestore(
  input: Pick<Musica, 'Nome' | 'Artista' | 'Categoria'>,
  idPreGerado?: string
): Promise<Musica> {
  const id = idPreGerado || generateUUID();
  const musica: Musica = {
    ID: id,
    Nome: input.Nome.trim(),
    Artista: input.Artista.trim(),
    Categoria: input.Categoria,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  };
  // setDoc (não addDoc): ID gerado no cliente, igual ao padrão de hoje —
  // deixa o merge/offline mais simples de prever do que deixar o Firestore
  // sortear o ID do documento.
  await setDoc(doc(db, COLLECTION, id), musica);
  return musica;
}

export async function updateMusicaFirestore(
  id: string,
  changes: Partial<Pick<Musica, 'Nome' | 'Artista' | 'Categoria'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...changes,
    Atualizado_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}

/**
 * Exclusão reversível (soft-delete via `Excluido_Em`), ao contrário do
 * `sheet.deleteRow()` de hoje no Apps Script — que apaga de vez e foi
 * exatamente o mecanismo usado pra descrever o pior cenário de segurança
 * nesta migração inteira. Um item excluído fica no banco (não aparece em
 * `getMusicasFirestore()`, que filtra por `Excluido_Em`), então dá pra
 * restaurar sem precisar de backup pra um "oops" comum do dia a dia.
 */
export async function deleteMusicaFirestore(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    Excluido_Em: new Date().toISOString(),
    Atualizado_Por: quemEstaEditando()
  });
}
