# 🔥 TP FLAME — Plataforma de Gestão de Louvor & Cifras PWA

> **A plataforma PWA definitiva para equipes de louvor, ministérios de música e bandas.** 
> Projetada para funcionar **100% offline no palco**, com transposição instantânea de acordes, auto-scroll, gestão de repertório e sincronização em tempo real via **Google Sheets + Google Apps Script (GAS)**.

---

## 📌 Visão Geral do Projeto

O **TP Flame** foi construído para resolver os principais desafios enfrentados por músicos e líderes de louvor durante os cultos e ensaios:
1. **Falta de Conexão no Palco:** Funcionamento offline contínuo via Service Worker e LocalStorage.
2. **Mudança de Tom de Última Hora:** Transposição cromática instantânea com suporte a acordes complexos e invertidos (Slash Chords ex: `D/F#`).
3. **Sem Custo de Servidor (Zero Infrastructure Cost):** Backend serverless rodando no **Google Apps Script** gravando em uma planilha do **Google Sheets** organizada com 10 abas relacionais.
4. **Instalável em Qualquer Dispositivo:** Progressive Web App (PWA) instalável no iOS, Android, Windows e Mac.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend & UX**
- **React 18** + **TypeScript**: Tipagem estática rigorosa e componentes modulares.
- **Vite**: Build tool ultrarrápido para desenvolvimento e produção.
- **Tailwind CSS**: Estilização moderna, responsiva e otimizada para modo escuro no palco.
- **Lucide React**: Ícones vetoriais modernos e leves.
- **Canvas Confetti**: Feedback visual em ações de sucesso.

### **PWA & Offline First**
- **Service Worker (`sw.js`)**: Estratégia de Cache-First para assets estáticos e fallback inteligente.
- **Web App Manifest (`manifest.json`)**: Suporte a instalação nativa standalone e ícones adaptativos.
- **LocalStorage Storage Engine**: Persistência local contínua com controle de fila de sincronização (`hasPendingSync`).

### **Backend & Banco de Dados**
- **Google Apps Script (GAS)**: API Serverless em Javascript conectada via endpoints `doGet` e `doPost`.
- **Google Sheets**: Banco de dados relacional sem custos, estruturado em 10 tabelas:
  - `Config`, `Musicas`, `Versoes`, `Arquivos`, `Notas`, `Cultos`, `Repertorio`, `Integrantes`, `Historico`, `Logs`.

### **Garantia de Qualidade (QA & Testing)**
- **Vitest**: Test-runner de alta performance integrado ao Vite.
- **React Testing Library** + **JSDOM**: Testes de integração de componentes e ações de usuário.

---

## ✨ Funcionalidades Principais

### 🎵 1. Músicas, Cifras e Transposição
- **Transposição Cromática Instantânea:** Altere o tom da cifra em semitonos (`+1`, `-1`, `+2`, etc.).
- **Suporte a Acordes Invertidos e Extensões:** Reconhece e transpõe notas como `C7M`, `F#m7(b5)`, `Bb9` e acordes com baixo alterado como `D/F#` ➔ `E/G#`.
- **Auto-scroll para Palco:** Rolagem automática de tela com controle de velocidade ajustável.
- **Observações por Instrumento:** Anotações específicas para Teclado, Violão, Guitarra, Baixo, Bateria e Vocal.
- **Links Úteis Embutidos:** Atalhos para áudios no Spotify, YouTube, Cifra Club e arquivos de arranjo.

### 📅 2. Gestão de Cultos e Repertórios
- **Montagem de Culto:** Criação de eventos com data, horário e status (*Em Preparação*, *Agendado*, *Concluído*).
- **Adição de Músicas com Ordem Customizada:** Definição da sequência do repertório no culto.
- **Histórico de Execuções:** Registro automático de quando e onde cada música foi tocada para evitar repetições frequentes.

### 👥 3. Equipe e Integrantes
- **Cadastro de Integrantes:** Nome, função principal (Vocal, Teclado, Guita, etc.) e e-mail.
- **Escala de Cultos:** Visualização rápida de quem está escalado para cada ministração.

### 🔄 4. Sincronização & Modo Offline
- **Indicador de Conexão:** Badge visual automático "Offline" quando o dispositivo perde sinal de internet.
- **Fila de Edições Pendentes:** Se o usuário criar ou editar dados offline, o app grava uma flag pendente e sincroniza automaticamente assim que a conexão retornar.
- **Sincronização Manual:** Botão no cabeçalho com indicador de carregamento (`animate-spin`).

### 🔒 5. Área Administrativa & Segurança
- **Proteção por Senha:** Acesso restrito ao painel de conexão e gerenciamento de banco de dados.
- **Guia Ilustrado do GAS:** Instruções detalhadas passo a passo de como publicar e atualizar a URL da Web App no Google Apps Script.
- **Zerar Banco de Dados com Trava:** Modal de confirmação que exige a digitação exata da palavra `ZERAR` antes de executar a limpeza dos dados.

---

## 🧪 Estrutura de Testes Automatizados

O projeto conta com suíte de testes automatizados pronta para ser executada via terminal:

```bash
npm test
```

### **Módulos Testados:**
- **`chordTransposer.test.ts`**: Testes unitários do algoritmo musical e regex de cifras.
- **`storage.test.ts`**: Testes da engine de armazenamento local e sincronização com GAS.
- **`pwaServiceWorker.test.ts`**: Validação das configurações PWA, ícones e arquivos do Service Worker.
- **`uiComponents.test.tsx`**: Testes de componentes React (Header e modal de trava do AdminView).

---

## 🚀 Como Rodar o Projeto Localmente

### **Pré-requisitos:**
- Node.js 18+ instalado
- npm ou yarn

### **Passos:**
```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Executar a suíte de testes
npm test

# 4. Gerar o build de produção
npm run build
```

---

## 📐 Estrutura de Diretórios

```
/
├── public/
│   ├── icon-192.svg        # Ícone PWA (192x192)
│   ├── icon-512.svg        # Ícone PWA (512x512)
│   ├── manifest.json       # Web App Manifest
│   └── sw.js               # Service Worker
├── src/
│   ├── __tests__/          # Suíte de Testes Automatizados (Vitest)
│   ├── components/         # Componentes React (Header, SongList, AdminView, etc.)
│   ├── context/            # Contextos React (ToastContext)
│   ├── services/           # Camada de Dados (StorageService, GAS Client)
│   ├── utils/              # Funções Utilitárias (ChordTransposer, SongHistory)
│   ├── types.ts            # Interfaces e Tipos do TypeScript
│   ├── App.tsx             # Componente Raiz
│   └── main.tsx            # Entry Point do React
├── CLAUDE.md               # Contexto e Padrões de Projeto para IA
├── package.json
├── README.md               # Documentação Oficial do Projeto
└── vite.config.ts
```

---

## 📄 Licença

Este projeto foi desenvolvido para gestão de louvor e ministérios de música. Livre para uso e customizações! 🚀🔥
