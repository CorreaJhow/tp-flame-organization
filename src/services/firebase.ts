/**
 * Inicialização do Firebase (Fase 4 — ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md).
 *
 * A config abaixo NÃO é segredo — é a "identidade pública" do projeto
 * Firebase, o mesmo tipo de coisa que qualquer visitante já veria no
 * DevTools. Quem protege os dados de verdade são as Security Rules do
 * Firestore (ver firestore.rules na raiz do projeto), não esconder isto.
 * Por isso pode ficar em variáveis `VITE_*` sem problema — ao contrário do
 * token do Apps Script (Fase 3, revertida), que tentava esconder algo que
 * o navegador nunca conseguiria manter em segredo.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Evita reinicializar em hot-reload do Vite durante o desenvolvimento.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Cache local persistente (IndexedDB) com suporte a múltiplas abas — é o
 * que dá ao Firestore a mesma garantia offline que a `SyncQueue` manual faz
 * hoje à mão: leitura instantânea do que já foi sincronizado antes, mesmo
 * sem rede, e fila de escrita que sobe sozinha ao reconectar. Precisa vir
 * de `initializeFirestore` (não `getFirestore`) pra poder configurar isso;
 * por isso não dá pra chamar `initializeFirestore` mais de uma vez por app
 * — daí o guard de hot-reload acima também proteger este módulo.
 */
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
