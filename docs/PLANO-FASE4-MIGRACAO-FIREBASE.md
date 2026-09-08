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

### 2.1 Login: dois métodos, decisão do usuário em 05/09/2026

- **Entrar com Google** — sem senha nova pra ninguém memorizar, mesma
  conta que a equipe já usa.
- **E-mail + senha** — pra quem preferir não passar pelo fluxo do Google
  (ex.: dispositivo compartilhado, ou simplesmente preferência pessoal).
  E-mail é obrigatório como identificador (não tem "nome de usuário"
  solto sem e-mail por trás) — é o mesmo e-mail que entra na lista das
  Security Rules, então os dois métodos caem na mesma verificação.
- Tela de login mostra os dois: botão "Entrar com Google" + formulário de
  e-mail/senha (com opção de criar conta na primeira vez).
- **Exigência de segurança obrigatória pro método de senha:** confirmação
  de e-mail (Firebase Auth `sendEmailVerification`). Sem isso, alguém
  poderia criar uma conta de senha usando o e-mail de outra pessoa da
  lista antes dela mesma criar a conta, e entrar se passando por ela — a
  lista de e-mail sozinha não detecta isso. As Security Rules (2.3) checam
  `email_verified == true`, que já vem sempre verdadeiro no login por
  Google e só fica verdadeiro no login por senha depois do clique no link
  de confirmação.
- Lista de quem pode entrar: e-mails da equipe direto nas Security Rules
  (ver 2.3) — editar essa lista é editar um arquivo e publicar, não
  precisa de painel de admin nem de Cloud Function pra essa escala (~9
  pessoas). Se crescer muito, dá pra evoluir pra uma coleção `allowlist`
  no próprio Firestore depois.
- No Firebase Console, ativar os dois provedores em Authentication >
  Sign-in method: **Google** (já feito) e **E-mail/senha**.

### 2.2 Coleções do Firestore (mapeamento direto das tabelas de hoje)

Mantém os MESMOS nomes de campo das interfaces em `src/types.ts` — reduz
o quanto de código de UI/transposição precisa mudar; só a camada de
armazenamento é reescrita.

| Tabela hoje (Sheets) | Coleção no Firestore | Status | Observação |
|---|---|---|---|
| Musicas | `musicas/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreMusicas.ts` — CRUD + soft-delete confirmados |
| Versoes | `versoes/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreVersoes.ts` — inclui `stripUndefined()` (ver `firestoreUtils.ts`) pros campos opcionais Modo/BPM/Compasso |
| Arquivos | `arquivos/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreArquivos.ts` — `Nome` opcional via `stripUndefined()` |
| Notas | `notas/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreNotas.ts` — Autor/Titulo/TipoNota opcionais |
| Cultos | `cultos/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreCultos.ts` — Observacoes opcional |
| Repertorio | `repertorio/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreRepertorio.ts` — Dirigente/Observacao_Culto opcionais |
| Integrantes | `integrantes/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreIntegrantes.ts` — testado `Ativo=false` (falsy, precisa sobreviver ao `stripUndefined`); e-mail/telefone só legível por quem estiver logado (ver 2.3) |
| Historico | `historico/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreHistorico.ts` — sem update (só insert/delete, espelha storage.ts) |
| Logs | `logs/{id}` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreLogs.ts` — leitura via `orderBy`+`limit(50)` nativo do Firestore; imutável (só insert) |
| Config | documento único `config/geral` | ✅ feito, testado ao vivo (05/09) | `src/services/firestoreConfig.ts` — vestigial no app real hoje (nenhuma tela usa `ConfigItem`), implementado fiel ao desenho mesmo assim |

**Todas as 10 tabelas têm camada Firestore isolada e testada (05/09/2026).** Nenhuma delas está ligada ao app real ainda — ver Fase C/D (seção 4) pro corte de verdade.

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
      return request.auth != null
        && request.auth.token.email_verified == true
        && request.auth.token.email in [
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

(Versão real, com o esboço já implementado, fica em `firestore.rules` na
raiz do projeto — **git-ignorado de propósito**, porque contém e-mails
pessoais da equipe e o repositório é público. `firestore.rules.example`,
esse sim commitado, tem o mesmo modelo sem dado real.)

Isso sozinho já resolve o que nem a Fase 3 resolvia por completo: só
quem está autenticado com um e-mail da lista lê ou escreve qualquer coisa
— inclusive um script automatizado rodando `batch`/`delete` em massa,
porque sem estar autenticado como alguém da lista, a regra barra a
escrita antes de qualquer linha ser tocada. Sem essa trava dependender de
nenhum segredo embutido no navegador.

> ⚠️ **Estado atual das regras em produção no Firebase (05/09/2026):**
> por decisão do usuário, temporariamente **sem** o check de
> `email_verified` e com um e-mail de teste extra na lista — facilita
> testar cada tabela nova sem atrito, aceitável porque este banco ainda
> não tem dado real (o app de produção continua 100% no Google Sheets).
> **Antes de migrar dado real pra cá (Fase D, seção 4)**, republicar a
> versão final: `email_verified == true` de volta, e-mail de teste fora.

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

## 3.1 Consequências observadas na Fase B (08/09/2026)

- **Bundle de produção cresceu de 558KB pra 1.168KB** (`npm run build`).
  Esperado, não é regressão: o SDK do Firebase (Firestore + Auth) já estava
  instalado desde a Fase A mas tree-shaken por não ser usado ainda — agora
  é usado em todo o app (login é obrigatório pra abrir), então entra no
  bundle principal de verdade. Vale revisitar depois (isolar Auth num chunk
  próprio?), mas não bloqueia esta fase.
- **`googleAuth.ts`, `googleSheetsApi.ts`, `gasScript.ts` ficaram órfãos**
  (nada mais importa deles), mas foram **mantidos no repositório de
  propósito** — servem de referência/rollback caso algo dê errado antes da
  Fase D estar validada de verdade em produção. Limpar isso é tarefa pra
  depois que o Firestore estiver estável há um tempo, não agora.
- **Restrição pra Fase C:** a versão atual das Security Rules em produção
  está temporariamente sem o `email_verified` e com um e-mail de teste
  extra (ver seção 2.3) — precisa voltar pra versão final **antes** de
  migrar dado real (Fase D), não antes da Fase C (que ainda usa dado de
  teste).

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
7. ✅ **Feito (08/09/2026).** `storage.ts` reescrito por completo — mesma
   interface pública que a UI já usava (`getMusicas()`, `addCulto()`,
   `deleteMusica()`, ...), agora com cache em memória por tabela mantido
   por listeners em tempo real (`onSnapshot`) e escrita otimista local +
   Firestore em paralelo. Fila manual, tombstones e merge de três vias
   foram removidos por completo (decisão já registrada: padrão do
   Firestore resolve isso sozinho). `App.tsx` ganhou o gate de login de
   verdade (`AuthGate`/`LoginScreen`), `AdminView` perdeu os campos de
   endpoint/GAS (decisão do usuário), e três telas que ficaram órfãs nessa
   troca foram removidas: `MemberProfileModal.tsx` (seletor manual "quem
   sou eu", substituído pelo login real), `InitialSyncOverlay.tsx` e
   `GoogleWorkspaceModal.tsx`/`GasSetupModal.tsx` (config de backend que
   não existe mais). Testado ao vivo, ponta a ponta, contra o Firestore
   real: Músicas, Cultos, Integrantes, Admin (conta conectada, verificar
   conexão, logout) — tudo sem erro de console. Um bug real foi pego e
   corrigido em revisão antes do teste (cascata de exclusão calculava os
   IDs órfãos *depois* de já ter filtrado o array local, sempre voltando
   vazio) — coberto agora por teste automatizado dedicado.
8. ✅ **Feito (08/09/2026).** `scripts/migrar-dados.mjs` — busca tudo via
   `?action=getAll` do Apps Script (só leitura, planilha nunca tocada) e
   grava no Firestore preservando IDs. Modo `--write` só grava depois de um
   dry-run mostrando as contagens. Credenciais da conta usada pra
   autenticar o script vêm de variável de ambiente
   (`MIGRACAO_EMAIL`/`MIGRACAO_SENHA`), nunca hardcoded — o arquivo é
   commitado num repositório público. Rodado ao vivo: 5 músicas, 5
   versões, 5 arquivos, 2 cultos, 3 itens de repertório, 9 integrantes, 206
   logs migrados. **Achado:** nenhum integrante tem e-mail cadastrado na
   planilha (`Email` vazio pros 9) — a lista de permissão das Security
   Rules continua precisando ser completada manualmente, não dá pra
   derivar dos dados migrados.
9. ✅ **Feito.** Suíte de testes adaptada pra nova camada (mocks do
   Firestore, sem tocar rede real) — 27 testes, `npm run lint` e
   `npm run build` limpos.

### Fase C + D — Na prática, aconteceram juntas e direto em produção

O plano original previa testar numa Preview Deployment separada antes de
ir pra `main`. Na prática, seguimos o padrão que este projeto já usa desde
sempre (commit direto em `main`, deploy automático) — cada etapa da Fase B
foi testada ao vivo, mas em `main`/produção, não numa branch separada. Isso
quase causou um incidente: o primeiro push do `storage.ts` novo foi pro ar
sem as variáveis `VITE_FIREBASE_*` configuradas na Vercel, deixando o site
com tela branca por um tempo até percebermos e corrigirmos. Registrado
aqui pra não repetir — da próxima vez que uma mudança exigir variável de
ambiente nova, ela entra na Vercel **antes** do push que passa a depender
dela, não depois.

O que efetivamente aconteceu, em ordem:
12. ✅ Variáveis `VITE_FIREBASE_*` configuradas na Vercel (Production) —
    precisou refazer uma vez porque a primeira tentativa tirou o prefixo
    `VITE_` achando que era mais seguro (não é — ver decisão registrada na
    seção 2.1; sem o prefixo o Vite nem expõe a variável pro app).
13. ✅ Domínio `tp-flame-organization.vercel.app` adicionado aos
    "Authorized domains" do Firebase Authentication — sem isso o login com
    Google falhava silenciosamente (só funcionava via `localhost`, nunca
    testado no domínio real até aqui).
14. ✅ Tela de bloqueio (`AccessBlockedScreen`) adicionada depois de testar
    ao vivo com uma conta real (`tpflamemusic@gmail.com`) fora da
    allowlist — login funcionava, app abria vazio, sem explicar por quê.
15. ✅ Migração de dados (item 8 acima) rodada contra produção, confirmada
    ao vivo — o Dashboard já mostra "Evento Colheita" e o repertório real.
16. **Pendente:** completar a allowlist com o e-mail de cada integrante da
    equipe (ver achado no item 8 — não veio da planilha).
17. **Pendente:** restaurar `email_verified == true` nas Security Rules
    (removido temporariamente pra facilitar os testes da Fase B, ver seção
    2.3) — fazer só depois que a allowlist estiver completa e estável, pra
    não travar ninguém no meio do processo.
18. ✅ **Feito (08/09/2026) — backup periódico decidido e implementado.**
    O Firestore no plano gratuito (Spark) não tem backup automático nativo
    (só existe no plano pago/Blaze) — decisão do usuário: em vez de add
    infraestrutura paga, reaproveitar a planilha como espelho de backup,
    atualizado periodicamente em vez de ficar como uma foto parada do dia
    da migração. `scripts/exportar-backup-planilha.mjs` lê tudo do
    Firestore (filtrando soft-deletes) e sobrescreve a planilha via a ação
    `replaceAll` já existente no Apps Script — mesmo sentido inverso do
    script de migração. Credenciais em `.env.local` (git-ignorado), com
    fallback pra variável de ambiente se preferir passar na hora. Rodado
    manualmente uma vez em 08/09 pra atualizar a planilha (estava com foto
    de 04/09). **Falta:** decidir a frequência da tarefa agendada
    (semanal? após cada culto?) e configurar de fato — ver conversa com o
    usuário.

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
