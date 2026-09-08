/**
 * Backup periódico: Firestore → Google Sheets (sentido inverso do
 * scripts/migrar-dados.mjs). Ver docs/PLANO-FASE4-MIGRACAO-FIREBASE.md.
 *
 * Por quê: o Firestore no plano gratuito não tem backup automático nativo
 * (isso só existe no plano pago/Blaze). Em vez de adicionar infraestrutura
 * paga, este script lê tudo do Firestore e sobrescreve a planilha Google
 * (via a ação `replaceAll`, que já existe no Apps Script) — assim, se algo
 * der errado no Firestore, existe pra onde voltar. Roda como tarefa
 * agendada (ver combinação com o usuário sobre a frequência).
 *
 * NÃO apaga nada do Firestore — só lê de lá e escreve na planilha.
 *
 * Uso:
 *   node scripts/exportar-backup-planilha.mjs           # dry-run: só mostra as contagens
 *   node scripts/exportar-backup-planilha.mjs --write   # escreve de verdade na planilha
 *
 * Credenciais (mesma conta já allowlisted no firestore.rules) via variavel
 * de ambiente, nunca hardcoded:
 *   MIGRACAO_EMAIL="..." MIGRACAO_SENHA="..." node scripts/exportar-backup-planilha.mjs --write
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const WRITE = process.argv.includes('--write');

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

// process.env vence se setado na hora (ex.: tarefa agendada com as
// variaveis no ambiente); senao cai pro .env.local (uso manual no dia a dia).
const CONTA_EMAIL = process.env.MIGRACAO_EMAIL || env.MIGRACAO_EMAIL;
const CONTA_SENHA = process.env.MIGRACAO_SENHA || env.MIGRACAO_SENHA;

// Mesmas 8 tabelas que a acao replaceAll do Apps Script espera -- Logs e
// Config ficam de fora de proposito (replaceAll nunca mexeu nelas, ver
// gasScript.ts).
const COLECOES = ['musicas', 'versoes', 'arquivos', 'notas', 'cultos', 'repertorio', 'integrantes', 'historico'];

async function main() {
  console.log(WRITE ? '=== MODO ESCRITA (vai sobrescrever a planilha) ===' : '=== DRY-RUN (nada sera escrito) ===');
  console.log('');

  if (!CONTA_EMAIL || !CONTA_SENHA) {
    throw new Error('Faltam as variaveis de ambiente MIGRACAO_EMAIL e/ou MIGRACAO_SENHA.');
  }

  console.log('1. Autenticando e lendo o Firestore...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInWithEmailAndPassword(auth, CONTA_EMAIL, CONTA_SENHA);

  const payload = {};
  for (const nomeColecao of COLECOES) {
    const snap = await getDocs(collection(db, nomeColecao));
    // replaceAll ignora Excluido_Em -- filtra aqui pra nao "ressuscitar" na
    // planilha um item que foi excluido (soft-delete) no Firestore.
    payload[nomeColecao] = snap.docs
      .map((d) => d.data())
      .filter((item) => !item.Excluido_Em);
  }
  console.log('   OK.');
  console.log('');

  console.log('2. Contagem por tabela:');
  for (const nomeColecao of COLECOES) {
    console.log(`   ${nomeColecao.padEnd(12)} ${payload[nomeColecao].length}`);
  }
  console.log('');

  if (!WRITE) {
    console.log('Dry-run concluido. Rode com --write para atualizar a planilha de verdade.');
    return;
  }

  console.log('3. Enviando pra planilha (acao replaceAll)...');
  const res = await fetch(GAS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'replaceAll', data: payload })
  });
  if (!res.ok) throw new Error(`Apps Script respondeu HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(`Apps Script retornou erro: ${json.message}`);
  console.log('   OK:', json.message);
  console.log('');
  console.log('Backup atualizado na planilha com sucesso.');
}

main()
  .then(() => process.exit(0)) // o SDK do Firestore mantem a conexao aberta -- sem isso, o processo Node nunca termina sozinho.
  .catch((err) => {
    console.error('ERRO:', err.message || err);
    process.exit(1);
  });
