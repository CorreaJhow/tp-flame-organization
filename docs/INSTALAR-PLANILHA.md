# 🗃️ Instalar a planilha do TP Flame do zero

Cinco passos, uma vez só. No fim, o app inteiro aponta para **uma** planilha, e
não existe segundo lugar onde a configuração possa divergir.

> Por que isso importa: em 21/08/2026 o app chegou a ter **três destinos de
> escrita ao mesmo tempo** — gravava numa planilha estando logado no Google e
> em outra estando deslogado, e uma terceira recebia a implantação mais nova.
> Dado que parecia sumir estava em outra planilha o tempo todo. O procedimento
> abaixo torna isso impossível: o app não guarda mais o ID da planilha, ele
> **pergunta ao endpoint** qual planilha atender.

---

## 1. Criar a planilha

No Google Drive: **Novo > Planilhas Google**. Nomeie como
`TP Flame - Banco de Dados`.

Não crie aba nenhuma à mão — o script faz isso.

## 2. Colar o script

Na planilha: **Extensões > Apps Script**.

Apague o `function myFunction() {}` que vem por padrão e cole todo o conteúdo
de [`src/data/gasScript.ts`](../src/data/gasScript.ts) — apenas o código de
dentro das crases, sem a linha `export const ...` do começo nem a crase final.

No app, o botão **Ver Código do Script** no painel admin já mostra o conteúdo
pronto para copiar.

Salve (💾).

## 3. Rodar `bootstrap()`

No editor do Apps Script, selecione a função **`bootstrap`** no seletor do topo
e clique em **Executar**.

Na primeira vez o Google pede autorização — é esperado, o script vai mexer na
sua planilha e no seu Drive. Aceite.

O `bootstrap()` faz tudo de uma vez:

- cria e formata as 10 abas com os cabeçalhos corretos
- liga o backup automático diário às 03:00
- imprime o ID e a URL da planilha no *Registro de execução*

## 4. Publicar como App da Web

**Implantar > Nova implantação > tipo: App da Web**

| Campo | Valor |
|---|---|
| Executar como | **Eu** |
| Quem tem acesso | **Qualquer pessoa** |

Copie a **URL do App da Web** — termina em `/exec`.

> ⚠️ Ao alterar o script depois, é preciso **Implantar > Gerenciar implantações
> > editar (lápis) > Versão: Nova versão**. Editar o código sem republicar
> deixa a versão antiga no ar — foi exatamente o que causou o drift entre o
> repositório e a produção.

## 5. Conectar o app

Duas opções:

**Definitiva (para toda a equipe):** defina `VITE_GAS_ENDPOINT` nas variáveis
de ambiente da Vercel — *Settings > Environment Variables* — ou, na falta dela,
edite `FALLBACK_GAS_ENDPOINT` em
[`src/services/storage.ts`](../src/services/storage.ts).

Em qualquer um dos dois casos, **incremente o `CONFIG_VERSION`** logo abaixo. É
o incremento que faz cada celular já em uso adotar o backend novo; sem ele o
valor em cache no `localStorage` continua vencendo e o aparelho fica preso na
planilha antiga.

> ⚠️ A variável de ambiente **não esconde a URL**. Todo `VITE_*` é embutido no
> bundle durante o build e aparece no DevTools de qualquer visitante. Ela serve
> para trocar de planilha sem commit e separar produção de testes. Restringir
> de fato quem lê e escreve exige um intermediário no servidor — Fase 3.

**Rápida (só neste aparelho):** painel admin do app > **URL da Web App
Executável** > colar > **Salvar Conexão**. O app detecta a planilha sozinho e
mostra o nome dela.

---

## Conferir se ficou certo

Abra no navegador, trocando pela sua URL:

```
https://script.google.com/macros/s/SEU_ID/exec?action=whoami
```

Deve responder algo como:

```json
{
  "status": "success",
  "spreadsheetId": "1AbC...",
  "spreadsheetName": "TP Flame - Banco de Dados",
  "schemaVersion": 2
}
```

Se `schemaVersion` vier menor que o `SCHEMA_VERSION` de
[`googleSheetsApi.ts`](../src/services/googleSheetsApi.ts), a planilha está
atrás do código: rode `bootstrap()` de novo e republique.

Feito isso, o teste de verdade é salvar uma música no app e conferir se aparece
**uma** linha na aba `Musicas` — não duas.

---

## Manutenção

| Situação | O que rodar |
|---|---|
| Planilha com duplicatas, linhas vazias ou logs demais | `repairDatabase()` — tira backup antes de remover qualquer coisa |
| Backup manual agora | `createBackup()` — vai para a pasta `TP Flame - Backups` |
| Backup diário parou | `setupDailyBackupTrigger()` |
| Aba nova ou coluna nova no esquema | `bootstrap()`, depois republicar a implantação |

## O que **não** vai para a planilha

O **PIN dos integrantes** fica só no dispositivo, de propósito. A planilha é
servida por um Web App público: qualquer pessoa com a URL lê o conteúdo. Guardar
PIN ali seria publicar a senha de todo mundo.

E-mail e telefone dos integrantes **estão** na planilha, e portanto são
igualmente públicos para quem tiver a URL. Fechar isso é assunto da Fase 3 —
está registrado no diagnóstico.
