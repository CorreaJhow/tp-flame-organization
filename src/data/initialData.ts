import { ConfigItem, Musica, Versao, Arquivo, Nota, Culto, RepertorioItem, Integrante, HistoricoItem, LogItem } from '../types';

export const INITIAL_CONFIG: ConfigItem[] = [
  { Chave: 'PLATFORM_NAME', Valor: 'TP Flame', Descricao: 'Nome da Plataforma de Gestão de Louvor' },
  { Chave: 'VERSION', Valor: 'V1.0.0', Descricao: 'Versão do Sistema' },
  { Chave: 'CHURCH_NAME', Valor: 'Igreja TP Flame', Descricao: 'Nome do Ministério / Igreja' },
  { Chave: 'DATABASE_TYPE', Valor: 'Google Sheets (Single Source of Truth)', Descricao: 'Tipo de Banco de Dados' }
];

export const INITIAL_MUSICAS: Musica[] = [
  { ID: 'mus-101', Nome: 'Ruja o Leão / Que Ele Cresça', Artista: 'FHOP / Deigma Marques', Categoria: 'Adoração' },
  { ID: 'mus-102', Nome: 'Todavia Me Alegrarei', Artista: 'Samuel Messias', Categoria: 'Adoração' },
  { ID: 'mus-103', Nome: 'A Bênção (The Blessing)', Artista: 'Gabriel Guedes / Nívea Soares', Categoria: 'Celebração' },
  { ID: 'mus-104', Nome: 'Bondade de Deus', Artista: 'Isaias Saad', Categoria: 'Adoração' },
  { ID: 'mus-105', Nome: 'Ninguém Explica Deus', Artista: 'Preto no Branco', Categoria: 'Celebração' },
  { ID: 'mus-106', Nome: 'Vem Eu Sou a Sua Casa', Artista: 'Central 3', Categoria: 'Adoração' },
  { ID: 'mus-107', Nome: 'Efatá', Artista: 'Efatá Praise', Categoria: 'Celebração' },
  { ID: 'mus-108', Nome: 'Eis que Faço uma Coisa Nova', Artista: 'Gabi Sampaio', Categoria: 'Adoração' }
];

export const INITIAL_VERSOES: Versao[] = [
  {
    ID: 'ver-201',
    ID_Musica: 'mus-101',
    Nome_Versao: 'Versão Ao Vivo (Original FHOP)',
    Tom: 'E',
    BPM: 130,
    Compasso: '4/4',
    Letra: `[INTRO]
[E] [B] [C#m] [A]

[VERSO 1]
[E] Sobre o trono de glória
[B] Tu estás sentado
[C#m] Vestido de majestade
[A] E de poder

[REFRÃO]
Que o [E]Leão da tribo de Judá [B]ruja
Que a [C#m]Sua glória encha este [A]lugar
Que [E]Ele cresça e eu [B]diminua
Que [C#m]Ele apareça e eu me [A]esconda

[PONTE]
[C#m]Porque Teu é o Reino, o [A]Poder e a Glória
[E]Para sempre, [B]Amém!`,
    Estrutura: 'INTRO - V1 - REFRÃO - V1 - REFRÃO - PONTE - MINISTRAÇÃO - REFRÃO - OUTRO',
    Obs: 'Tom confortavel para vocal masculino. Transição suave na ponte para "Que Ele Cresça".'
  },
  {
    ID: 'ver-202',
    ID_Musica: 'mus-102',
    Nome_Versao: 'Versão Acústica (Tom G)',
    Tom: 'G',
    BPM: 72,
    Compasso: '4/4',
    Letra: `[INTRO]
[G] [D/F#] [Em7] [C9]

[VERSO 1]
[G] Eu tenho um Deus que não [D/F#]muda
[Em7] O Seu amor nunca [C9]falha
[G] Mesmo no vale da [D/F#]sombra
[Em7] A Sua mão me [C9]sustenta

[REFRÃO]
[G] Todavia me alegrarei no [D/F#]Senhor
[Em7] Exultarei no Deus da minha sal[C9]vação
[G] Ele faz os meus pés como os da [D/F#]cerva
[Em7] E me faz andar sobre as minhas al[C9]turas`,
    Estrutura: 'INTRO - V1 - REFRÃO - V1 - REFRÃO - PONTE - REFRÃO - FINAL',
    Obs: 'Arrannjo acústico com foco em violão de aço e pads sutis.'
  },
  {
    ID: 'ver-203',
    ID_Musica: 'mus-103',
    Nome_Versao: 'Versão Estúdio Gabriel Guedes',
    Tom: 'C',
    BPM: 70,
    Compasso: '6/8',
    Letra: `[INTRO]
[C] [F2] [C] [Gsus4]

[VERSO 1]
Que o [C]Senhor te abençoe e te [F2]guarde
Que o [C]Senhor faça resplandecer o Seu [G]rosto sobre ti
E te dê a [Am7]paz, te dê a [F2]paz

[REFRÃO]
[Am7]Amém, [F2]Amém, [C]A[G]mém
[Am7]Amém, [F2]Amém, [C]A[G]mém

[PONTE]
Que Sua [Am7]graça seja sobre ti
E [F2]mil gerações
Sua fa[C]mília e teus filhos
E os [G]filhos dos teus filhos`,
    Estrutura: 'INTRO - V1 - V1 - REFRÃO - PONTE (3X) - REFRÃO - OUTRO',
    Obs: 'Aumentar a intensidade bateria no terceiro ciclo da ponte.'
  },
  {
    ID: 'ver-204',
    ID_Musica: 'mus-104',
    Nome_Versao: 'Versão Oficial Isaias Saad',
    Tom: 'A',
    Letra: `[INTRO]
[A] [D2] [A] [E/G#]

[VERSO 1]
[A] Te amo Deus, Tua graça nunca [D2]falha
[A] Em todos os dias, em minhas [E/G#]mãos
Desde o [F#m7]alvorecer até o [D2]deitar
[A] Eu cantarei da [E]bondade de [A]Deus

[REFRÃO]
[D2] Tua fidelidade é [A]grande
[D2] Tua bondade me se[A]gue, me se[E]gue
[D2] Com minha vida eu Te lo[A]varei
[F#m7] Eu cantarei da bon[E]dade de [A]Deus`,
    Estrutura: 'INTRO - V1 - REFRÃO - V2 - REFRÃO - PONTE - REFRÃO - OUTRO',
    Obs: 'Entrada marcante de guitarra na segunda parte do refrão.'
  }
];

export const INITIAL_ARQUIVOS: Arquivo[] = [
  { ID: 'arq-301', ID_Versao: 'ver-201', Tipo: 'Youtube', URL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', Nome: 'Vídeo Referência YouTube' },
  { ID: 'arq-302', ID_Versao: 'ver-201', Tipo: 'Cifra', URL: 'https://cifraclub.com.br/ruja-o-leao', Nome: 'Cifra Club Completa' },
  { ID: 'arq-303', ID_Versao: 'ver-202', Tipo: 'PDF', URL: 'https://drive.google.com/file/d/todavia-acustico.pdf', Nome: 'Partitura Teclado/Violão' },
  { ID: 'arq-304', ID_Versao: 'ver-203', Tipo: 'Youtube', URL: 'https://www.youtube.com/watch?v=34Na4j8AVgA', Nome: 'Vídeo de Referência Oficial' }
];

export const INITIAL_NOTAS: Nota[] = [
  { ID: 'not-401', ID_Versao: 'ver-201', Instrumento: 'Teclado', Observacao: 'Manter Pianos + Warm Pad em E no fundo na ministração. Entrar com oitavação na ponte.' },
  { ID: 'not-402', ID_Versao: 'ver-201', Instrumento: 'Guitarra', Observacao: 'Distorção Overdrive suave no verso. Na ponte acionar Shimmer Delay e Riff principal.' },
  { ID: 'not-403', ID_Versao: 'ver-201', Instrumento: 'Bateria', Observacao: 'Inicia apenas no Shaker no V1. Bumbo de quatro na segunda parte do refrão. Groovar forte na ponte.' },
  { ID: 'not-404', ID_Versao: 'ver-201', Instrumento: 'Vocal', Observacao: 'Segunda voz entra a partir do segundo refrão. Terça acima no "Porque Teu é o Reino".' },
  { ID: 'not-405', ID_Versao: 'ver-202', Instrumento: 'Violão', Observacao: 'Dedilhado contínuo em G - D/F# - Em7 - C9. Atenção às notas de passagem.' }
];

export const INITIAL_CULTOS: Culto[] = [
  { ID: 'cul-501', Data: '2026-08-09T19:00', Nome_Evento: 'Culto de Domingo - Celebração Noite', Status: 'Em Preparação', Observacoes: 'Culto de Santa Ceia. Músicas de adoração profunda e momento de ceia.' },
  { ID: 'cul-502', Data: '2026-08-15T19:30', Nome_Evento: 'Flame Night - Culto de Jovens', Status: 'Agendado', Observacoes: 'Repertório com ritmo mais elevado e arranjos modernos.' },
  { ID: 'cul-503', Data: '2026-08-02T19:00', Nome_Evento: 'Culto de Domingo Anterior', Status: 'Realizado', Observacoes: 'Excelente ministração, transição das músicas fluiu muito bem.' }
];

export const INITIAL_REPERTORIO: RepertorioItem[] = [
  { ID: 'rep-601', ID_Culto: 'cul-501', ID_Versao: 'ver-201', Ordem: 1, Dirigente: 'Davi Silva', Observacao_Culto: 'Abertura impactante, oração inicial de 2 min.' },
  { ID: 'rep-602', ID_Culto: 'cul-501', ID_Versao: 'ver-204', Ordem: 2, Dirigente: 'Sarah Costa', Observacao_Culto: 'Música de transição suave sem pausa na bateria.' },
  { ID: 'rep-603', ID_Culto: 'cul-501', ID_Versao: 'ver-203', Ordem: 3, Dirigente: 'Davi Silva', Observacao_Culto: 'Momento da bênção final e ministração na igreja.' },
  { ID: 'rep-604', ID_Culto: 'cul-502', ID_Versao: 'ver-202', Ordem: 1, Dirigente: 'Mateus Lima', Observacao_Culto: 'Versão acústica diferenciada para abertura dos jovens.' }
];

export const INITIAL_INTEGRANTES: Integrante[] = [
  { ID: 'int-701', Nome: 'Davi Silva', Funcao: 'Vocal / Violão', Email: 'davi.silva@tpflame.org', Telefone: '(11) 98765-4321', Ativo: true },
  { ID: 'int-702', Nome: 'Sarah Costa', Funcao: 'Teclado / Vocal', Email: 'sarah.costa@tpflame.org', Telefone: '(11) 97654-3210', Ativo: true },
  { ID: 'int-703', Nome: 'Mateus Lima', Funcao: 'Guitarra Principal', Email: 'mateus.lima@tpflame.org', Telefone: '(11) 96543-2109', Ativo: true },
  { ID: 'int-704', Nome: 'Lucas Oliveira', Funcao: 'Baixo', Email: 'lucas.oliveira@tpflame.org', Telefone: '(11) 95432-1098', Ativo: true },
  { ID: 'int-705', Nome: 'Gabriel Santos', Funcao: 'Bateria', Email: 'gabriel.santos@tpflame.org', Telefone: '(11) 94321-0987', Ativo: true },
  { ID: 'int-706', Nome: 'Beatriz Rocha', Funcao: 'Mídia / Projetor', Email: 'beatriz.rocha@tpflame.org', Telefone: '(11) 93210-9876', Ativo: true }
];

export const INITIAL_HISTORICO: HistoricoItem[] = [
  { ID: 'his-801', ID_Versao: 'ver-201', ID_Culto: 'cul-503', Data_Execucao: '2026-08-02' },
  { ID: 'his-802', ID_Versao: 'ver-202', ID_Culto: 'cul-503', Data_Execucao: '2026-08-02' },
  { ID: 'his-803', ID_Versao: 'ver-204', ID_Culto: 'cul-503', Data_Execucao: '2026-08-02' }
];

export const INITIAL_LOGS: LogItem[] = [
  { ID: 'log-901', Data: new Date().toISOString(), Usuario: 'Sistema TP Flame', Acao: 'INIT_SYSTEM', Registro_Afetado: 'Banco de dados local inicializado' },
  { ID: 'log-902', Data: new Date(Date.now() - 3600000).toISOString(), Usuario: 'Davi Silva', Acao: 'INSERT_REPERTORIO', Registro_Afetado: 'Música adicionada ao Culto de Domingo' }
];
