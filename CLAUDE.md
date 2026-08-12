# 🧠 CLAUDE.md — Diretrizes e Contexto do Projeto TP Flame

Este arquivo reúne todas as convenções, arquitetura, padrões de código e instruções de desenvolvimento para manter a consistência do projeto **TP Flame** durante a evolução por assistentes de IA e desenvolvedores.

---

## 🎯 Propósito do Projeto
O **TP Flame** é uma plataforma Progressive Web App (PWA) para equipes de louvor e ministérios de música. Ele combina transposição instantânea de cifras, gestão de repertório e cultos, com suporte a funcionamento 100% offline no palco e sincronização serverless com o **Google Sheets** via **Google Apps Script (GAS)**.

---

## 🛠️ Tech Stack & Bibliotecas Padrão

- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS (Dark Mode nativo `#080808` / `#121212` com acentos em Laranja Chama `#FF4D00`)
- **Ícones:** `lucide-react`
- **Armazenamento:** `localStorage` (Persistência Offline Local) + Google Apps Script API (`/exec` endpoint)
- **PWA:** Service Worker nativo (`/public/sw.js`) + Manifest (`/public/manifest.json`)
- **Testes:** Vitest + React Testing Library + JSDOM

---

## 📐 Padrões de Código e Convenções

### **1. Componentes & Estado**
- Mantenha componentes em `/src/components` focados em uma única responsabilidade.
- Utilize o `ToastProvider` (`useToast()`) em `/src/context/ToastContext.tsx` para todas as notificações e feedbacks de ação do usuário.
- Não introduza gerenciadores de estado externos pesados (Redux/Zustand) sem necessidade — o `storageService` unificado atende à persistência local de forma reativa.

### **2. Camada de Dados (`/src/services/storage.ts`)**
- Toda comunicação com o `localStorage` e solicitações ao Google Apps Script (GAS) **devem obrigatoriamente passar por `storage` (`StorageService`)**.
- As tabelas seguem o padrão da planilha Google:
  - `Musicas`, `Versoes`, `Cultos`, `Repertorio`, `Integrantes`, `Arquivos`, `Notas`, `Historico`, `Logs`, `Config`.
- Sempre que houver mutação de dados local sem sincronização imediata, invoque `storage.markPendingSync()`.

### **3. Motor de Transposição Musical (`/src/utils/chordTransposer.ts`)**
- Cifras no texto são representadas entre colchetes, por exemplo: `[E] Sobre o trono [B] Tu estás [C#m]`.
- Ao modificar o algoritmo de transposição de acordes, **garanta compatibilidade com acordes invertidos (Slash Chords ex: `D/F#`) e extensões (ex: `7M`, `m7(b5)`, `add9`)**.
- Sempre execute `npm test` para validar regressão na transposição cromática.

### **4. Google Apps Script (GAS Integration)**
- Endpoint PWA Oficial Configurado: `https://script.google.com/macros/s/AKfycbyM3rjR09i9uFi-JaE1dac3CNbTWEejhmcUdh54A2C6iHzBGndlmR5LEqT2YJN495hI/exec`
- O backend no Apps Script recebe requisições `doGet` (ação `getAll`) e `doPost` (ação `insert`).
- Se houver falha de rede na sincronização, a aplicação deve falhar de forma graciosa sem travar o app ou apagar o cache local.

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
