# 🔥 TP FLAME — Plataforma de Gestão de Louvor & Cifras PWA

> **A plataforma PWA definitiva para equipes de louvor, ministérios de música e bandas.** 
> Projetada para funcionar **100% offline no palco**, com transposição instantânea de acordes, auto-scroll, gestão de repertório e sincronização em tempo real via **Firebase** (Firestore + login).

---

## 📌 Visão Geral do Projeto

O **TP Flame** foi construído para resolver os principais desafios enfrentados por músicos e líderes de louvor durante os cultos e ensaios:
1. **Falta de Conexão no Palco:** Funcionamento offline contínuo via Service Worker e LocalStorage.
2. **Mudança de Tom de Última Hora:** Transposição cromática instantânea com suporte a acordes complexos e invertidos (Slash Chords ex: `D/F#`).
3. **Quase sem Custo de Servidor:** Backend serverless no **Firebase** (Firestore + Authentication, plano gratuito é suficiente para o uso de uma equipe), com login obrigatório e acesso só para os e-mails da equipe.
4. **Instalável em Qualquer Dispositivo:** Progressive Web App (PWA) instalável no iOS, Android, Windows e Mac.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend & UX**
- **React 18** + **TypeScript**: Tipagem estática rigorosa e componentes modulares.
- **Vite**: Build tool ultrarrápido para desenvolvimento e produção.
- **Tailwind CSS v4**: Estilização responsiva com **tema escuro (padrão) e claro**, ambos por tokens semânticos de cor (`src/index.css`).
- **Lucide React**: Ícones vetoriais modernos e leves.
- **Canvas Confetti**: Feedback visual em ações de sucesso.

### **PWA & Offline First**
- **Service Worker (`sw.js`)**: Estratégia de Cache-First para assets estáticos e fallback inteligente.
- **Web App Manifest (`manifest.json`)**: Suporte a instalação nativa standalone e ícones adaptativos.
- **LocalStorage Storage Engine**: Persistência local contínua com controle de fila de sincronização (`hasPendingSync`).

### **Backend & Banco de Dados**
- **Firebase Authentication**: login por Google ou e-mail/senha; só e-mails da equipe (lista nas Security Rules) leem e escrevem.
- **Cloud Firestore**: 10 coleções (`Config`, `Musicas`, `Versoes`, `Arquivos`, `Notas`, `Cultos`, `Repertorio`, `Integrantes`, `Historico`, `Logs`), com atualização em tempo real e cache offline.
- Histórico: o projeto nasceu em Google Sheets + Apps Script e migrou para Firebase em 09/2026 (ver `docs/PLANO-FASE4-MIGRACAO-FIREBASE.md`). Os arquivos `gasScript.ts`/`googleSheetsApi.ts` são legado.

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
- **Letra sucinta:** no Modo Palco, cada parte repetida aparece uma vez, com a quantidade de vezes (`Refrão (4x)`).
- **Biblioteca A–Z com busca:** ordem alfabética (sem diferenciar acento) e busca por nome, artista, tom ou **trecho da letra**; o mesmo seletor ordenado e com busca aparece ao adicionar música ao culto.
- **Tema claro e escuro:** padrão escuro; botão sol/lua no cabeçalho, em *Mais > Aparência* e dentro do Modo Palco. Escolha salva no aparelho.

### 📅 2. Gestão de Cultos e Repertórios
- **Montagem de Culto:** Criação de eventos com data, horário e status (*Em Preparação*, *Agendado*, *Concluído*).
- **Adição de Músicas com Ordem Customizada:** Definição da sequência do repertório no culto.
- **Tom por culto:** a música fica salva uma vez, no tom original; cada culto guarda o tom em que foi cantada (seletor "Tom do culto" no card). Modo Palco, tela inicial e ficha abrem transpostos para esse tom. Não é preciso duplicar versão só para trocar de tom.
- **Última vez tocada:** vale para a música inteira, em qualquer versão ou tom.
- **Histórico de Execuções:** Registro automático de quando e onde cada música foi tocada para evitar repetições frequentes.

### 👥 3. Equipe e Integrantes
- **Cadastro de Integrantes:** Nome, função principal (Vocal, Teclado, Guita, etc.) e e-mail.
- **Escala de Cultos:** Visualização rápida de quem está escalado para cada ministração.

### 🔄 4. Sincronização & Modo Offline
- **Indicador de Conexão:** Badge visual automático "Offline" quando o dispositivo perde sinal de internet.
- **Fila de Edições Pendentes:** Se o usuário criar ou editar dados offline, o app grava uma flag pendente e sincroniza automaticamente assim que a conexão retornar.
- **Sincronização Manual:** Botão no cabeçalho com indicador de carregamento (`animate-spin`).

### 🔒 5. Login, Área Administrativa & Segurança
- **Login obrigatório:** Google ou e-mail/senha; quem não está na lista da equipe vê a tela de acesso não autorizado.
- **Área Administrativa:** conta logada, saída da conta e ferramentas de manutenção do banco.
- **Zerar Banco de Dados com Trava:** Modal de confirmação que exige a digitação exata da palavra `ZERAR` antes de executar a limpeza dos dados.
- **Security Rules do Firestore:** ficam em `firestore.rules` (fora do git, tem e-mails pessoais; modelo em `firestore.rules.example`). Quem publica é o administrador, no Firebase Console.

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
- **`theme.test.ts` / `themeContrast.test.ts`**: tema (padrão, persistência, `theme-color`) e contraste WCAG AA dos tokens de cor nos dois temas.
- **`songSearch.test.ts` / `songHistory.test.ts`**: ordem A–Z, busca por letra e última execução por música.
- **`chordTransposer.test.ts`** também cobre `keyOffset` (distância entre tons, usada no tom do culto).

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
│   ├── context/            # Contextos React (Auth, Toast)
│   ├── services/           # Camada de Dados (StorageService + Firestore)
│   ├── utils/              # Utilitários (ChordTransposer, SongHistory, SongSearch, theme)
│   ├── types.ts            # Interfaces e Tipos do TypeScript
│   ├── App.tsx             # Componente Raiz
│   └── main.tsx            # Entry Point do React
├── docs/                   # ESTADO-ATUAL.md (comece por ele), arquitetura e planos
├── specs/                  # Especificações de features (SPEC.md por feature)
├── CLAUDE.md               # Contexto e Padrões de Projeto para IA
├── package.json
├── README.md               # Documentação Oficial do Projeto
└── vite.config.ts
```

---

## 📄 Licença

Este projeto foi desenvolvido para gestão de louvor e ministérios de música. Livre para uso e customizações! 🚀🔥
