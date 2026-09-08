/**
 * Camada de dados da tabela Logs via Firestore (Fase 4 — ver
 * docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Usada por `storage.ts`.
 *
 * Log é imutável por definição (mesmo comentário em `DATABASE_SCHEMA` no
 * `gasScript.ts`): só insert, nunca update nem delete — nem soft-delete.
 * Diferente das outras tabelas, a leitura já vem limitada aos 50 mais
 * recentes via `orderBy` + `limit` do próprio Firestore, em vez de buscar
 * tudo e cortar no cliente (o que `storage.getLogs()` faz hoje) — evita a
 * coleção crescer sem limite no que é transferido a cada leitura.
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { LogItem } from '../types';
import { generateUUID, quemEstaEditando } from './firestoreUtils';

const COLLECTION = 'logs';
const LIMITE_LOGS = 50;

export async function getLogsFirestore(): Promise<LogItem[]> {
  const q = query(collection(db, COLLECTION), orderBy('Data', 'desc'), limit(LIMITE_LOGS));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LogItem);
}

export async function addLogFirestore(action: string, detail: string, usuario?: string, idPreGerado?: string): Promise<LogItem> {
  const id = idPreGerado || generateUUID();
  const log: LogItem = {
    ID: id,
    Data: new Date().toISOString(),
    Usuario: usuario || quemEstaEditando(),
    Acao: action,
    Registro_Afetado: detail
  };
  await setDoc(doc(db, COLLECTION, id), log);
  return log;
}
