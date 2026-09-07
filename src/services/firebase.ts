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
import { getFirestore } from 'firebase/firestore';
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

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
