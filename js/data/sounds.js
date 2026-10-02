// Sons do alemão que não existem (ou são diferentes) em português, com pares mínimos para treinar o ouvido.
// GLOSS: as palavras dos exemplos e pares — formato "alemão|inglês|português" (também gera os áudios).
export const GLOSS = `
Mutter|mother|mãe
Mütter|mothers|mães
Tür|door|porta
Tier|animal|animal
für|for|para
vier|four|quatro
Kissen|pillow|travesseiro
küssen|to kiss|beijar
schon|already|já
schön|beautiful|bonito
Ofen|oven|forno
Öfen|ovens|fornos
lesen|to read|ler
lösen|to solve|resolver
Tochter|daughter|filha
Töchter|daughters|filhas
Licht|light|luz
lacht|laughs|ri
Nacht|night|noite
nicht|not|não
Buch|book|livro
Bücher|books|livros
rot|red|vermelho
Brot|bread|pão
Rad|wheel|roda
bitte|please|por favor
bitter|bitter|amargo
Lehre|apprenticeship|aprendizado
Lehrer|teacher|professor
Staat|state|estado
Stadt|city|cidade
offen|open|aberto
bieten|to offer|oferecer
bitten|to ask|pedir
Miete|rent|aluguel
Mitte|middle|meio
ein Ei|an egg|um ovo
am Abend|in the evening|à noite
Tag|day|dia
Tage|days|dias
Hund|dog|cachorro
Hunde|dogs|cachorros
Apfel|apple|maçã
Pferd|horse|cavalo
Kopf|head|cabeça
Zeit|time|tempo
zwei|two|dois
singen|to sing|cantar
lang|long|longo
viel|much|muito
Geld|money|dinheiro
Tee|tea|chá
Post|post|correio`;

export const SOUNDS = [
  {
    id: 'u', sym: 'ü', title: 'Ü — "i" com boca de "u"',
    how: ['Fale um "i" comprido: iiii.', 'Sem mudar a língua, faça um biquinho bem redondo, como para assobiar.', 'Pronto: isso é o ü. A língua é do "i", a boca é do "u".'],
    mistake: 'Brasileiro costuma falar "u" (Mutter em vez de Mütter) ou "i" (Tier em vez de Tür) — e muda o sentido!',
    examples: ['fünf', 'die Tür', 'müde'], pairs: [['Mutter', 'Mütter'], ['Tier', 'Tür'], ['vier', 'für'], ['Kissen', 'küssen']],
  },
  {
    id: 'o', sym: 'ö', title: 'Ö — "ê" com boca de "ô"',
    how: ['Fale um "ê" fechado: êêêê.', 'Sem mexer a língua, arredonde os lábios como se fosse falar "ô".', 'Esse som misturado é o ö.'],
    mistake: 'Falar "ô" (schon) quando é ö (schön): "já" vira "bonito".',
    examples: ['schön', 'hören', 'Öfen'], pairs: [['schon', 'schön'], ['Ofen', 'Öfen'], ['lesen', 'lösen'], ['Tochter', 'Töchter']],
  },
  {
    id: 'ich', sym: 'ch', title: 'CH de "ich" — chiado sorrindo',
    how: ['Fale "i" e sorria, com a ponta da língua atrás dos dentes de baixo.', 'Agora sopre o ar forte pelo meio da língua, sem voz: "iiiç".', 'Parece o "ch" de "chá", mas mais pra frente e "sorrindo" — como um gato bravo fazendo "hhh".'],
    mistake: 'Falar "ich" como "iki" ou como "ix" carregado. É um chiado leve, sem a língua encostar em nada.',
    examples: ['ich', 'nicht', 'das Mädchen'], pairs: [['Licht', 'lacht'], ['nicht', 'Nacht']],
  },
  {
    id: 'ach', sym: 'rr', title: 'CH de "Buch" — arranhado na garganta',
    how: ['Aparece depois de a, o, u e au: Buch, Nacht, acht.', 'Sopre o ar raspando lá no fundo da boca, como o "rr" carioca de "carro" ou o "j" do espanhol "jota".', 'Sem voz e sem parar o ar — é um "rrrr" de raspar a garganta.'],
    mistake: 'Falar "k" (Buk) ou "ch" de "chá" (Buch como "buxi").',
    examples: ['das Buch', 'acht', 'die Nacht'], pairs: [['Buch', 'Bücher'], ['Nacht', 'nicht']],
  },
  {
    id: 'r', sym: 'r', title: 'R alemão — de garganta',
    how: ['No começo da sílaba (rot, Brot), o R é feito no fundo da garganta, parecido com o "r" de "rato" no sotaque carioca, mas com voz e mais suave.', 'Nunca é o "r" de "caro" com a ponta da língua batendo.', 'No fim da palavra quase some e vira um "a": Lehrer = "lê-ra", hier = "rria".'],
    mistake: 'Usar o "r" caipira (de "porta" no interior) ou o "r" batido de "caro".',
    examples: ['rot', 'das Brot', 'der Lehrer'], pairs: [['bitte', 'bitter'], ['Lehre', 'Lehrer']],
  },
  {
    id: 'len', sym: 'ː', title: 'Vogal longa × curta',
    how: ['Em alemão a duração da vogal muda o sentido!', 'Longa: vogal + h (Uhr), vogal dobrada (Tee), "ie" (Miete) ou uma consoante só depois (Ofen).', 'Curta: duas consoantes depois (Mitte, offen, Stadt). Fale rápido e "seco".'],
    mistake: 'Falar tudo com o mesmo tamanho, como em português.',
    examples: ['der Tee', 'Miete', 'offen'], pairs: [['Staat', 'Stadt'], ['Ofen', 'offen'], ['bieten', 'bitten'], ['Miete', 'Mitte']],
  },
  {
    id: 'er', sym: 'a', title: '-er no final — vira quase "a"',
    how: ['A terminação -er (Lehrer, Mutter, aber) não se fala "êr".', 'Fale um "a" bem curto e relaxado no final: Mutter = "mu-ta".', 'Já o -e no final é um "ê" fraquinho: bitte = "bi-tê". Nunca "i"!'],
    mistake: 'Ler "bitte" como "biti" e "bitter" como "bitêr". Em alemão: "bi-tê" × "bi-ta".',
    examples: ['der Lehrer', 'die Mutter', 'aber'], pairs: [['bitte', 'bitter'], ['Lehre', 'Lehrer']],
  },
  {
    id: 'knack', sym: '|', title: 'Golpe de glote — não emende as palavras',
    how: ['Palavras que começam com vogal têm um "golpezinho" na garganta antes, como no "a-a" de "uh-oh".', 'Em português a gente emenda: "um ovo" vira "umovo". Em alemão não: "ein | Ei", "am | Abend".', 'Faça uma pausinha seca antes da vogal.'],
    mistake: 'Emendar "ein Ei" como "ai-nai".',
    examples: ['ein Ei', 'am Abend'], pairs: [],
  },
  {
    id: 'final', sym: 'k/t/p', title: 'Final "seco": g→k, d→t, b→p',
    how: ['No fim da palavra (ou da sílaba), g, d e b perdem a voz: Tag = "tak", Hund = "hunt", gelb = "gelp".', 'Quando vem uma vogal depois, voltam ao normal: Tage = "ta-guê", Hunde = "hun-dê".', 'E nunca coloque um "i" no final: "Hund", não "Hundi".'],
    mistake: 'Falar "Tagui", "Hundi" — o brasileiro coloca vogal no fim de tudo.',
    examples: ['der Tag', 'der Hund'], pairs: [['Tag', 'Tage'], ['Hund', 'Hunde']],
  },
  {
    id: 'pf', sym: 'pf / ts', title: 'PF e Z (ts) — dois sons juntos',
    how: ['PF: feche os lábios para um "p" e solte direto num "f": "pf". Apfel = "ap-fel", Pferd = "pfert".', 'Z é sempre "ts", até no começo: zwei = "tsvai", Zeit = "tsait".', 'Em português não começamos palavra assim, então treine devagar com o 🐢.'],
    mistake: 'Falar "Ferd" (sem o p) ou "zvai" com som de z.',
    examples: ['Apfel', 'Pferd', 'Kopf', 'Zeit', 'zwei'], pairs: [],
  },
  {
    id: 'ng', sym: 'ng', title: 'NG — sem o "g"',
    how: ['NG é um som só, feito no fundo da boca, como o "n" de "manga" mas sem soltar o "g".', 'singen = "zin-en" (não "zin-guen"), lang = "lang" com o g mudo.'],
    mistake: 'Pronunciar o g: "lan-gui".',
    examples: ['singen', 'lang'], pairs: [],
  },
  {
    id: 'l', sym: 'l', title: 'L final — continua L',
    how: ['No Brasil o L do fim vira "u" ("Brasiu"). Em alemão não!', 'Encoste a ponta da língua atrás dos dentes de cima e mantenha: viel = "fil", Geld = "guelt".'],
    mistake: 'Falar "fiu" e "gueut".',
    examples: ['viel', 'Geld'], pairs: [],
  },
  {
    id: 'asp', sym: 'pʰ tʰ kʰ', title: 'P, T, K com sopro',
    how: ['No começo da sílaba, p, t e k saem com um sopro de ar, como em inglês.', 'Teste: ponha a mão na frente da boca e fale "Tee", "Kaffee", "Post" — você deve sentir o ar.', 'E o T nunca vira "tchi": Tisch = "tich", não "tchich".'],
    mistake: 'Falar "tchi" e "dji" como no português do Brasil.',
    examples: ['Tee', 'Post', 'der Tisch'], pairs: [],
  },
];
