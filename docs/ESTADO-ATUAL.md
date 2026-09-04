# 📍 Estado Atual — TP Flame

> **Leia este arquivo primeiro em qualquer conversa nova sobre o projeto.**
> Ele existe pra evitar reconstruir o histórico do zero (e gastar contexto/tokens
> à toa) toda vez que uma sessão de IA recomeça. Detalhe técnico profundo fica em
> [`ARQUITETURA-DADOS.md`](./ARQUITETURA-DADOS.md); passo a passo de instalação
> em [`INSTALAR-PLANILHA.md`](./INSTALAR-PLANILHA.md). Este arquivo é só o resumo
> executivo: o que já foi feito, o que foi decidido, o que falta.
>
> Atualizado em: 04/09/2026 (após a segunda auditoria — "Raio-X", os 5 ganhos
> rápidos do commit `efc517d`, e o code-splitting das telas de admin/config).

---

## 1. O que é o projeto

PWA para a equipe de louvor gerenciar cifras, repertório e cultos, funcionando
100% offline no palco e sincronizando com uma planilha Google (sem servidor
próprio). Ver propósito completo e stack em [`CLAUDE.md`](../CLAUDE.md).

Produção: **https://tp-flame-organization.vercel.app** (Vercel, deploy
automático a cada push em `main`, repositório público no GitHub).

## 2. Linha do tempo do que já foi feito

### Fase 1 — Parar a perda de dados (concluída)
Motor de sincronização (`src/services/storage.ts`) tinha: duplicação de
registros, falhas de escrita silenciosas, apagamento silencioso de dados numa
leitura vazia, corrupção de cifras por auto-conversão de tipo do Google Sheets
(`USER_ENTERED`), sem lock de concorrência, limite de leitura de 500 linhas,
config de planilha partida em três lugares diferentes. Tudo corrigido — ver
`ARQUITETURA-DADOS.md` seções 7–9 para o detalhe de cada bug e fix.

### Fase 2 — Resiliência (itens 1 e 2 concluídos; item 3 adiado)
1. **Resolução de conflito por timestamp** — colunas de auditoria
   (`Atualizado_Em/Por`, `Excluido_Em`) via `stampAudit()`; quem editou por
   último de verdade vence, não quem sincronizou primeiro.
2. **Sincronização automática** — antes só sincronizava no clique manual;
   agora roda sozinha (intervalo + volta de foco + reconexão) em `App.tsx`.
3. **Renovação de token OAuth** — **decisão explícita do usuário: adiado.**
   ("Fechou, deixa pra depois o auth.") Não é urgente porque o caminho em uso
   de verdade é o Apps Script público (Caminho B), não o OAuth direto
   (Caminho A) — ver `ARQUITETURA-DADOS.md` seção 1.

### Cadastro inicial de integrantes + tela de sincronização inicial
Overlay de tela cheia com fundo borrado (`InitialSyncOverlay.tsx`) enquanto o
app busca os dados da planilha pela primeira vez. 8 integrantes já cadastrados
na planilha com função/instrumento (Leticia, Jhow, Benicio, Kleber, Gustavo,
Vitinho, Larissa, Bianca) — não precisa recadastrar.

### Correções do Modo Palco (tela usada ao vivo, no palco)
- Metrônomo corrompido (explosão de bolinhas) → corrigido + `MAX_BEATS = 16`.
- Painel do metrônomo agora minimizável (`localStorage
  tp_flame_stage_metronome_expanded_v1`), desliga o metrônomo ao recolher.
- Tom não distinguia Maior/Menor (`[Bm]` tinha que ser escrito na observação)
  → campo `Modo` (`'Maior' | 'Menor'`) em `Versao`, `formatKeyDisplay()` em
  `chordTransposer.ts` compõe a exibição certa.
- Observações de outros instrumentos agora aparecem automaticamente
  (`useEffect` liga `showNotes` quando existem notas).

### Skill "Donna" (secretária operacional)
`.claude/skills/donna/SKILL.md` — invocada com `/donna`. Cadastra
música/integrante/culto+repertório, gera relatório lendo `?action=getAll` ao
vivo do endpoint real, dá recomendações. Nome vem de Donna Paulsen (Suits) —
atenção ao grafar com **dois N**.

### Segunda auditoria ("Raio-X") + 5 ganhos rápidos (commit `efc517d`)
Auditoria cobrindo design, segurança, uso diário e testes. Os 5 itens de
baixo esforço já aplicados e verificados ao vivo em produção:
1. Removida a feature de PIN fantasma (nunca protegia nada de verdade) em
   `MemberProfileModal.tsx`.
2. Badge de contagem de pendências no botão de sincronizar (`Header.tsx`,
   `storage.getPendingCount()`).
3. Headers de segurança HTTP (`vercel.json`): `X-Frame-Options`,
   `X-Content-Type-Options`, `Strict-Transport-Security`, etc.
4. Dependências mortas removidas do `package.json` (`express`, `dotenv`,
   `@google/genai`, `motion`) — **atenção**: isso deixou `bun.lock`
   tecnicamente desatualizado; confirmado que o `bun install` do Vercel
   se auto-reconcilia sem erro (build verificado ao vivo pelo bundle hash).
5. Texto sub-12px no Modo Palco eliminado (12px confirmado como o menor
   tamanho em 352 elementos medidos ao vivo na tela de produção).

Relatórios completos publicados como Artifacts (fora do repositório):
- Diagnóstico original: `https://claude.ai/code/artifact/fa14547a-771e-4274-ab78-c23930131c92`
- Raio-X (segunda auditoria): `https://claude.ai/code/artifact/c5a3c962-6fcf-4748-92af-9aa430c8795f`

### Code-splitting das telas de admin/config (backlog item 4 concluído)
`AdminView`, `GasSetupModal`/`GoogleWorkspaceModal` (que embute o texto do
Apps Script de `gasScript.ts`, ~24KB) e `HistoricoLogsView` viraram
`React.lazy()` em `App.tsx`, com `Suspense` e um fallback simples (spinner
`RefreshCw`, mesmo padrão do Header). Bundle inicial caiu de 619KB → 558KB
(155KB → 140KB gzip) — quem só abre uma cifra no palco não baixa mais o
painel de administração nem a configuração do Google Sheets. Verificado ao
vivo: os três chunks carregam sob demanda sem erro de console, `npm test`
(37/37) e `npm run lint` seguem passando.

## 3. Decisões explícitas do usuário (não reabrir sem perguntar)

- **Google Sheets fica como backend.** Não é para migrar para outro banco.
- **OAuth renewal adiado** (Fase 2 item 3) — de propósito, não esquecido.
- **PIN de perfil removido, não recriado** — era decorativo, nunca protegeu
  nada; se precisar de identidade real por integrante, é feature nova do
  zero (repensar do jeito certo), não reaproveitar aquele código.
- **Repositório GitHub é público** — necessário pro deploy automático
  funcionar no plano gratuito da Vercel (repo privado bloqueia autor sem
  assento pago). Decisão consciente do usuário.
- **Bun é o gerenciador de pacotes canônico** — `bun.lock` é versionado;
  `package-lock.json`/`pnpm-lock.yaml`/`yarn.lock` estão no `.gitignore` e
  nunca devem ser commitados.
- **Segurança do endpoint do Apps Script — decisão explícita (04/09/2026):**
  o endpoint é pior do que o backlog registrava: não é só leitura de
  e-mail/telefone, é **escrita e exclusão irrestritas** via `doPost`
  (`replaceAll`, `batch`), sem autenticação nenhuma, e a URL é uma constante
  pública no próprio código-fonte (`FALLBACK_GAS_ENDPOINT` em `storage.ts`).
  Usuário escolheu conscientemente **mitigação barata agora + intermediário
  server-side depois** (não "aceitar o risco" puro, não "arquitetura agora"):
  - **Feito:** token secreto (`SHARED_SECRET` em `gasScript.ts`,
    `getGasToken()`/`setGasToken()` em `storage.ts`, campo no Admin) exigido
    em toda chamada a `doGet`/`doPost`. Fail-closed: com o placeholder, o
    script rejeita 100% das chamadas. Retrocompatível: o cliente novo manda
    o token, um script antigo (ainda sem o check) simplesmente ignora.
  - **Limite reconhecido, não escondido:** o token viaja no bundle público e
    aparece na aba Network pra quem inspecionar o tráfego enquanto o app
    roda — não impede um atacante determinado. Só eleva o custo de "achar a
    URL lendo o GitHub e chamar direto" pra "precisar abrir o app de
    verdade". A correção real continua sendo o item 1 do backlog abaixo.
  - **Pendente, ação manual do usuário:** o token só passa a valer depois
    que alguém (a) gerar um valor (botão de dado 🎲 no campo do Admin), (b)
    colar o mesmo valor na constante `SHARED_SECRET` do script (via "Ver
    Código do Script"), e (c) reimplantar no editor do Apps Script
    (Implantar → Gerenciar implantações → Editar → Nova versão). Sem isso, o
    script em produção continua aceitando qualquer chamada sem token.

## 4. Backlog conhecido (não é urgente, mas está mapeado)

Em ordem aproximada de impacto:

1. **Segurança real (Fase 3)** — o token mitiga o vetor mais barato (ver
   acima), mas não resolve de verdade: o endpoint continua aceitando
   qualquer chamada de quem inspecionar o tráfego do app. Resolver de
   verdade exige um intermediário server-side — mudança de arquitetura, não
   um ajuste rápido. Decisão do usuário: planejar isso como próxima etapa,
   depois da mitigação barata.
2. **OAuth token renewal** (Fase 2 item 3, adiado por decisão do usuário).
3. **Consolidação de design tokens** — 11 valores hexadecimais de
   cinza/preto usados ad-hoc sem sistema de tokens.
4. ~~Code-splitting~~ — **concluído**, ver seção 2.
5. **Cobertura de testes de componente** — 19 de 20 componentes sem teste
   nenhum (a lógica crítica do motor de sync está bem coberta; a UI não).

## 5. Como validar rapidamente que está tudo no ar

```bash
curl -sI https://tp-flame-organization.vercel.app | head -5
```

Para checar a identidade do backend (planilha em uso) e ver os dados reais:
o endpoint do Apps Script responde a `?action=whoami` e `?action=getAll` —
a skill `/donna` já sabe resolver a URL certa e consultar isso.

Para rodar testes/lint localmente:

```bash
npm test
npm run lint
```

(37 testes passando em 5 arquivos, na última checagem.)
