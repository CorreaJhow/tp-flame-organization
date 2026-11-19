# Tema claro e escuro

## Objetivo
O usuário escolhe entre tema **Escuro**, **Claro** ou **Automático** (segue o aparelho), e todas as telas ficam legíveis nos dois.

## Situação hoje (medida)
- Tudo é escuro e fixo. ~170 `text-white`, ~420 usos da escala `slate-*`, ~60 cores de status (red/amber/emerald/cyan/blue com `-950`/`-400`/`/10` que só funcionam em fundo escuro), 17 hex soltos (`bg-[#222]` etc.), cores de vozes em `utils/vocalColors.ts`, scrollbar em `index.css`, `theme-color`/`background_color` `#080808` no `index.html` e `manifest.json`, e 3 `style={{}}` inline.
- Já existem tokens (`brand`, `base`, `header`, `surface`, `surface-hover`) em `src/index.css` — a base certa.

## Abordagem (menor risco)
1. **Tokens semânticos por tema** em `index.css` via variáveis CSS: `base`, `header`, `surface`, `surface-hover`, `fg` (texto principal), `fg-muted`, `fg-subtle`, `line` (borda). `:root` = escuro (valores atuais, nada muda), `[data-theme="light"]` = claro.
2. **Migração mecânica e revisada arquivo a arquivo**: `text-white` → `text-fg`, `text-slate-300/400/500` → `fg-muted/subtle`, `border-slate-800/700` → `border-line`, `bg-slate-900/800` → `surface`, hex soltos → tokens. `text-white` **sobre fundo laranja/colorido continua branco** (conferir cada caso; `text-slate-950` sobre laranja não muda).
3. **Cores de status** (erro, aviso, sucesso, info, vozes): no claro viram versões com contraste (fundo claro + texto `-700/-800`), via tokens `ok/warn/danger/info` com variantes `soft` e `text`.
4. **Escolha do tema**: seletor Escuro / Claro / Automático em **Mais > Aparência** + botão rápido no Header. Salvo em `localStorage` (`tp_flame_theme_v1`), com try/catch. **Padrão: Escuro** (como hoje; ninguém vê mudança sem escolher).
5. **Sem flash**: script inline no `index.html` aplica o tema antes do React carregar; `<meta name="theme-color">` acompanha. `manifest.json` fica escuro (limitação do PWA: um valor só).
6. **Modo Palco** segue o tema escolhido, mas a cifra, acordes e vozes têm teste de contraste próprio (é a tela mais crítica; regra de ouro do projeto).

## Critérios de aceite
- [ ] Seletor Escuro/Claro/Automático funciona, persiste ao recarregar e no PWA instalado; Automático reage à troca do sistema com o app aberto.
- [ ] Padrão continua idêntico ao de hoje no escuro (comparação de screenshots antes/depois: sem diferença visual).
- [ ] Sem flash do tema errado ao abrir o app.
- [ ] Nenhuma `text-white`/`text-slate-*`/`border-slate-*`/`bg-slate-*`/hex solto de neutro sobrando em `src/` (grep zerado); exceções listadas e justificadas (ex.: texto branco sobre laranja).
- [ ] Contraste mínimo **WCAG AA (4,5:1 texto, 3:1 ícones/bordas de controle)** nos dois temas, medido por script nos tokens e conferido por screenshot.
- [ ] Capturas de **todas as telas nos dois temas, celular (390px) e desktop**, revisadas: Login, Início, Biblioteca (lista/vazia), Ficha da música (abas Letra/Notas/Arquivos), Cadastro/Edição de música, Cultos (lista, detalhe, modais Agendar/Editar/Adicionar Música), Modo Palco (Cifra/Letra/Sucinta, vozes, metrônomo), Mais (Equipe, Admin, Histórico/Feedbacks, Novidades), Toasts, ConfirmModal, PWA install, estados vazios.
- [ ] Cores de vozes (Bianca, Larissa…) distinguíveis e legíveis nos dois temas; destaque de acordes legível.
- [ ] Scrollbar, `<select>` abertos, inputs, placeholders e foco (anel) visíveis nos dois temas.
- [ ] `npm run lint`, `npm test`, `npm run build` passam; teste unitário do util de tema (lê/grava/auto).

## Fora de escopo
- Tema por usuário na nuvem (é por aparelho, `localStorage`).
- Cores de marca novas (laranja `#FF4D00` continua o acento; no claro só ajusto o tom de texto se faltar contraste).
- Ícone/manifest do PWA em duas versões.
- Redesenhar layouts.

## Decisões do Jhow (18/11/2026)
- Padrão **Escuro**; a pessoa escolhe Escuro ou Claro (sem opção "Automático").
- Botão rápido no Header **e** em Mais > Aparência.
- No Modo Palco a pessoa também escolhe (botão sol/lua na barra de controles).

## Verificação feita
- Auditoria automática de contraste (texto, 4,5:1) em ~38 telas/estados × claro/escuro × celular/desktop com dados de demonstração: claro sem falhas; escuro igual ao de antes (diferença de pixels ~0,2%, só o botão novo do tema).
- Exceções sabidas no escuro, **já existentes antes** (não alteradas pra manter o visual): textos `fg-subtle`/`fg-faint` (cinza) com 3,9–4,2:1.
- Trechos esmaecidos de propósito (foco em outra voz) e controles desativados não entram na conta.
