/**
 * Utilitários compartilhados pelas camadas de dados do Firestore
 * (Fase 4 — ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md). Um arquivo por
 * tabela (`firestoreMusicas.ts`, `firestoreVersoes.ts`, ...) reaproveita
 * isto em vez de duplicar.
 */
import { auth } from './firebase';

/**
 * Movido de `storage.ts` pra cá (05/09/2026) — evita dependência circular
 * agora que `storage.ts` importa das camadas `firestoreXxx.ts`, que por sua
 * vez precisam gerar ID de documento. `storage.ts` reexporta esta função
 * (`export { generateUUID }`) pra quem ainda importa de lá continuar
 * funcionando sem mudar nada.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * O Firestore REJEITA gravar um campo com valor `undefined` (erro em tempo
 * de execução, não um aviso) — diferente do Google Sheets, que só deixava
 * a célula em branco. Campos opcionais das interfaces em `types.ts` (ex.:
 * `Versao.Modo`, `Versao.BPM`) viram `undefined` quando não preenchidos, e
 * `setDoc`/`updateDoc` quebrariam sem isto. Remove a chave inteira em vez
 * de gravar `null` — mantém o documento mais limpo (sem campo = "não
 * definido", igual ao comportamento de hoje).
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

/**
 * Identifica quem fez a alteração a partir do login de verdade (Firebase
 * Auth) — substitui o antigo `getActiveMember()` (um seletor manual, sem
 * garantia nenhuma de que era a pessoa real). Cai pro e-mail se não houver
 * nome de exibição (comum em contas de e-mail/senha recém-criadas).
 */
export function quemEstaEditando(): string {
  const u = auth.currentUser;
  if (!u) return 'Usuário desconhecido';
  return u.displayName || u.email || u.uid;
}
