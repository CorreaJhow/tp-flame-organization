# Histórico de execuções por música

**Objetivo:** ao abrir uma música, ver todas as vezes que a equipe tocou, com data e o tom em que foi tocada; a música continua salva no tom original.

## Decisões (Jhow, 25/11/2026)
- Música fica só no tom original (`Versao.Tom`). Nada de versão duplicada por tom.
- Pode registrar execução **sem criar culto** (atualizar repertório antigo).
- Histórico aparece na música (novo) e nos cultos (já existe, com `Tom_Culto`).

## Critérios de aceite
1. [x] `SongDetailModal` tem a seção **Histórico de execuções**: lista por data (mais recente primeiro) com **tom tocado**, nome do culto/evento e observação; mostra "tom original" quando for igual ao da versão.
2. [x] A lista junta duas fontes sem duplicar: (a) itens de `Repertorio` de cultos não cancelados (tom = `Tom_Culto` ou o original), (b) registros manuais do `Historico`. Se um registro manual apontar para um culto que já tem a música no repertório, conta uma vez só.
3. [x] Botão **Registrar execução**: data, tom (seletor igual ao "Tom do culto"), evento/culto (texto livre ou escolher culto existente) e observação. Dá pra editar e excluir (soft-delete, com confirmação).
4. [x] `HistoricoItem` ganha `Tom_Tocado?`, `Evento?`, `Obs?`; `ID_Culto` passa a opcional. Registros antigos continuam válidos.
5. [x] O selo "Última Execução" (`getLastPlayedInfo`) passa a mostrar o tom ("Tocada há 2 semanas, em Bm"), na Biblioteca, na Música e no Cultos; considera as duas fontes.
6. [x] Escrita passa por `storage` (otimista, `Atualizado_Por`, soft-delete) e funciona offline como o resto.
7. [x] Testes cobrem: união sem duplicar, tom original vs. diferente, culto cancelado fora, ordem por data. `npm run lint`, `npx vitest run` e `npm run build` passam; conferido nos temas escuro e claro (só tokens semânticos; conferência visual no navegador pendente).
8. [ ] Dados: as 8 músicas novas + Era Eu + Meia Noite ganham as execuções que o Jhow passou (feito pela Donna depois da feature, pelo app).

## Fora de escopo
Estatísticas/gráficos, sugestão automática dentro do app, mudar regras do Firestore (não validam campo).

## Dúvidas
- Resolvido (Jhow, 25/11/2026): data aproximada pode (data continua obrigatória no registro); evento/culto é opcional e só entra se o Jhow informar. Não inventar nome de evento.
