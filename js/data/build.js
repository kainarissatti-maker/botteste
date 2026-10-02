// Módulo "Montar frases": níveis de estrutura da frase alemã.
// Cada frase: blocos "PAPEL=texto" separados por " / ", depois "¦ inglês ¦ português" e, opcional, "¦ ordem alternativa aceita".
// Papéis: S sujeito · V verbo conjugado · O objeto/complemento · T tempo · L lugar · M modo/adjetivo
//         N negação · I fim da frase (infinitivo, particípio, prefixo) · C conector · Q palavra de pergunta
export const ROLES = {
  S: { pt: 'Sujeito', en: 'Subject', de: 'Subjekt' },
  V: { pt: 'Verbo', en: 'Verb', de: 'Verb' },
  O: { pt: 'Complemento', en: 'Object', de: 'Objekt' },
  T: { pt: 'Tempo', en: 'Time', de: 'Zeit' },
  L: { pt: 'Lugar', en: 'Place', de: 'Ort' },
  M: { pt: 'Modo', en: 'Manner', de: 'Art' },
  N: { pt: 'Negação', en: 'Negation', de: 'Negation' },
  I: { pt: 'Fim (2º verbo)', en: 'End (2nd verb)', de: 'Satzende' },
  C: { pt: 'Conector', en: 'Connector', de: 'Konnektor' },
  Q: { pt: 'Pergunta', en: 'Question word', de: 'Fragewort' },
};

export const LEVELS = [
  {
    id: 'sv', icon: '🧱', title: 'Sujeito + verbo',
    rule: 'Toda frase alemã tem sujeito e verbo. O verbo muda a terminação conforme a pessoa — igual ao português (eu falo, você fala), só que com outras letras.',
    formula: ['S', 'V'],
    tips: ['ich → -e (ich lerne)', 'du → -st (du lernst)', 'er / sie / es → -t (er lernt)', 'wir → -en (wir lernen)', 'ihr → -t (ihr lernt)', 'sie / Sie → -en (sie lernen)'],
    conj: ['lernen', 'wohnen', 'kommen', 'spielen', 'machen', 'trinken', 'kaufen', 'kochen', 'fragen', 'hören'],
    lines: `
S=Ich / V=lerne ¦ I learn ¦ Eu aprendo
S=Du / V=lernst ¦ You learn ¦ Você aprende
S=Er / V=arbeitet ¦ He works ¦ Ele trabalha
S=Wir / V=wohnen / L=in Berlin ¦ We live in Berlin ¦ Nós moramos em Berlim
S=Sie / V=kommt / L=aus Brasilien ¦ She comes from Brazil ¦ Ela vem do Brasil
S=Ihr / V=spielt ¦ You all play ¦ Vocês jogam
S=Die Kinder / V=spielen ¦ The children play ¦ As crianças brincam`,
  },
  {
    id: 'svo', icon: '➕', title: 'Verbo + complemento',
    rule: 'Depois do verbo vem o resto: o que você bebe, compra, lê… A base é Sujeito → Verbo → Complemento, igual ao português.',
    formula: ['S', 'V', 'O'],
    tips: ['Ich trinke Kaffee = Eu bebo café', 'Masculino vira "einen" depois do verbo: Ich habe einen Hund'],
    lines: `
S=Ich / V=trinke / O=Kaffee ¦ I drink coffee ¦ Eu bebo café
S=Du / V=hast / O=einen Hund ¦ You have a dog ¦ Você tem um cachorro
S=Er / V=kauft / O=Brot ¦ He buys bread ¦ Ele compra pão
S=Wir / V=lernen / O=Deutsch ¦ We learn German ¦ Nós aprendemos alemão
S=Sie / V=liest / O=ein Buch ¦ She reads a book ¦ Ela lê um livro
S=Ich / V=brauche / O=einen Computer ¦ I need a computer ¦ Eu preciso de um computador
S=Mein Bruder / V=spricht / O=Englisch ¦ My brother speaks English ¦ Meu irmão fala inglês`,
  },
  {
    id: 'v2', icon: '2️⃣', title: 'Verbo sempre na 2ª posição', lockFirst: true,
    rule: 'A regra de ouro do alemão: o verbo é SEMPRE o 2º bloco. Se a frase começa com outra coisa (Heute, Morgen, In Berlin…), o sujeito pula para depois do verbo.',
    formula: ['T', 'V', 'S', 'O'],
    tips: ['Ich lerne heute Deutsch ✓', 'Heute lerne ich Deutsch ✓ (verbo continua em 2º!)', 'Heute ich lerne Deutsch ✗ — erro clássico de brasileiro'],
    lines: `
T=Heute / V=lerne / S=ich / O=Deutsch ¦ Today I am learning German ¦ Hoje eu aprendo alemão ¦ Ich lerne heute Deutsch
T=Morgen / V=arbeite / S=ich ¦ Tomorrow I work ¦ Amanhã eu trabalho ¦ Ich arbeite morgen
L=In Berlin / V=wohnen / S=viele Leute ¦ Many people live in Berlin ¦ Em Berlim moram muitas pessoas
T=Am Montag / V=habe / S=ich / O=einen Termin ¦ On Monday I have an appointment ¦ Na segunda eu tenho um compromisso
T=Jetzt / V=trinken / S=wir / O=Tee ¦ Now we drink tea ¦ Agora nós bebemos chá
T=Am Abend / V=kocht / S=mein Vater ¦ In the evening my father cooks ¦ À noite meu pai cozinha
O=Deutsch / V=finde / S=ich / M=schön ¦ I find German beautiful ¦ Eu acho o alemão bonito`,
  },
  {
    id: 'q', icon: '❓', title: 'Perguntas',
    rule: 'Pergunta de sim/não: o verbo vai para a 1ª posição. Pergunta com W (was, wo, wann, warum, wie): a palavra W vem primeiro e o verbo continua em 2º.',
    formula: ['Q', 'V', 'S'],
    tips: ['Du trinkst Kaffee. → Trinkst du Kaffee?', 'Was machst du? Wo wohnst du? Wann kommst du?'],
    lines: `
V=Trinkst / S=du / O=Kaffee ¦ Do you drink coffee? ¦ Você bebe café?
V=Kommst / S=du / L=aus Brasilien ¦ Do you come from Brazil? ¦ Você é do Brasil?
V=Hast / S=du / T=heute / O=Zeit ¦ Do you have time today? ¦ Você tem tempo hoje?
Q=Was / V=machst / S=du ¦ What are you doing? ¦ O que você está fazendo?
Q=Wo / V=wohnst / S=du ¦ Where do you live? ¦ Onde você mora?
Q=Wann / V=beginnt / S=der Kurs ¦ When does the course start? ¦ Quando começa o curso?
Q=Warum / V=lernst / S=du / O=Deutsch ¦ Why are you learning German? ¦ Por que você aprende alemão?`,
  },
  {
    id: 'neg', icon: '🚫', title: 'Negação: nicht e kein',
    rule: '"kein" nega substantivos sem artigo definido (keine Zeit, kein Auto). "nicht" nega o resto e geralmente vai perto do fim, antes do que está sendo negado.',
    formula: ['S', 'V', 'N'],
    tips: ['Ich habe kein Auto = Eu não tenho carro', 'Ich komme nicht = Eu não venho', 'Das ist nicht teuer = Isso não é caro'],
    lines: `
S=Ich / V=komme / N=nicht ¦ I am not coming ¦ Eu não venho
S=Das / V=ist / N=nicht / M=teuer ¦ That is not expensive ¦ Isso não é caro
S=Ich / V=habe / N=keine Zeit ¦ I have no time ¦ Eu não tenho tempo
S=Er / V=trinkt / N=keinen Kaffee ¦ He doesn't drink coffee ¦ Ele não bebe café
S=Wir / V=arbeiten / T=heute / N=nicht ¦ We are not working today ¦ Nós não trabalhamos hoje
S=Sie / V=hat / N=kein Auto ¦ She has no car ¦ Ela não tem carro
S=Ich / V=verstehe / O=das / N=nicht ¦ I don't understand that ¦ Eu não entendo isso`,
  },
  {
    id: 'modal', icon: '💪', title: 'Verbos modais: 2º verbo no FIM',
    rule: 'Com können, müssen, wollen, möchten, dürfen: o modal fica em 2º e o outro verbo vai, no infinitivo, para o FINAL da frase. É como uma "moldura" em volta do resto.',
    formula: ['S', 'V', 'O', 'I'],
    tips: ['Ich kann gut schwimmen.', 'Ich muss heute arbeiten.', 'Ich möchte einen Kaffee trinken.'],
    lines: `
S=Ich / V=kann / M=gut / I=schwimmen ¦ I can swim well ¦ Eu sei nadar bem
S=Ich / V=muss / T=heute / I=arbeiten ¦ I have to work today ¦ Eu tenho que trabalhar hoje
S=Du / V=darfst / L=hier / N=nicht / I=rauchen ¦ You may not smoke here ¦ Você não pode fumar aqui
S=Wir / V=wollen / L=nach Deutschland / I=fahren ¦ We want to go to Germany ¦ Nós queremos ir para a Alemanha
S=Ich / V=möchte / O=einen Kaffee / I=trinken ¦ I would like to drink a coffee ¦ Eu gostaria de beber um café
V=Kannst / S=du / O=mir / I=helfen ¦ Can you help me? ¦ Você pode me ajudar?
S=Er / V=will / O=Informatiker / I=werden ¦ He wants to become an IT specialist ¦ Ele quer se tornar técnico de informática`,
  },
  {
    id: 'sep', icon: '✂️', title: 'Verbos separáveis',
    rule: 'Alguns verbos se partem em dois: anrufen, aufstehen, einkaufen, abfahren… A parte principal fica em 2º e o prefixo vai para o FIM da frase.',
    formula: ['S', 'V', 'T', 'I'],
    tips: ['aufstehen → Ich stehe um 7 Uhr auf.', 'anrufen → Ich rufe dich morgen an.'],
    lines: `
S=Ich / V=stehe / T=um sieben Uhr / I=auf ¦ I get up at seven o'clock ¦ Eu me levanto às sete horas
S=Ich / V=rufe / O=dich / T=morgen / I=an ¦ I'll call you tomorrow ¦ Eu te ligo amanhã
S=Wir / V=kaufen / T=heute / I=ein ¦ We go shopping today ¦ Nós fazemos compras hoje
S=Der Zug / V=fährt / T=um acht Uhr / I=ab ¦ The train departs at eight o'clock ¦ O trem parte às oito horas
S=Er / V=kommt / T=morgen / I=an ¦ He arrives tomorrow ¦ Ele chega amanhã
V=Machst / S=du / O=das Fenster / I=auf ¦ Are you opening the window? ¦ Você abre a janela?
S=Ich / V=sehe / T=am Abend / I=fern ¦ I watch TV in the evening ¦ Eu vejo TV à noite`,
  },
  {
    id: 'tekamolo', icon: '🧭', title: 'Ordem: tempo → modo → lugar',
    rule: 'Quando a frase tem vários complementos, a ordem é TeKaMoLo: Tempo (quando) → Causa (por quê) → Modo (como) → Lugar (onde). Em português a gente costuma falar o lugar antes — em alemão ele vai por último.',
    formula: ['S', 'V', 'T', 'M', 'L'],
    tips: ['Ich fahre morgen mit dem Bus zur Arbeit.', 'Quando? morgen · Como? mit dem Bus · Onde? zur Arbeit'],
    lines: `
S=Ich / V=fahre / T=morgen / M=mit dem Bus / L=zur Arbeit ¦ Tomorrow I'm going to work by bus ¦ Amanhã eu vou de ônibus para o trabalho
S=Wir / V=gehen / T=am Samstag / M=zusammen / L=ins Kino ¦ On Saturday we're going to the cinema together ¦ No sábado nós vamos juntos ao cinema
S=Sie / V=arbeitet / T=jeden Tag / M=gern / L=im Büro ¦ She likes working in the office every day ¦ Ela gosta de trabalhar no escritório todos os dias
S=Er / V=fliegt / T=im Mai / M=allein / L=nach Brasilien ¦ He is flying alone to Brazil in May ¦ Ele voa sozinho para o Brasil em maio
S=Ich / V=lerne / T=jeden Abend / M=mit der App / O=Deutsch ¦ I learn German with the app every evening ¦ Eu estudo alemão com o app toda noite`,
    grow: `
S=Ich / V=lerne ¦ I learn ¦ Eu estudo
S=Ich / V=lerne / O=Deutsch ¦ I learn German ¦ Eu estudo alemão
S=Ich / V=lerne / T=jeden Tag / O=Deutsch ¦ I learn German every day ¦ Eu estudo alemão todo dia
S=Ich / V=lerne / T=jeden Tag / M=mit der App / O=Deutsch ¦ I learn German with the app every day ¦ Eu estudo alemão com o app todo dia
T=Jeden Tag / V=lerne / S=ich / M=mit der App / O=Deutsch ¦ Every day I learn German with the app ¦ Todo dia eu estudo alemão com o app`,
  },
  {
    id: 'perfekt', icon: '⏪', title: 'Passado (Perfekt)',
    rule: 'Para falar do passado: haben (ou sein, para movimento e mudança) em 2º + particípio (ge…t / ge…en) no FIM. É a mesma "moldura" dos modais.',
    formula: ['S', 'V', 'O', 'I'],
    tips: ['lernen → gelernt: Ich habe Deutsch gelernt.', 'fahren → gefahren (com sein): Ich bin nach Berlin gefahren.'],
    lines: `
S=Ich / V=habe / O=Deutsch / I=gelernt ¦ I learned German ¦ Eu aprendi alemão
S=Wir / V=haben / O=Pizza / I=gegessen ¦ We ate pizza ¦ Nós comemos pizza
S=Er / V=hat / T=gestern / I=gearbeitet ¦ He worked yesterday ¦ Ele trabalhou ontem
S=Ich / V=bin / L=nach Berlin / I=gefahren ¦ I went to Berlin ¦ Eu fui para Berlim
S=Sie / V=ist / T=heute / M=früh / I=aufgestanden ¦ She got up early today ¦ Ela se levantou cedo hoje
T=Gestern / V=habe / S=ich / O=meine Mutter / I=angerufen ¦ Yesterday I called my mother ¦ Ontem eu liguei para minha mãe
V=Hast / S=du / O=das / I=verstanden ¦ Did you understand that? ¦ Você entendeu isso?`,
  },
  {
    id: 'conj1', icon: '🔗', title: 'und, aber, oder, denn',
    rule: 'Esses 4 conectores juntam duas frases SEM mudar a ordem: depois deles a frase continua normal (sujeito + verbo). Antes de aber e denn vai vírgula.',
    formula: ['S', 'V', 'C', 'S', 'V'],
    tips: ['und = e · aber = mas · oder = ou · denn = pois/porque', 'Ich lerne Deutsch, denn ich will in Deutschland arbeiten.'],
    lines: `
S=Ich / V=lerne / O=Deutsch / C=und / S=ich / V=arbeite / L=im Büro ¦ I learn German and I work in the office ¦ Eu aprendo alemão e trabalho no escritório
S=Das Wetter / V=ist / M=schlecht / C=aber / S=wir / V=gehen / L=in den Park ¦ The weather is bad, but we go to the park ¦ O tempo está ruim, mas nós vamos ao parque
V=Trinkst / S=du / O=Tee / C=oder / V=möchtest / S=du / O=Kaffee ¦ Do you drink tea or would you like coffee? ¦ Você bebe chá ou quer café?
S=Ich / V=lerne / O=Deutsch / C=denn / S=ich / V=will / L=in Deutschland / I=arbeiten ¦ I learn German because I want to work in Germany ¦ Eu aprendo alemão, pois quero trabalhar na Alemanha
S=Er / V=ist / M=müde / C=denn / S=er / V=hat / M=viel / I=gearbeitet ¦ He is tired because he worked a lot ¦ Ele está cansado, pois trabalhou muito`,
  },
  {
    id: 'weil', icon: '🎯', title: 'weil, dass, wenn: verbo no FIM',
    rule: 'Depois de weil (porque), dass (que) e wenn (quando/se) o verbo conjugado vai para o FINAL. Isso é o que mais diferencia o alemão — e é muito cobrado na prova B1!',
    formula: ['S', 'V', 'C', 'S', 'O', 'V'],
    tips: ['…, weil ich krank bin.', '…, dass der Kurs gut ist.', 'Com modal: …, weil ich in Deutschland arbeiten will.'],
    lines: `
S=Ich / V=lerne / O=Deutsch / C=weil / S=ich / L=in Deutschland / I=arbeiten / V=will ¦ I learn German because I want to work in Germany ¦ Eu aprendo alemão porque quero trabalhar na Alemanha
S=Ich / V=bleibe / L=zu Hause / C=weil / S=ich / M=krank / V=bin ¦ I stay at home because I am sick ¦ Eu fico em casa porque estou doente
S=Ich / V=glaube / C=dass / S=der Kurs / M=gut / V=ist ¦ I believe that the course is good ¦ Eu acho que o curso é bom
S=Er / V=sagt / C=dass / S=er / T=morgen / V=kommt ¦ He says that he is coming tomorrow ¦ Ele diz que vem amanhã
S=Wir / V=gehen / L=an den Strand / C=wenn / S=die Sonne / V=scheint ¦ We go to the beach when the sun shines ¦ Nós vamos à praia quando o sol brilha
S=Ich / V=bin / M=glücklich / C=weil / S=ich / O=eine Ausbildung / I=gefunden / V=habe ¦ I am happy because I found an apprenticeship ¦ Eu estou feliz porque encontrei uma Ausbildung`,
  },
  {
    id: 'long', icon: '🚀', title: 'Frases longas',
    rule: 'Agora é juntar tudo: verbo em 2º, complementos na ordem tempo → modo → lugar, e weil/dass com o verbo no fim. Monte devagar, bloco por bloco.',
    formula: ['T', 'V', 'S', 'M', 'L', 'C', 'S', 'O', 'V'],
    tips: ['Primeiro ache o verbo principal (2ª posição).', 'Depois de weil/dass, procure o verbo que vai pro fim.'],
    lines: `
T=Am Montag / V=fahre / S=ich / M=mit dem Zug / L=nach Berlin / C=weil / S=ich / L=dort / O=ein Vorstellungsgespräch / V=habe ¦ On Monday I'm taking the train to Berlin because I have a job interview there ¦ Na segunda eu vou de trem para Berlim porque tenho uma entrevista de emprego lá
S=Ich / V=möchte / O=eine Ausbildung / L=in Deutschland / I=machen / C=weil / S=ich / M=gern / L=in der IT / V=arbeite ¦ I would like to do an apprenticeship in Germany because I like working in IT ¦ Eu gostaria de fazer uma Ausbildung na Alemanha porque gosto de trabalhar com TI
T=Gestern / V=habe / S=ich / O=meinen Lebenslauf / I=geschrieben / C=und / S=ich / V=habe / O=ihn / L=an die Firma / I=geschickt ¦ Yesterday I wrote my CV and I sent it to the company ¦ Ontem eu escrevi meu currículo e mandei para a empresa
S=Ich / V=glaube / C=dass / S=ich / L=im Lager / M=gut / I=arbeiten / V=kann ¦ I believe that I can work well in the warehouse ¦ Eu acho que eu posso trabalhar bem no depósito`,
    grow: `
S=Ich / V=fahre ¦ I'm going ¦ Eu vou
S=Ich / V=fahre / T=morgen ¦ I'm going tomorrow ¦ Eu vou amanhã
S=Ich / V=fahre / T=morgen / M=mit dem Bus ¦ I'm going by bus tomorrow ¦ Eu vou de ônibus amanhã
S=Ich / V=fahre / T=morgen / M=mit dem Bus / L=zur Arbeit ¦ Tomorrow I'm going to work by bus ¦ Amanhã eu vou de ônibus para o trabalho
S=Ich / V=fahre / T=morgen / M=mit dem Bus / L=zur Arbeit / C=weil / S=mein Auto / M=kaputt / V=ist ¦ Tomorrow I'm going to work by bus because my car is broken ¦ Amanhã eu vou de ônibus para o trabalho porque meu carro está quebrado`,
  },
];
