# 🔒 Plano — Fase 3: Fechar o endpoint de verdade

> Planejado em 04/09/2026, pra executar depois do ensaio (não durante uma
> janela de uso ao vivo). Ver o que já foi tentado e revertido no mesmo dia
> em [`ESTADO-ATUAL.md`](./ESTADO-ATUAL.md), item 1 do backlog — este plano
> nasce diretamente da lição aprendida ali: **nenhuma solução pode exigir
> configuração manual em cada aparelho da equipe.**

## 1. O que estamos resolvendo

Hoje (antes deste plano), o endpoint do Apps Script:
- Não exige nenhuma autenticação, em nenhuma ação.
- Tem a URL cravejada como constante pública em `src/services/storage.ts`
  (`FALLBACK_GAS_ENDPOINT`), num repositório GitHub público.
- Aceita `replaceAll` (substitui todas as tabelas) e `batch` com uma
  sequência de `delete` (apaga registro por registro) — as duas dão pra
  zerar o banco inteiro.
- `getAll` devolve e-mail/telefone de todos os integrantes pra qualquer um
  que chame o endpoint, sem precisar nunca abrir o app.

**O que NÃO estamos resolvendo agora** (fora de escopo deste plano,
mapeado como Fase 4 — seção 6): impedir que alguém escreva registros
falsos um por um via `insert`/`update`/`batch` sem ser destrutivo em
massa. Isso só se resolve de verdade com login por integrante.

## 2. Arquitetura: intermediário server-side (Vercel Function)

```
Antes:  Navegador ──(URL + nada)──────────────► Google Apps Script
Depois: Navegador ──(mesma origem, sem segredo)──► Vercel Function ──(URL + token, só no servidor)──► Google Apps Script
```

A função serverless roda no MESMO domínio do site (`/api/gas-proxy`), então
**todo visitante já a alcança automaticamente** — zero configuração em
qualquer aparelho, exatamente a restrição que faltou na tentativa de hoje.

### 2.1 Variáveis de ambiente novas (só no painel da Vercel, nunca com
prefixo `VITE_` — isso é o que garante que NUNCA vão pro bundle do
navegador):

| Nome | Valor | Uso |
|---|---|---|
| `GAS_ENDPOINT_URL` | a URL `/exec` atual do Apps Script | proxy chama o Google |
| `GAS_SHARED_TOKEN` | um valor novo, gerado do zero | proxy autentica no Apps Script |
| `TP_FLAME_GUARD_PASSPHRASE` | uma frase-senha só sua, separada da senha de admin do app | protege `replaceAll`/`setup` |

Configurar em: Vercel → Project → Settings → Environment Variables →
Production (e Preview, se quiser testar em branch antes).

### 2.2 Novo arquivo: `api/gas-proxy.js`

Vercel detecta qualquer arquivo em `/api/*.js` como função serverless
automaticamente (projeto Vite, sem config extra necessária). Esboço:

```js
export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_ENDPOINT_URL;
  const GAS_TOKEN = process.env.GAS_SHARED_TOKEN;
  const GUARD_PASSPHRASE = process.env.TP_FLAME_GUARD_PASSPHRASE;

  if (!GAS_URL || !GAS_TOKEN) {
    return res.status(500).json({ status: 'error', message: 'Proxy nao configurado (env vars ausentes).' });
  }

  try {
    if (req.method === 'GET') {
      const action = req.query.action || 'getAll';
      const url = new URL(GAS_URL);
      url.searchParams.set('action', action);
      if (action === 'search' && req.query.q) url.searchParams.set('q', String(req.query.q));
      url.searchParams.set('token', GAS_TOKEN);

      const upstream = await fetch(url.toString());
      const text = await upstream.text();
      res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const DESTRUCTIVE_ACTIONS = ['replaceAll', 'setup'];

      if (DESTRUCTIVE_ACTIONS.includes(body.action)) {
        if (!GUARD_PASSPHRASE || body.guardPassphrase !== GUARD_PASSPHRASE) {
          return res.status(403).json({ status: 'error', message: 'Acao restrita: frase-senha invalida ou ausente.' });
        }
      }

      const upstream = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...body, guardPassphrase: undefined, token: GAS_TOKEN })
      });
      const text = await upstream.text();
      res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
      return;
    }

    res.status(405).json({ status: 'error', message: 'Metodo nao suportado' });
  } catch (err) {
    res.status(502).json({ status: 'error', message: 'Falha ao falar com o backend: ' + (err && err.message) });
  }
}
```

Pontos importantes desse desenho:
- `replaceAll`/`setup` exigem `guardPassphrase` no corpo — **mas nenhum
  botão da interface chama essas ações hoje** (`pushAllToGas()` em
  `storage.ts` existe mas está órfão, sem botão nenhum ligado a ela).
  Ou seja: essa trava não muda absolutamente nada do uso normal da equipe.
  Se um dia vocês quiserem religar um botão de "republicar tudo" no Admin,
  aí sim ele precisa pedir a frase-senha na hora (não salvar em
  localStorage — é ação rara e sensível o bastante pra digitar toda vez).
- Todas as outras ações (`getAll`, `whoami`, `search`, `insert`, `update`,
  `delete`, `batch` de inserts/updates comuns) continuam livres — é assim
  que a equipe consegue usar o app sem login nenhum, como já funciona hoje.

### 2.3 Mudanças em `src/services/storage.ts`

Trocar as 4 chamadas que hoje usam `this.getGasEndpoint()` direto pra
`/api/gas-proxy` (caminho relativo, mesma origem):

```ts
// antes: fetch(`${endpoint}?action=whoami`)
fetch(`/api/gas-proxy?action=whoami`)

// antes: fetch(endpoint, { method: 'POST', ... })
fetch('/api/gas-proxy', { method: 'POST', ... })
```

`getGasEndpoint()`/`setGasEndpoint()` e o campo de URL no Admin **podem
sumir** — não faz mais sentido configurar isso por aparelho, a URL real só
existe na Vercel agora. (Ou manter só como "URL avançada", oculta por
padrão, pra o caso raro de rodar contra outra planilha em teste local.)

### 2.4 Mudanças em `src/data/gasScript.ts`

Reintroduzir a checagem de token (igual à tentativa revertida hoje, commit
`a78e315`, que tecnicamente funcionava) — a diferença crítica desta vez é
**quem manda o token**: só o proxy da Vercel, nunca o navegador. Reaplicar
o `SHARED_SECRET` + `isAuthorized()` em `doGet`/`doPost` (pode recuperar o
texto exato do commit revertido `303437d`'s pai, `a78e315`, como base).

### 2.5 Ambiente local de desenvolvimento

`vite dev` sozinho **não** serve `/api/*` (isso é coisa da Vercel). Duas
opções pra testar localmente antes de subir:
- Rodar `vercel dev` em vez de `npm run dev` quando for mexer nisso
  (precisa da CLI da Vercel e login uma vez: `npx vercel login`).
- Ou aceitar que o teste real só acontece em Preview Deployment da Vercel
  (cada PR/branch ganha uma URL de preview com as mesmas env vars).

## 3. Ordem de execução recomendada (fora de janela de culto/ensaio)

1. Configurar as 3 env vars na Vercel (produção).
2. Criar `api/gas-proxy.js`.
3. Reintroduzir `SHARED_SECRET`/`isAuthorized()` em `gasScript.ts` (com um
   token novo, gerado do zero — não reaproveitar nenhum valor de hoje).
4. Atualizar as 4 chamadas em `storage.ts` pra usar `/api/gas-proxy`.
5. Commitar e dar push (a Vercel builda e publica sozinha).
6. **Só depois** do passo 5 estar no ar: reimplantar o Apps Script com o
   `SHARED_SECRET` novo (mesma rotina de sempre: Implantar → Gerenciar
   implantações → Editar → **Nova versão**).
7. Testar (seção 4) antes de considerar concluído.

A ordem importa: se você reimplantar o Apps Script com o token ANTES do
proxy estar no ar, a sincronização quebra pra todo mundo de novo (mesmo
erro de hoje). Proxy primeiro, sempre.

## 4. Checklist de teste (tudo somente leitura, sem risco)

```bash
# 1. Confirma que o endpoint direto do Google agora rejeita chamada sem token
curl -sL "https://script.google.com/macros/s/SEU_ID/exec?action=whoami"
# esperado: {"status":"error","message":"Token de acesso invalido ou ausente."}

# 2. Confirma que o proxy da Vercel funciona (chamando pela URL pública do site)
curl -sL "https://tp-flame-organization.vercel.app/api/gas-proxy?action=whoami"
# esperado: {"status":"success", "spreadsheetId": "...", ...}

# 3. Confirma que a acao destrutiva exige a frase-senha
curl -sL -X POST "https://tp-flame-organization.vercel.app/api/gas-proxy" \
  -H "Content-Type: application/json" \
  -d '{"action":"replaceAll","data":{}}'
# esperado: {"status":"error","message":"Acao restrita: frase-senha invalida ou ausente."}
```

Depois, abrir o app de verdade (celular comum, sem nenhuma config feita
nele) e confirmar que sincroniza normalmente — esse é o teste que faltou
antes de reimplantar hoje de manhã.

## 5. Plano de rollback

Se algo der errado: reverter o commit do passo 5 (`git revert`) e
reimplantar o Apps Script com o `gasScript.ts` de antes (sem
`SHARED_SECRET`) — mesma rotina de emergência que já usamos hoje. Manter
esta seção como referência rápida evita reinventar o procedimento sob
pressão de novo.

## 6. Fora de escopo por agora (mapeado pra depois)

### Fase 4 — Login real por integrante
Cada pessoa entra com a própria conta Google (Google Identity Services,
"Sign in with Google"), o proxy valida o token de identidade contra uma
lista de e-mails autorizados, e só identidades autorizadas escrevem.
Resolve o que a Fase 3 não resolve (alguém escrevendo registros falsos um
por um). Escopo de dias, não horas — projeto separado, bom aprendizado.
Pré-requisito: Fase 3 estável primeiro.

### Migração de banco de dados
**Pendente confirmação explícita** — contraria a decisão registrada em
`ESTADO-ATUAL.md` ("Google Sheets fica como backend"). Ideia mencionada
pelo usuário como possível aprendizado futuro, não decidida ainda. Não
iniciar sem conversa e confirmação dedicadas.
