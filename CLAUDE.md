# 🧠 CLAUDE.md — Diretrizes e Contexto do Projeto TP Flame

Este arquivo reúne todas as convenções, arquitetura, padrões de código e instruções de desenvolvimento para manter a consistência do projeto **TP Flame** durante a evolução por assistentes de IA e desenvolvedores.

> 📍 **Antes de qualquer coisa, leia [`docs/ESTADO-ATUAL.md`](docs/ESTADO-ATUAL.md).**
> É o resumo do que já foi feito, o que foi decidido de propósito (e não deve
> ser reaberto sem perguntar) e o que ainda está em aberto. Evita reconstruir
> o histórico do projeto do zero em cada conversa nova.

---

## 🎯 Propósito do Projeto
O **TP Flame** é uma plataforma Progressive Web App (PWA) para equipes de louvor e ministérios de música. Ele combina transposição instantânea de cifras, gestão de repertório e cultos, com suporte a funcionamento 100% offline no palco e sincronização serverless com o **Google Sheets** via **Google Sheets API v4 (Direto com OAuth)** e fallback via **Google Apps Script (GAS)**.

---

## 🛠️ Tech Stack & Bibliotecas Padrão

- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS (Dark Mode nativo `#080808` / `#121212` com acentos em Laranja Chama `#FF4D00`)
- **Ícones:** `lucide-react`
- **Google Workspace Integration:** Google OAuth 2.0 (`googleAuth.ts`), Google Drive API v3 + Google Sheets API v4 (`googleSheetsApi.ts`)
- **Armazenamento:** `localStorage` (Persistência Offline Local) + Fila de Sincronização (`SyncQueue`) + Dual Sync (Direct Sheets API / GAS Web App fallback)
- **PWA:** Service Worker nativo (`/public/sw.js`) + Manifest (`/public/manifest.json`)
- **Testes:** Vitest + React Testing Library + JSDOM

---

## 📐 Padrões de Código e Convenções

### **1. Componentes & Estado**
- Mantenha componentes em `/src/components` focados em uma única responsabilidade.
- Utilize o `ToastProvider` (`useToast()`) em `/src/context/ToastContext.tsx` para todas as notificações e feedbacks de ação do usuário.
- Não introduza gerenciadores de estado externos pesados (Redux/Zustand) sem necessidade — o `storageService` unificado atende à persistência local de forma reativa.

### **2. Camada de Dados & Sincronização Resiliente (`/src/services/storage.ts`)**
- Toda comunicação com o `localStorage`, Google Sheets API e Google Apps Script **deve obrigatoriamente passar por `storage` (`StorageService`)**.
- As tabelas seguem o padrão da planilha Google:
  - `Musicas`, `Versoes`, `Cultos`, `Repertorio`, `Integrantes`, `Arquivos`, `Notas`, `Historico`, `Logs`, `Config`.
- **Fila de Sincronização Local (Sync Queue):** Todas as criações, edições e exclusões geram itens na fila persistente `tp_flame_sync_queue_v1`.
- **Dual-Sync Strategy:**
  1. **Primário:** Google Sheets API v4 direta (`https://sheets.googleapis.com/v4/spreadsheets/...`) com token OAuth ativo em memória.
  2. **Fallback:** Google Apps Script Web App executável (`mode: 'no-cors'`).
- **Merge Inteligente (Zero Data Loss):** Ao sincronizar com o Google Sheets, a aplicação processa a fila de mutações pendentes antes de efetuar o pull, e funde os dados locais e remotos garantindo que registros criados localmente nunca sejam sobrescritos ou apagados.

### **3. Motor de Transposição Musical (`/src/utils/chordTransposer.ts`)**
- Cifras no texto são representadas entre colchetes, por exemplo: `[E] Sobre o trono [B] Tu estás [C#m]`.
- Ao modificar o algoritmo de transposição de acordes, **garanta compatibilidade com acordes invertidos (Slash Chords ex: `D/F#`) e extensões (ex: `7M`, `m7(b5)`, `add9`)**.
- Sempre execute `npm test` para validar regressão na transposição cromática.

### **4. Google Workspace OAuth & Sheets Hub**
- Acesso à conta Google gerenciado via `/src/services/googleAuth.ts`.
- Criação com 1 clique de planilhas formatadas de 10 abas no Drive do usuário via `/src/services/googleSheetsApi.ts`.
- Listagem e seleção de planilhas existentes no Google Drive do usuário.

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
