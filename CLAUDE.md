# 🧠 CLAUDE.md — Diretrizes e Contexto do Projeto TP Flame

Este arquivo reúne todas as convenções, arquitetura, padrões de código e instruções de desenvolvimento para manter a consistência do projeto **TP Flame** durante a evolução por assistentes de IA e desenvolvedores.

> 📍 **Antes de qualquer coisa, leia [`docs/ESTADO-ATUAL.md`](docs/ESTADO-ATUAL.md).**
> É o resumo do que já foi feito, o que foi decidido de propósito (e não deve
> ser reaberto sem perguntar) e o que ainda está em aberto. Evita reconstruir
> o histórico do projeto do zero em cada conversa nova.

---

## 🎯 Propósito do Projeto
O **TP Flame** é uma plataforma Progressive Web App (PWA) para equipes de louvor e ministérios de música. Ele combina transposição instantânea de cifras, gestão de repertório e cultos, com suporte a funcionamento 100% offline no palco e sincronização em tempo real com o **Firebase (Firestore + Authentication)**. O backend era Google Sheets/Apps Script até 09/2026; esse código (`gasScript.ts`, `googleSheetsApi.ts`, `googleAuth.ts`) é legado.

---

## 🛠️ Tech Stack & Bibliotecas Padrão

- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS v4. Tema **escuro (padrão, `#080808` / `#121212`)** e **claro (opção)**, acento Laranja Chama `#FF4D00`. Cores só por **tokens semânticos** de `src/index.css`: `text-fg`, `text-fg-muted`, `border-line`, `bg-canvas`, `bg-surface`, `bg-inset`, `text-brand-ink`. **Nunca** `text-white`, `text-slate-*`, `bg-slate-*`, `border-slate-*` ou hex solto de neutro (quebra o tema claro). Cor nova de token: nunca nomear `base`, `sm`, `lg` etc. (colide com classes de tamanho). Mexeu em cor? Rode `npm test` (contraste AA em `themeContrast.test.ts`) e confira nos dois temas.
- **Ícones:** `lucide-react`
- **Backend:** Firebase Authentication (Google ou e-mail/senha, acesso só para a equipe) + Cloud Firestore (`src/services/firestore*.ts`). Ver `docs/PLANO-FASE4-MIGRACAO-FIREBASE.md`.
- **Armazenamento:** cache em memória/`localStorage` + listeners em tempo real do Firestore (com cache offline do Firebase)
- **PWA:** Service Worker nativo (`/public/sw.js`) + Manifest (`/public/manifest.json`)
- **Testes:** Vitest + React Testing Library + JSDOM

---

## 📐 Padrões de Código e Convenções

### **1. Componentes & Estado**
- Mantenha componentes em `/src/components` focados em uma única responsabilidade.
- Utilize o `ToastProvider` (`useToast()`) em `/src/context/ToastContext.tsx` para todas as notificações e feedbacks de ação do usuário.
- Não introduza gerenciadores de estado externos pesados (Redux/Zustand) sem necessidade — o `storageService` unificado atende à persistência local de forma reativa.

### **2. Camada de Dados & Sincronização Resiliente (`/src/services/storage.ts`)**
- Toda leitura/escrita de dados (Firestore e cache local) **deve obrigatoriamente passar por `storage` (`StorageService`)**, que usa os módulos `firestore*.ts`.
- As coleções (herdadas do desenho da planilha original):
  - `Musicas`, `Versoes`, `Cultos`, `Repertorio`, `Integrantes`, `Arquivos`, `Notas`, `Historico`, `Logs`, `Config`.
- **Escrita:** otimista (atualiza a memória e notifica a tela na hora) e depois grava no Firestore; falha de gravação vai para `console.warn`. Exclusão é *soft-delete* (`Excluido_Em`). Toda gravação carimba `Atualizado_Em/Atualizado_Por`.
- **Regras de segurança:** `firestore.rules` (fora do git; modelo em `firestore.rules.example`) só deixa ler/escrever quem está na lista de e-mails da equipe. Só o administrador publica as regras, no Firebase Console. Não validam campos: campo novo não precisa de mudança nelas.
- **Tom por culto:** a música fica no tom original (`Versao.Tom`); o tom cantado em cada culto vai em `RepertorioItem.Tom_Culto` (vazio = original). Modo Palco, tela inicial e ficha usam `keyOffset(versao.Tom, Tom_Culto)`. **Não duplicar versão só para trocar de tom.** A última execução (`getLastPlayedInfo`) vale para a música inteira, não por versão.

### **3. Motor de Transposição Musical (`/src/utils/chordTransposer.ts`)**
- Cifras no texto são representadas entre colchetes, por exemplo: `[E] Sobre o trono [B] Tu estás [C#m]`.
- Ao modificar o algoritmo de transposição de acordes, **garanta compatibilidade com acordes invertidos (Slash Chords ex: `D/F#`) e extensões (ex: `7M`, `m7(b5)`, `add9`)**.
- Sempre execute `npm test` para validar regressão na transposição cromática.

### **4. Login (Firebase Auth)**
- Estado de login em `/src/context/AuthContext.tsx`; sem usuário, o app mostra `LoginScreen`; usuário fora da lista da equipe vê a tela de acesso não autorizado.
- Escrever dados por fora do app (SDK direto, scripts) só para migração/manutenção explícita; o fluxo normal é sempre pelo app.

### **5. PWA & Offline First**
- O arquivo `/public/sw.js` deve utilizar a versão atualizada do cache (ex: `tp-flame-cache-v2`).
- A aplicação nunca deve depender exclusivamente de conexão de internet para abrir ou navegar pelas cifras salvas.

---

## 🧪 Comandos de Testes e Qualidade

- **Executar Testes:** `npm test` (roda a suíte completa no Vitest)
- **Validar TypeScript / Lint:** `npm run lint` (`tsc --noEmit`)
- **Compilar para Produção:** `npm run build`

---

## 📌 Regra de Ouro do Engenheiro
> *"A equipe de louvor não pode ficar na mão no palco. A resiliência offline, a transposição precisa e a velocidade de abertura do app têm prioridade absoluta sobre qualquer nova funcionalidade visual."*
