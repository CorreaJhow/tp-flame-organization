# 🗄️ Arquitetura da Camada de Dados — TP Flame

> Mapa técnico de como o app conversa com o Google Sheets.
> Documento de referência para qualquer alteração em `src/services/storage.ts`,
> `src/services/googleSheetsApi.ts` ou `src/data/gasScript.ts`.
>
> Última auditoria: 20/08/2026. Correções da Fase 1 aplicadas.

---

## 1. Visão geral

O TP Flame não tem servidor próprio. O "banco de dados" é uma planilha Google com 10 abas,
e o app roda inteiramente no navegador. Isso significa que **toda a lógica de banco de dados
— transação, concorrência, conflito, integridade — está no cliente**. Não existe nada do
outro lado garantindo consistência.

```
┌──────────────────────────────────────────────┐
│  React (browser / PWA)                       │
│                                              │
│   componentes ──► storage (StorageService)   │  ← única porta de entrada
│                       │                      │
│              ┌────────┴────────┐             │
│              ▼                 ▼             │
│      localStorage        SyncQueue           │
│    (fonte de leitura)   (mutações pendentes) │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
  CAMINHO A         CAMINHO B
  Sheets API v4     Apps Script Web App
  (precisa OAuth)   (público, sem login)
       │                │
       └───────┬────────┘
               ▼
      Planilha Google (10 abas)
```

### Regra de ouro
`localStorage` é a fonte de leitura da UI. A planilha é a fonte de verdade compartilhada.
A `SyncQueue` é a **única** coisa que protege um dado local de ser apagado por um pull.
Se um registro sai da fila antes de estar confirmado na planilha, ele fica órfão e o
próximo `syncWithGas()` o apaga do dispositivo.

---

## 2. As 10 tabelas

| Aba | Colunas | Chave estrangeira |
|---|---|---|
| `Config` | Chave, Valor, Descricao | — (sem coluna ID) |
| `Musicas` | ID, Nome, Artista, Categoria | — |
| `Versoes` | ID, ID_Musica, Nome_Versao, Tom, BPM, Compasso, Letra, Estrutura, Obs | → Musicas |
| `Arquivos` | ID, ID_Versao, Tipo, URL, Nome | → Versoes |
| `Notas` | ID, ID_Versao, Instrumento, Observacao | → Versoes |
| `Cultos` | ID, Data, Nome_Evento, Status, Observacoes | — |
| `Repertorio` | ID, ID_Culto, ID_Versao, Ordem, Dirigente, Observacao_Culto | → Cultos, Versoes |
| `Integrantes` | ID, Nome, Funcao, Email, Telefone, Ativo | — |
| `Historico` | ID, ID_Versao, ID_Culto, Data_Execucao | → Versoes, Cultos |
| `Logs` | ID, Data, Usuario, Acao, Registro_Afetado | — |

O esquema está declarado em **três lugares que precisam ficar em sincronia**:

- `src/types.ts` — tipos TypeScript
- `src/services/googleSheetsApi.ts` → `SHEET_SCHEMAS` — caminho OAuth
- `src/data/gasScript.ts` → `DATABASE_SCHEMA` — caminho Apps Script

⚠️ Campos que existem em `types.ts` mas **não** existem no esquema da planilha são
silenciosamente descartados na sincronização: `Nota.Autor`, `Nota.Titulo`,
`Nota.TipoNota`, `Integrante.PIN`. Ou seja, anotações vocais e cifras personalizadas
sobrevivem no celular de quem criou, mas **não chegam nos outros dispositivos**.

---

## 3. Os dois caminhos de escrita

`storage.getActiveSyncMode()` escolhe o caminho:

### Caminho A — Google Sheets API v4 (direto)
Ativo quando existe token OAuth em memória **e** um Spreadsheet ID válido.

- `insert` → **upsert**: procura o ID; existe, sobrescreve; não existe, anexa
- `update` → mesmo caminho do insert
- `delete` → `batchUpdate` + `deleteDimension`, remove a linha de verdade
- leitura → `values:batchGet` usando o nome da aba como range (sem teto de linhas)
- escrita → `valueInputOption: RAW`, para a planilha não reinterpretar cifras

Características: rápido, resposta legível, mas o token vem do
`GoogleAuthProvider.credentialFromResult()` do Firebase, **vale 1 hora e nunca é
renovado**. Depois disso o app cai silenciosamente para o Caminho B.

### Caminho B — Apps Script Web App (fallback público)
Endpoint fixo no bundle, sem login. É o caminho que a banda inteira usa hoje.

- leitura → `GET ?action=getAll` (devolve as 10 abas de uma vez, sem limite de linhas)
- escrita → `POST` com `{action, table, data}`
- `insert` no GAS é **upsert** (procura o ID antes de inserir) — diferente do Caminho A
- `delete` no GAS é `deleteRow()` de verdade — diferente do Caminho A

Desde a Fase 1 os dois caminhos têm a **mesma semântica**: `insert` é upsert e `delete`
remove a linha. O resultado na planilha não depende mais de o usuário estar logado.

⚠️ O script publicado **não é o mesmo** que está em `src/data/gasScript.ts`. Um `POST`
sem corpo devolve `TypeError: Cannot read properties of undefined (reading 'contents')`,
erro que a guarda presente no arquivo do repo já preveniria. Existe drift entre repo e
produção, e não há processo de deploy versionado.

---

## 4. O ciclo de sincronização (`syncWithGas`)

```
1. drena a SyncQueue     → flushQueue(): envia cada item pendente e só o
                           REMOVE mediante status: success lido do servidor.
                           Falhou? Fica na fila, com attempts incrementado.
2. pull                  → lê as 10 abas
3. merge por tabela      → mergeCollections(local, remoto, fila)
4. grava no localStorage
```

### `mergeCollections` — a função mais perigosa do projeto

```ts
resultado = (registros remotos, exceto tombstones e deletes pendentes)
          + (registros na fila de sync com insert/update)
```

Leia de novo: **tudo que é local mas não está no remoto e não está na fila é apagado.**
Esse é o comportamento desejado — é assim que uma exclusão feita por outro integrante
chega até você.

Duas travas evitam que isso vire perda de dado: um item só sai da fila com confirmação
real do servidor, e o merge é **abortado** para qualquer tabela cujo remoto volte vazio
enquanto existe dado local (registrado como `SYNC_MERGE_SKIPPED` nos logs locais).

`Historico` e `Logs` **não passam pelo merge** — são substituídos direto pelo remoto
(`setDirect`), ignorando a fila. Qualquer histórico ainda não sincronizado é perdido.

### Invariantes que precisam valer

1. Um item só sai da fila com **confirmação lida do servidor**. Escrita cega nunca conta como sucesso.
2. Uma mutação é enviada **uma única vez** — pela fila, e só por ela.
3. Um pull que devolve tabela vazia enquanto existe dado local **não pode** ser tratado como "o outro apagou tudo".
4. O que é gravado na planilha precisa voltar idêntico na leitura (sem coerção de tipo).
5. Toda escrita concorrente no Apps Script precisa de `LockService`.

As cinco passaram a valer na Fase 1, e cada uma tem teste correspondente em
`src/__tests__/storage.test.ts`, bloco *"3. Invariantes do motor de sincronização"*.
Se um desses testes falhar, a regressão é de perda de cifra — trate como tal.

---

## 5. Tombstones

`tp_flame_tombstones_v1` guarda IDs excluídos localmente, para que o pull seguinte não
ressuscite o registro antes da exclusão chegar na planilha.

Limitações: nunca expiram, são por dispositivo, e crescem para sempre. Se um ID voltar
para a planilha depois (restauração de backup, por exemplo), o dispositivo que tem o
tombstone vai filtrá-lo permanentemente e ninguém vai entender por quê.

---

## 6. Onde mexer com cuidado

| Arquivo | Cuidado |
|---|---|
| `storage.ts` → `mergeCollections` | qualquer mudança aqui pode apagar dados de todo mundo |
| `storage.ts` → `sendToGas` | o retorno autoriza remover da fila; só devolva `true` com confirmação lida |
| `storage.ts` → `flushQueue` | único ponto de escrita; não reintroduza envio direto nas mutações |
| `storage.ts` → `addLog` | é chamado por toda mutação; ações em `LOCAL_ONLY_LOG_ACTIONS` não vão para a planilha |
| `googleSheetsApi.ts` → `valueInputOption` | mantenha `RAW`; `USER_ENTERED` corrompe cifras |
| `gasScript.ts` | alterar aqui **não** altera produção; exige republicar a implantação |

---

## 7. Um backend, nunca dois

`DEFAULT_GAS_ENDPOINT` e `DEFAULT_GAS_SPREADSHEET_ID`, em `storage.ts`, precisam
apontar para a **mesma planilha**. O endpoint atende quem não está logado; o ID
atende o caminho OAuth. Enquanto divergirem, o app grava em bancos diferentes
conforme o estado de login do usuário.

Isso aconteceu de verdade: em 21/08/2026 havia **três destinos de escrita**
simultâneos — o endpoint publicado apontava para uma planilha, o
`DEFAULT_GAS_SPREADSHEET_ID` para outra, e uma terceira recebia a implantação
mais recente do script. Dado que "sumia" estava, na verdade, em outra planilha.

Planilha oficial desde então: `1aqikM5RjvLZYJ2Hn22SK_wg-Dx8DL9Q19ApH1TJtHwI`.

**Ao trocar de planilha ou republicar o script com URL nova**, altere as duas
constantes *e* incremente `CONFIG_VERSION`. Sem isso, cada aparelho da equipe
continua usando o valor em cache no `localStorage`, que sempre vence o default.
Um endpoint definido à mão pelo usuário no painel admin marca a config como
atual e não é sobrescrito pela migração.

Há teste para as duas coisas: `2.1b` (defaults coerentes entre si) e `2.1c`
(cache antigo é migrado).

---

## 8. Passos manuais pendentes (Fase 1)

✅ Ambos concluídos em 21/08/2026 na planilha
`1aqikM5RjvLZYJ2Hn22SK_wg-Dx8DL9Q19ApH1TJtHwI`, que passou a ser a oficial.
O procedimento fica registrado para as próximas vezes:

**1. Republicar o Apps Script.** A trava de concorrência (`LockService`) e a função
`repairDatabase()` vivem em `src/data/gasScript.ts`. Copie o conteúdo para o editor
do Apps Script da planilha e publique uma **nova versão** da implantação:
*Implantar > Gerenciar implantações > editar (lápis) > Versão: Nova versão > Implantar*.
Editar o código sem republicar mantém a versão antiga no ar.

**2. Rodar `repairDatabase()` uma vez.** No editor do Apps Script, selecione a função
`repairDatabase` e execute. Ela tira um backup antes de mexer em qualquer coisa, e então
remove linhas com ID duplicado, linhas em branco e o excesso de logs. O resultado sai
no *Registro de execução*.

Enquanto o passo 1 não for feito, escritas simultâneas de dois integrantes ainda podem
se atropelar. As demais correções da Fase 1 são do lado do app e já valem.

---

## 9. Comandos

```bash
npm test        # Vitest — suíte completa
npm run lint    # tsc --noEmit
npm run build   # build de produção
```

⚠️ `tsconfig.json` não tem `strict` nem `include`. A verificação de tipos é fraca e
não cobre os arquivos de teste (há testes chamando componentes com props que não
existem mais, e o `tsc` passa mesmo assim).
