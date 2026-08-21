# 🗄️ Arquitetura da Camada de Dados — TP Flame

> Mapa técnico de como o app conversa com o Google Sheets.
> Documento de referência para qualquer alteração em `src/services/storage.ts`,
> `src/services/googleSheetsApi.ts` ou `src/data/gasScript.ts`.
>
> Última auditoria: 20/08/2026.

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

- `insert` → `values/{aba}!A1:append` (append puro, **não verifica se o ID já existe**)
- `update` → lê a aba inteira, acha a linha pelo ID, faz `PUT` naquele range
- `delete` → **`values:clear`** naquela linha — a linha continua existindo, vazia
- leitura → `values:batchGet` com range fixo **`A1:Z500`**

Características: rápido, resposta legível, mas o token vem do
`GoogleAuthProvider.credentialFromResult()` do Firebase, **vale 1 hora e nunca é
renovado**. Depois disso o app cai silenciosamente para o Caminho B.

### Caminho B — Apps Script Web App (fallback público)
Endpoint fixo no bundle, sem login. É o caminho que a banda inteira usa hoje.

- leitura → `GET ?action=getAll` (devolve as 10 abas de uma vez, sem limite de linhas)
- escrita → `POST` com `{action, table, data}`
- `insert` no GAS é **upsert** (procura o ID antes de inserir) — diferente do Caminho A
- `delete` no GAS é `deleteRow()` de verdade — diferente do Caminho A

⚠️ Os dois caminhos têm **semântica diferente** para `insert` e `delete`. O mesmo app
produz resultados diferentes na planilha dependendo de estar logado ou não.

⚠️ O script publicado **não é o mesmo** que está em `src/data/gasScript.ts`. Um `POST`
sem corpo devolve `TypeError: Cannot read properties of undefined (reading 'contents')`,
erro que a guarda presente no arquivo do repo já preveniria. Existe drift entre repo e
produção, e não há processo de deploy versionado.

---

## 4. O ciclo de sincronização (`syncWithGas`)

```
1. drena a SyncQueue     → para cada item pendente, envia para a planilha
                           se "deu certo", REMOVE da fila
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
Esse é o comportamento desejado (é assim que uma exclusão feita por outro integrante
chega até você), mas ele transforma qualquer falha de escrita em perda de dado permanente
naquele dispositivo.

`Historico` e `Logs` **não passam pelo merge** — são substituídos direto pelo remoto
(`setDirect`), ignorando a fila. Qualquer histórico ainda não sincronizado é perdido.

### Invariantes que precisam valer

1. Um item só sai da fila com **confirmação lida do servidor**. Escrita cega nunca conta como sucesso.
2. Uma mutação é enviada **uma única vez** — ou pela fila, ou imediatamente, nunca pelos dois.
3. Um pull que devolve tabela vazia enquanto existe dado local **não pode** ser tratado como "o outro apagou tudo".
4. O que é gravado na planilha precisa voltar idêntico na leitura (sem coerção de tipo).
5. Toda escrita concorrente no Apps Script precisa de `LockService`.

Hoje **nenhuma das cinco vale**. Ver `docs/` do diagnóstico para detalhes e evidências.

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
| `storage.ts` → `sendToGas` | usa `no-cors`; o `return true` é mentira, não há como saber se funcionou |
| `storage.ts` → `addLog` | é chamado por toda mutação e **ele mesmo** enfileira + envia; cuidado com efeito cascata |
| `googleSheetsApi.ts` → `valueInputOption` | está `USER_ENTERED`; deve ser `RAW` para não corromper cifras |
| `googleSheetsApi.ts` → `A1:Z500` | teto rígido de 500 linhas por aba no caminho OAuth |
| `gasScript.ts` | alterar aqui **não** altera produção; exige republicar a implantação |

---

## 7. Comandos

```bash
npm test        # Vitest — suíte completa
npm run lint    # tsc --noEmit
npm run build   # build de produção
```

⚠️ `tsconfig.json` não tem `strict` nem `include`. A verificação de tipos é fraca e
não cobre os arquivos de teste (há testes chamando componentes com props que não
existem mais, e o `tsc` passa mesmo assim).
