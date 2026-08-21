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
| `Musicas` | ID, Nome, Artista, Categoria, +auditoria | — |
| `Versoes` | ID, ID_Musica, Nome_Versao, Tom, BPM, Compasso, Letra, Estrutura, Obs, +auditoria | → Musicas |
| `Arquivos` | ID, ID_Versao, Tipo, URL, Nome, +auditoria | → Versoes |
| `Notas` | ID, ID_Versao, Instrumento, Observacao, **Autor, Titulo, TipoNota**, +auditoria | → Versoes |
| `Cultos` | ID, Data, Nome_Evento, Status, Observacoes, +auditoria | — |
| `Repertorio` | ID, ID_Culto, ID_Versao, Ordem, Dirigente, Observacao_Culto, +auditoria | → Cultos, Versoes |
| `Integrantes` | ID, Nome, Funcao, Email, Telefone, Ativo, +auditoria | — |
| `Historico` | ID, ID_Versao, ID_Culto, Data_Execucao, +auditoria | → Versoes, Cultos |
| `Logs` | ID, Data, Usuario, Acao, Registro_Afetado | — (log e imutavel) |

**Esquema v2.** `+auditoria` = `Atualizado_Em`, `Atualizado_Por`, `Excluido_Em`.
O carimbo e aplicado num unico ponto, `stampAudit()` na entrada da fila de
sincronizacao, para nao haver como esquecer numa funcionalidade nova.
`Atualizado_Em` ja e gravado hoje, mesmo sem resolucao de conflito: sem isso os
registros criados antes da Fase 2 ficariam sem historico. `Excluido_Em` esta
reservado para a lixeira da Fase 3.

O esquema está declarado em **três lugares que precisam ficar em sincronia**:

- `src/types.ts` — tipos TypeScript
- `src/services/googleSheetsApi.ts` → `SHEET_SCHEMAS` — caminho OAuth
- `src/data/gasScript.ts` → `DATABASE_SCHEMA` — caminho Apps Script

`Nota.Autor`, `Nota.Titulo` e `Nota.TipoNota` entraram no esquema v2 — antes eram
descartados na sincronizacao, e as anotacoes vocais nao saiam do celular de quem
as criou.

`Integrante.PIN` continua **de fora, de proposito**: a planilha e servida por um
Web App publico, e guardar PIN nela publicaria a senha de todo mundo. Ele vive
apenas no dispositivo.

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

## 7. Um backend, e um jeito de nao ter dois

O endpoint do Apps Script e a **unica** coisa configuravel. O ID da planilha
nao e mais uma constante nem um campo de formulario: o app pergunta ao endpoint
qual planilha ele serve, via `?action=whoami`, e guarda a resposta em cache.

```
DEFAULT_GAS_ENDPOINT  ──?action=whoami──>  spreadsheetId
   (uma constante)                          (derivado, em cache)
        │                                        │
        └──── caminho Apps Script ───┐   ┌────────┘
                                     ▼   ▼
                            a MESMA planilha, sempre
```

Antes existiam duas configuracoes independentes, e elas divergiram: o endpoint
apontava para uma planilha e o `DEFAULT_GAS_SPREADSHEET_ID` para outra, entao o
app gravava em bancos diferentes conforme o usuario estivesse logado no Google
ou nao. Chegaram a existir tres destinos de escrita simultaneos. Derivar o ID do
endpoint torna isso **impossivel por construcao** — nao ha segundo valor para
sair de sincronia.

Enquanto o `whoami` nao responde, `getGasSpreadsheetId()` devolve string vazia,
o caminho OAuth fica desligado e tudo passa pelo Apps Script. Mais lento, jamais
dividido.

**Ao trocar de planilha ou republicar com URL nova:** altere
`DEFAULT_GAS_ENDPOINT` *e* incremente `CONFIG_VERSION`. Sem o incremento, cada
aparelho continua usando o endpoint em cache, que sempre vence o default. Um
endpoint definido a mao no painel admin carimba a versao atual e nao e
sobrescrito pela migracao.

Passo a passo completo em [INSTALAR-PLANILHA.md](INSTALAR-PLANILHA.md).

Testes: `2.1` (sem config, opera local), `2.1b` (ID vem do endpoint), `2.1c`
(cache antigo e descartado).

---

## 8b. Segunda porta encontrada e fechada (21/08/2026)

Horas depois de fechar a divergencia entre endpoint e Spreadsheet ID
(secao 7), a mesma classe de bug reapareceu por outra tela:
`GoogleWorkspaceModal.tsx` deixava escolher uma planilha via OAuth/Google
Drive Picker e gravava o ID dela direto no `localStorage`, **totalmente
desconectado do endpoint configurado**. Resultado: era possivel, de novo, o
app escrever numa planilha pelo caminho OAuth e noutra pelo Apps Script.

A causa raiz dessa vez nao foi corrigida so no ponto onde apareceu — o
metodo publico `storage.setGasSpreadsheetId()` foi **removido por completo**.
Sem ele, nao ha como uma tela nova reintroduzir esse bug: o unico jeito de
mudar de planilha e apontar o endpoint para outra implantacao, e o ID e
sempre resolvido a partir dai por `refreshBackendIdentity()`.

`GoogleWorkspaceModal` continua deixando criar/explorar planilhas no Drive,
mas essas acoes agora **orientam** os proximos passos manuais (colar o
script, publicar, apontar o endpoint) em vez de trocar o alvo de escrita
silenciosamente.

Teste `2.1d` garante que o metodo nao volte a existir.

---

## 8. Reinstalacao (21/08/2026)

As planilhas anteriores continham apenas dados de teste e foram descartadas.
O banco foi reinstalado do zero, com o esquema v2 e o modelo de configuracao
unica descrito na secao 7.

Procedimento completo: [INSTALAR-PLANILHA.md](INSTALAR-PLANILHA.md).

`DEFAULT_GAS_ENDPOINT` fica **vazio** ate a nova implantacao existir. Com ele
vazio o app funciona normalmente offline, no proprio aparelho, e o painel admin
avisa que falta configurar — mas nada e compartilhado com a equipe. Preencher e
incrementar `CONFIG_VERSION` e o ultimo passo antes de publicar.

---

## 8c. Validacao contra colagem malformada (21/08/2026)

O bundle publicado apareceu, duas vezes seguidas, com a URL do endpoint
contendo um caractere de reticencias real (`…`) no meio do ID de implantacao
-- evidencia consistente com `VITE_GAS_ENDPOINT` configurado na Vercel com um
valor colado incompleto. Sem acesso ao painel da Vercel para confirmar a
causa exata, a correcao aplicada protege o app independente de onde a
corrupcao venha: variavel de ambiente, colagem manual no admin, ou qualquer
fonte futura.

`sanitizeGasEndpoint()`, em `storage.ts`, e aplicada nos tres pontos de
entrada de uma URL de endpoint: a variavel de ambiente, a leitura do cache
(`getGasEndpoint`) e a gravacao manual (`setGasEndpoint`, que agora devolve
`boolean` e rejeita URLs invalidas em vez de salva-las).

Decisao deliberada: ao encontrar um caractere de colagem malformada
(reticencias, aspas curvas, espacos de largura zero), a funcao **rejeita a
string inteira**, nunca remove o caractere e valida o que sobrou. Remover
primeiro foi tentado e descartado: "AKfycbzXHtLDcy3p…/exec" sem a reticencia
vira "AKfycbzXHtLDcy3p/exec", um ID truncado que ainda bate com o formato
esperado (letras/numeros/traco) e passaria como "valido" apontando para uma
implantacao que nao existe. So aceita quem chega limpo.

Testes `2.1e` a `2.1g` cobrem exatamente o caractere observado em producao.

---

## 8d. Sincronizacao inicial silenciosa (21/08/2026)

Reportado pelo usuario: abrir o app num aparelho as vezes mostra dados
antigos por um instante, depois "atualiza sozinho". Mecanismo confirmado em
`App.tsx`: no mount, `refreshData()` le o `localStorage` do proprio aparelho
IMEDIATAMENTE (o que ja estava salvo ali, de uma visita anterior), e so
depois `handleSync(false)` busca a planilha e substitui. Como a chamada
automatica nunca mostrava toast -- nem de sucesso, nem de falha -- a troca
acontecia em silencio, e uma falha de sincronizacao (rede ruim no ensaio, por
exemplo) deixava a pessoa vendo dado desatualizado sem nenhum aviso.

Corrigido em `App.tsx`: a primeira sincronizacao de cada sessao agora sempre
avisa, mesmo sendo automatica -- toast ao iniciar, toast de sucesso ou aviso
ao terminar, mais uma faixa persistente acima do conteudo enquanto ela roda
(o toast some sozinho em poucos segundos e podia passar despercebido).
Sincronizacoes seguintes na mesma sessao continuam silenciosas em caso de
sucesso, para nao virar ruido quando a Fase 2 trouxer sync periodico.

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
