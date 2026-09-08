/**
 * Migração única: Google Sheets (via Apps Script) → Firestore.
 * Ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md, Fase B item 8.
 *
 * NÃO apaga nada da planilha — só lê de lá (?action=getAll, GET, sem
 * efeito colateral) e escreve no Firestore, preservando o ID de cada linha
 * como ID do documento (mesmo padrão que o resto do app já usa).
 *
 * Autentica com a conta de teste (e-mail/senha) que já está na allowlist
 * das Security Rules — evita precisar de uma chave de service account do
 * Firebase Admin SDK (um segredo bem mais sensível, desnecessário aqui).
 *
 * Uso:
 *   node scripts/migrar-dados.mjs           # dry-run: só mostra o que seria migrado
 *   node scripts/migrar-dados.mjs --write   # escreve de verdade no Firestore
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const WRITE = process.argv.includes('--write');

// --- Config do Firebase (mesmos valores publicos de .env.local) ---
function lerEnvLocal() {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const out = {};
  for (const linha of raw.split('\n')) {
    const m = linha.match(/^([A-Z_]+)=(?:"([^"]*)"|(.*))$/);
    if (m) out[m[1]] = m[2] ?? m[3] ?? '';
  }
  return out;
}
const env = lerEnvLocal();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzXHtLDcy3pJFiyg7jPlO1a4twVVxpWigeiio8paO2VWbEu0hzcFiLp60E3kPqbIcu6/exec';

// Credenciais de uma conta ja allowlisted (ver firestore.rules), so pra
// autenticar este script -- NUNCA hardcoded aqui (o arquivo e commitado
// num repositorio publico). Passe via variavel de ambiente na hora de
// rodar, por exemplo:
//   MIGRACAO_EMAIL="..." MIGRACAO_SENHA="..." node scripts/migrar-dados.mjs --write
const CONTA_MIGRACAO_EMAIL = process.env.MIGRACAO_EMAIL;
const CONTA_MIGRACAO_SENHA = process.env.MIGRACAO_SENHA;

function stripUndefined(obj) {
  const out = {};
  for (const k in obj) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// Mapeia a chave que ?action=getAll devolve pra (coleção no Firestore, singular pra log)
const TABELAS = [
  { chave: 'musicas', colecao: 'musicas', nome: 'Musicas' },
  { chave: 'versoes', colecao: 'versoes', nome: 'Versoes' },
  { chave: 'arquivos', colecao: 'arquivos', nome: 'Arquivos' },
  { chave: 'notas', colecao: 'notas', nome: 'Notas' },
  { chave: 'cultos', colecao: 'cultos', nome: 'Cultos' },
  { chave: 'repertorio', colecao: 'repertorio', nome: 'Repertorio' },
  { chave: 'integrantes', colecao: 'integrantes', nome: 'Integrantes' },
  { chave: 'historico', colecao: 'historico', nome: 'Historico' },
  { chave: 'logs', colecao: 'logs', nome: 'Logs' }
];

async function main() {
  console.log(WRITE ? '=== MODO ESCRITA (vai gravar no Firestore) ===' : '=== DRY-RUN (nada sera gravado) ===');
  console.log('');

  if (WRITE && (!CONTA_MIGRACAO_EMAIL || !CONTA_MIGRACAO_SENHA)) {
    throw new Error(
      'Faltam as variaveis de ambiente MIGRACAO_EMAIL e/ou MIGRACAO_SENHA ' +
      '(credenciais de uma conta ja allowlisted no firestore.rules). Ver comentario no topo deste arquivo.'
    );
  }

  console.log('1. Buscando dados da planilha via Apps Script...');
  const res = await fetch(`${GAS_ENDPOINT}?action=getAll`);
  if (!res.ok) throw new Error(`Apps Script respondeu HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(`Apps Script retornou erro: ${json.message}`);
  const dados = json.data;
  console.log('   OK.');
  console.log('');

  console.log('2. Contagem por tabela:');
  for (const t of TABELAS) {
    const linhas = Array.isArray(dados[t.chave]) ? dados[t.chave] : [];
    console.log(`   ${t.nome.padEnd(12)} ${linhas.length}`);
  }
  console.log('');

  const integrantes = Array.isArray(dados.integrantes) ? dados.integrantes : [];
  console.log('3. E-mails de integrantes encontrados (conferir antes de liberar acesso):');
  integrantes.forEach((i) => console.log(`   - ${i.Nome || '(sem nome)'}: ${i.Email || '(sem e-mail)'}`));
  console.log('');

  if (!WRITE) {
    console.log('Dry-run concluido. Rode com --write para gravar de verdade no Firestore.');
    return;
  }

  console.log('4. Autenticando no Firebase...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInWithEmailAndPassword(auth, CONTA_MIGRACAO_EMAIL, CONTA_MIGRACAO_SENHA);
  console.log('   OK.');
  console.log('');

  console.log('5. Gravando no Firestore...');
  for (const t of TABELAS) {
    const linhas = Array.isArray(dados[t.chave]) ? dados[t.chave] : [];
    let gravados = 0;
    for (const linha of linhas) {
      if (!linha || !linha.ID) continue; // Logs as vezes vem sem ID em linhas antigas -- pula
      await setDoc(doc(db, t.colecao, String(linha.ID)), stripUndefined(linha));
      gravados++;
    }
    console.log(`   ${t.nome.padEnd(12)} ${gravados} documento(s) gravado(s)`);
  }
  console.log('');
  console.log('Migracao concluida. A planilha continua intacta (nada foi apagado de la).');
}

main().catch((err) => {
  console.error('ERRO:', err.message || err);
  process.exit(1);
});
