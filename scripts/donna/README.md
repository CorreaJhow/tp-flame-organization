# Scripts da Donna (via Opera já logado)

Pré-requisito: Opera GX fechado e reaberto com `--remote-debugging-port=9222`, logado no TP Flame. Ao terminar, avisar o Jhow pra reabrir o Opera normal.

- `cifra.mjs <url cifraclub>...` — tom e acordes base de cada cifra (dificuldade).
- `cdp.mjs <url> [js]` — abre aba, avalia JS, imprime. Pra ler a `<pre>` de uma cifra: `"document.querySelector('pre').textContent" 5000 > arquivo.txt`.
- `conv.mjs <arquivo.txt> <Voz>` — converte cifra do Cifra Club pro formato do app (`[Am7]` na letra, `[Voz: X]` por seção).
- `fill.mjs <nome> <artista> <tom> "<estrutura>" <letra.out>` — preenche Cadastrar Música. Sem `SAVE=1` é teste a seco; com `SAVE=1` salva.
- `add-link.mjs "<música>" <url> "<rótulo>" [Youtube|Spotify|Cifra|PDF|Drive|Outro]` — anexa link.

Cuidados: BPM e compasso ficam no padrão (120, 4/4) — ajustar depois. Tom do Cifra Club não é garantia de tom original. "Ministro" só existe quando a música entra num culto.
