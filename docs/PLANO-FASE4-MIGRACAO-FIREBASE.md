# 🔥 Plano — Fase 4: Migração pra Firebase (Firestore + Auth com Google)

> Planejado em 05/09/2026. **Substitui** o plano do remendo em
> [`PLANO-FASE3-SEGURANCA.md`](./PLANO-FASE3-SEGURANCA.md) — decisão do
> usuário: em vez de remendar o Google Sheets/Apps Script com um proxy,
> migrar direto pro destino final (banco de dados real + login por
> integrante), já que o volume de uso é baixo e reformar duas vezes seria
> trabalho jogado fora. Reabre por decisão explícita a entrada "Google
> Sheets fica como backend" do item 3 do [`ESTADO-ATUAL.md`](./ESTADO-ATUAL.md).
>
> Por que Firebase e não Supabase: Supabase (free) pausa o projeto sozinho
> depois de 7 dias sem consulta ao banco — e reativar exige alguém entrar
> no painel manualmente. Com o padrão de uso desta equipe (picos em
> ensaio/culto, silêncio no meio da semana, possíveis semanas de recesso),
> isso teria uma chance real de acontecer bem na hora que mais importa.
> Firestore (Spark, grátis) não pausa por inatividade. Fonte: pesquisa de
> 05/09/2026 (Automation Atlas, ITPath Solutions, Back4App — ver resposta
> anterior desta conversa).

---

## 1. Por que isso é maior do que parece

Não é só trocar "onde os dados ficam". Muda a peça mais crítica e mais
testada do projeto: `src/services/storage.ts` (1430 linhas) — o motor de
sincronização, fila offline, resolução de conflito e merge que a Fase 1
gastou tanto esforço pra deixar sem perda de dado. A "Regra de Ouro" do
[`CLAUDE.md`](../CLAUDE.md) continua valendo integralmente: **a equipe não
pode ficar na mão no palco.** Esta migração só é aceitável se manter (ou
melhorar) a resiliência offline que já existe — nunca regredir nisso.

**Boa notícia real:** o Firestore tem persistência offline nativa
(cache local em IndexedDB, leitura instantânea mesmo sem rede, fila de
escrita que sincroniza sozinha ao reconectar). Isso é essencialmente o que
`SyncQueue` + `tombstones` + merge manual fazem hoje à mão — só que
mantido pelo Google, testado em escala muito maior que qualquer coisa que
dá pra manter aqui. Bem provável que boa parte do código customizado de
sync **encolha**, não cresça.

## 2. Arquitetura nova

```
Hoje:    App (React) ──fetch──► Apps Script Web App ──► Google Sheets
Depois:  App (React) ──Firebase SDK──► Firestore (com auth do próprio SDK)
                      ──Firebase Auth──► login "Entrar com Google"
```

Sem intermediário próprio nenhum (nem Vercel Function) — o SDK do
Firebase já fala direto e com segurança com o Firestore, e quem decide o
que cada usuário pode ler/escrever são as **Security Rules** do próprio
Firestore, não código do app. Isso é mais simples que o plano da Fase 3
(que ainda exigia manter uma função proxy rodando).

### 2.1 Login: Firebase Authentication + Google Sign-In

- Mesma conta Google que a equipe já usa (não é provedor novo).
- Tela de login: botão único "Entrar com Google" — sem senha nova pra
  ninguém memorizar.
- Lista de quem pode entrar: e-mails da equipe direto nas Security Rules
  (ver 2.3) — editar essa lista é editar um arquivo e publicar, não
  precisa de painel de admin nem de Cloud Function pra essa escala (~9
  pessoas). Se crescer muito, dá pra evoluir pra uma coleção `allowlist`
  no próprio Firestore depois.

### 2.2 Coleções do Firestore (mapeamento direto das tabelas de hoje)

Mantém os MESMOS nomes de campo das interfaces em `src/types.ts` — reduz
o quanto de código de UI/transposição precisa mudar; só a camada de
armazenamento é reescrita.

| Tabela hoje (Sheets) | Coleção no Firestore | Observação |
|---|---|---|
| Musicas | `musicas/{id}` | igual |
| Versoes | `versoes/{id}` | campo `ID_Musica` continua apontando pro doc de `musicas` |
| Arquivos | `arquivos/{id}` | — |
| Notas | `notas/{id}` | — |
| Cultos | `cultos/{id}` | — |
| Repertorio | `repertorio/{id}` | — |
| Integrantes | `integrantes/{id}` | e-mail/telefone só legível por quem estiver logado (ver 2.3) |
| Historico | `historico/{id}` | — |
| Logs | `logs/{id}` | considerar um limite de retenção (hoje já corta em 50 no cliente) |
| Config | documento único `config/geral` | chave-valor vira campos do doc |

`ID` deixa de precisar ser gerado à mão (`generateUUID()`) — pode usar o
próprio ID de documento do Firestore (`doc()` gera um ID único sozinho),
mas não é obrigatório trocar: dá pra manter `generateUUID()` como está e
usá-lo como ID do documento, o que preserva mais código existente.

### 2.3 Security Rules (esboço — é aqui que a proteção de verdade mora)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isTeamMember() {
      return request.auth != null && request.auth.token.email in [
        // TODO: preencher com os e-mails reais da equipe antes de publicar
        'exemplo1@gmail.com',
        'exemplo2@gmail.com'
      ];
    }

    match /{collection}/{docId} {
      allow read, write: if isTeamMember();
    }
  }
}
```

Isso sozinho já resolve o que nem a Fase 3 resolvia por completo: só
quem está autenticado com um e-mail da lista lê ou escreve qualquer coisa
— inclusive um script automatizado rodando `batch`/`delete` em massa,
porque sem estar autenticado como alguém da lista, a regra barra a
escrita antes de qualquer linha ser tocada. Sem essa trava dependender de
nenhum segredo embutido no navegador.

## 3. O que muda no código

| Arquivo | Mudança |
|---|---|
| `src/services/storage.ts` | Reescrito por dentro: mesma interface pública (`getMusicas()`, `addCulto()`, `syncWithGas()` → renomear, etc.) mas trocando `fetch` ao Apps Script pelo SDK do Firestore. UI (componentes) não deveriam precisar mudar, se a interface pública for preservada. |
| `src/services/googleAuth.ts`, `googleSheetsApi.ts` | Aposentados (a integração OAuth direta com Sheets já estava sem uso ativo — Fase 2 item 3). |
| `src/data/gasScript.ts` | Aposentado depois da migração confirmada — o Apps Script deixa de ser necessário. |
| novo: `src/services/firebase.ts` | Inicialização do SDK (`initializeApp`, `getFirestore`, `getAuth`). |
| novo: `src/components/LoginScreen.tsx` | Tela/gate de login antes do app carregar, se não autenticado. |
| `src/App.tsx` | Envolve a árvore com verificação de auth (`onAuthStateChanged`). |
| `docs/ARQUITETURA-DADOS.md` | Reescrever a seção do motor de sync pra refletir a arquitetura nova (documento vivo, precisa acompanhar). |

## 4. Passo a passo de execução

### Fase A — Fundação (baixo risco, não toca no app em produção)
1. Criar o projeto no [Firebase Console](https://console.firebase.google.com)
   (mesma conta Google da equipe).
2. Ativar **Firestore Database** (modo produção, região `southamerica-east1`
   pra menor latência no Brasil).
3. Ativar **Authentication** → provedor **Google**.
4. Escrever as Security Rules (2.3) com os e-mails reais da equipe.
5. Instalar o SDK no repo: `npm install firebase`.
6. Config do Firebase como variáveis de ambiente na Vercel (`VITE_FIREBASE_*`
   — essas SIM podem ser `VITE_` porque a config pública do Firebase não é
   segredo; quem protege os dados são as Security Rules, não a config).

Tudo isso roda em paralelo ao app atual, sem desligar nada.

### Fase B — Camada de dados nova, em paralelo
7. Escrever `firebase.ts` + a nova versão de `storage.ts` (ou um arquivo
   novo, trocado no final) implementando a mesma interface pública de hoje.
8. Escrever um script de migração **uma vez só** (`scripts/migrar-dados.js`,
   Node com `firebase-admin`): lê `?action=getAll` do Apps Script (fonte
   atual, intacta) e escreve cada linha como documento no Firestore,
   preservando IDs. **Não apaga nada do Sheets** — o Sheets continua vivo
   como cópia de segurança durante toda a transição.
9. Testar a suíte (`npm test`) adaptada pra a nova camada.

### Fase C — Validação isolada
10. Testar em uma URL de Preview Deployment da Vercel (branch separada,
    não `main`) — login com Google, criar/editar/apagar música de teste,
    testar modo offline (desligar a rede no DevTools e confirmar que o
    Modo Palco continua abrindo cifra salva).
11. Convidar 1-2 pessoas da equipe pra testar nessa URL de preview antes
    de qualquer coisa ir pra produção.

### Fase D — Corte (fora de janela de ensaio/culto, como da última vez)
12. Merge pra `main` → Vercel publica em produção.
13. Acompanhar ao vivo com a equipe na primeira sincronização real.
14. Manter o Apps Script/planilha viva (só leitura, sem uso) por um tempo
    de segurança antes de desligar de vez — é o "cabo de emergência".

## 5. Estimativa honesta

Isso é trabalho de **múltiplas sessões**, não uma tarde. A Fase A é rápida
(menos de uma hora). A Fase B é a mais trabalhosa — reescrever o motor de
sync com o mesmo cuidado que a Fase 1 teve. Vale ir por partes, testando
cada tabela/fluxo antes de seguir pra próxima, em vez de tentar migrar tudo
de uma vez.

## 6. Primeiro passo concreto — pra fazer agora

A Fase A, passo 1 a 4, é 100% segura (não toca no app real) e é o único
pedaço que **precisa ser você** (criação de conta/projeto exige login no
Console do Firebase, não é algo que eu faço por você). Depois disso, o
resto (código) eu escrevo.

**Passo a passo pra você fazer agora, uns 10 minutos:**

1. Acesse **console.firebase.google.com**, entre com a mesma conta Google
   usada no projeto do Apps Script (mais simples pra manter tudo numa
   organização só).
2. **Adicionar projeto** → nome sugerido: `tp-flame` → pode desativar o
   Google Analytics (não precisa pra este projeto).
3. No menu lateral: **Firestore Database** → **Criar banco de dados** →
   modo **produção** → região **`southamerica-east1` (São Paulo)**.
4. Menu lateral: **Authentication** → **Get started** → aba **Sign-in
   method** → ativar **Google**.
5. Me manda os e-mails do Google de cada integrante da equipe (os que
   devem ter permissão de usar o app) — é o que vai entrar nas Security
   Rules do passo 2.3.

Quando isso estiver pronto, volta aqui que eu escrevo o `firebase.ts`, as
Security Rules com a lista real, e começamos a Fase B com calma.
