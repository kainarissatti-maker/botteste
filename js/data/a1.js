// Pacote A1 — formato de cada linha: "alemão|plural|inglês|português"
// Substantivos começam com o artigo (der/die/das). "(Pl.)" = só existe no plural.
export const A1 = {
  greet: `
Hallo||hello|olá
Guten Morgen||good morning|bom dia
Guten Tag||good day / hello|bom dia / boa tarde
Guten Abend||good evening|boa noite (ao chegar)
Gute Nacht||good night|boa noite (ao dormir)
Tschüss||bye|tchau
Auf Wiedersehen||goodbye|até logo
Bis später||see you later|até mais tarde
Bis morgen||see you tomorrow|até amanhã
Danke||thanks|obrigado
Danke schön||thank you very much|muito obrigado
Bitte||please / you're welcome|por favor / de nada
Ja||yes|sim
Nein||no|não
Entschuldigung||excuse me / sorry|com licença / desculpe
Es tut mir leid||I'm sorry|sinto muito
Wie geht's?||how are you?|como vai?
Mir geht es gut||I'm fine|estou bem
Ich heiße …||my name is …|eu me chamo …
Wie heißt du?||what's your name?|como você se chama?
Woher kommst du?||where are you from?|de onde você é?
Ich komme aus Brasilien||I come from Brazil|eu sou do Brasil
Ich verstehe nicht||I don't understand|eu não entendo
Sprechen Sie Englisch?||do you speak English?|o(a) senhor(a) fala inglês?
Noch einmal, bitte||once more, please|mais uma vez, por favor
Willkommen||welcome|bem-vindo
Prost!||cheers!|saúde!
Alles klar||all right / got it|tudo certo / entendi
Kein Problem||no problem|sem problema
Viel Glück||good luck|boa sorte`,

  numbers: `
null||zero|zero
eins||one|um
zwei||two|dois
drei||three|três
vier||four|quatro
fünf||five|cinco
sechs||six|seis
sieben||seven|sete
acht||eight|oito
neun||nine|nove
zehn||ten|dez
elf||eleven|onze
zwölf||twelve|doze
zwanzig||twenty|vinte
dreißig||thirty|trinta
hundert||hundred|cem
tausend||thousand|mil
die Zahl|die Zahlen|number|número`,

  colors: `
die Farbe|die Farben|color|cor
rot||red|vermelho
blau||blue|azul
grün||green|verde
gelb||yellow|amarelo
schwarz||black|preto
weiß||white|branco
grau||grey|cinza
braun||brown|marrom
orange||orange|laranja (cor)
rosa||pink|rosa
lila||purple|roxo / lilás`,

  family: `
die Familie|die Familien|family|família
die Mutter|die Mütter|mother|mãe
der Vater|die Väter|father|pai
die Eltern|(Pl.)|parents|pais (pai e mãe)
der Bruder|die Brüder|brother|irmão
die Schwester|die Schwestern|sister|irmã
die Geschwister|(Pl.)|siblings|irmãos
der Sohn|die Söhne|son|filho
die Tochter|die Töchter|daughter|filha
das Kind|die Kinder|child|criança / filho(a)
der Großvater|die Großväter|grandfather|avô
die Großmutter|die Großmütter|grandmother|avó
der Onkel|die Onkel|uncle|tio
die Tante|die Tanten|aunt|tia
der Cousin|die Cousins|cousin (male)|primo
die Cousine|die Cousinen|cousin (female)|prima
der Mann|die Männer|man / husband|homem / marido
die Frau|die Frauen|woman / wife|mulher / esposa
das Baby|die Babys|baby|bebê`,

  people: `
der Freund|die Freunde|friend / boyfriend|amigo / namorado
die Freundin|die Freundinnen|friend / girlfriend|amiga / namorada
der Junge|die Jungen|boy|menino
das Mädchen|die Mädchen|girl|menina
der Mensch|die Menschen|human being|ser humano
die Person|die Personen|person|pessoa
die Leute|(Pl.)|people|pessoas / gente
der Nachbar|die Nachbarn|neighbor|vizinho
der Name|die Namen|name|nome
der Lehrer|die Lehrer|teacher (male)|professor
die Lehrerin|die Lehrerinnen|teacher (female)|professora
der Arzt|die Ärzte|doctor (male)|médico
die Ärztin|die Ärztinnen|doctor (female)|médica
der Student|die Studenten|student (male)|estudante (universitário)
der Schüler|die Schüler|pupil (male)|aluno
der Herr|die Herren|Mr. / gentleman|senhor`,

  body: `
der Körper|die Körper|body|corpo
der Kopf|die Köpfe|head|cabeça
das Gesicht|die Gesichter|face|rosto
das Auge|die Augen|eye|olho
das Ohr|die Ohren|ear|orelha
die Nase|die Nasen|nose|nariz
der Mund|die Münder|mouth|boca
der Zahn|die Zähne|tooth|dente
das Haar|die Haare|hair|cabelo
der Hals|die Hälse|neck / throat|pescoço / garganta
der Arm|die Arme|arm|braço
die Hand|die Hände|hand|mão
der Finger|die Finger|finger|dedo
das Bein|die Beine|leg|perna
der Fuß|die Füße|foot|pé
der Bauch|die Bäuche|belly|barriga
der Rücken|die Rücken|back|costas
das Herz|die Herzen|heart|coração`,

  home: `
das Haus|die Häuser|house|casa
die Wohnung|die Wohnungen|apartment|apartamento
das Zimmer|die Zimmer|room|quarto / cômodo
die Küche|die Küchen|kitchen|cozinha
das Bad|die Bäder|bathroom|banheiro
das Schlafzimmer|die Schlafzimmer|bedroom|quarto (de dormir)
das Wohnzimmer|die Wohnzimmer|living room|sala de estar
die Tür|die Türen|door|porta
das Fenster|die Fenster|window|janela
der Tisch|die Tische|table|mesa
der Stuhl|die Stühle|chair|cadeira
das Bett|die Betten|bed|cama
das Sofa|die Sofas|sofa|sofá
die Lampe|die Lampen|lamp|luminária
der Schrank|die Schränke|cupboard / wardrobe|armário
der Kühlschrank|die Kühlschränke|fridge|geladeira
die Toilette|die Toiletten|toilet|vaso sanitário / banheiro
der Garten|die Gärten|garden|jardim
der Schlüssel|die Schlüssel|key|chave
das Handy|die Handys|cell phone|celular
der Computer|die Computer|computer|computador
der Fernseher|die Fernseher|TV set|televisão
das Buch|die Bücher|book|livro
die Uhr|die Uhren|clock / watch|relógio`,

  food: `
das Essen||food / meal|comida / refeição
das Brot|die Brote|bread|pão
das Brötchen|die Brötchen|bread roll|pãozinho
die Butter||butter|manteiga
der Käse||cheese|queijo
das Ei|die Eier|egg|ovo
das Fleisch||meat|carne
das Hähnchen|die Hähnchen|chicken (food)|frango
der Fisch|die Fische|fish|peixe
die Wurst|die Würste|sausage|salsicha / linguiça
der Reis||rice|arroz
die Nudeln|(Pl.)|noodles / pasta|macarrão
die Kartoffel|die Kartoffeln|potato|batata
das Gemüse||vegetables|legumes / verduras
das Obst||fruit|frutas
der Apfel|die Äpfel|apple|maçã
die Banane|die Bananen|banana|banana
die Orange|die Orangen|orange|laranja (fruta)
die Tomate|die Tomaten|tomato|tomate
der Salat|die Salate|salad / lettuce|salada / alface
die Suppe|die Suppen|soup|sopa
der Zucker||sugar|açúcar
das Salz||salt|sal
der Kuchen|die Kuchen|cake|bolo
die Schokolade|die Schokoladen|chocolate|chocolate
das Frühstück|die Frühstücke|breakfast|café da manhã
das Mittagessen|die Mittagessen|lunch|almoço
das Abendessen|die Abendessen|dinner|jantar`,

  drinks: `
das Wasser||water|água
der Kaffee|die Kaffees|coffee|café
der Tee|die Tees|tea|chá
die Milch||milk|leite
der Saft|die Säfte|juice|suco
das Bier|die Biere|beer|cerveja
der Wein|die Weine|wine|vinho
die Cola|die Colas|cola|refrigerante de cola
das Glas|die Gläser|glass|copo
die Tasse|die Tassen|cup|xícara
die Flasche|die Flaschen|bottle|garrafa`,

  clothes: `
die Kleidung||clothing|roupa
das Hemd|die Hemden|shirt|camisa
das T-Shirt|die T-Shirts|T-shirt|camiseta
die Hose|die Hosen|trousers / pants|calça
der Rock|die Röcke|skirt|saia
das Kleid|die Kleider|dress|vestido
die Jacke|die Jacken|jacket|jaqueta
der Mantel|die Mäntel|coat|casaco
der Schuh|die Schuhe|shoe|sapato
die Socke|die Socken|sock|meia
der Hut|die Hüte|hat|chapéu
die Mütze|die Mützen|cap / beanie|gorro / boné
die Tasche|die Taschen|bag / pocket|bolsa / bolso
die Brille|die Brillen|glasses|óculos`,

  city: `
die Stadt|die Städte|city|cidade
das Dorf|die Dörfer|village|vila / aldeia
die Straße|die Straßen|street|rua
der Platz|die Plätze|square / place|praça / lugar
das Geschäft|die Geschäfte|shop|loja
der Supermarkt|die Supermärkte|supermarket|supermercado
der Markt|die Märkte|market|mercado / feira
die Bäckerei|die Bäckereien|bakery|padaria
das Restaurant|die Restaurants|restaurant|restaurante
das Café|die Cafés|café|café (lugar)
das Hotel|die Hotels|hotel|hotel
die Bank|die Banken|bank|banco (financeiro)
die Post||post office / mail|correio
die Apotheke|die Apotheken|pharmacy|farmácia
das Krankenhaus|die Krankenhäuser|hospital|hospital
die Schule|die Schulen|school|escola
die Kirche|die Kirchen|church|igreja
der Park|die Parks|park|parque
das Kino|die Kinos|cinema|cinema
das Museum|die Museen|museum|museu
der Bahnhof|die Bahnhöfe|train station|estação de trem
der Flughafen|die Flughäfen|airport|aeroporto
das Land|die Länder|country / countryside|país / campo
die Welt|die Welten|world|mundo`,

  transport: `
das Auto|die Autos|car|carro
der Bus|die Busse|bus|ônibus
der Zug|die Züge|train|trem
die U-Bahn|die U-Bahnen|subway|metrô
die Straßenbahn|die Straßenbahnen|tram|bonde
das Fahrrad|die Fahrräder|bicycle|bicicleta
das Flugzeug|die Flugzeuge|airplane|avião
das Schiff|die Schiffe|ship|navio
das Taxi|die Taxis|taxi|táxi
die Fahrkarte|die Fahrkarten|ticket (transport)|passagem / bilhete
die Haltestelle|die Haltestellen|stop (bus/tram)|ponto / parada
der Weg|die Wege|way / path|caminho`,

  time: `
die Zeit|die Zeiten|time|tempo
die Stunde|die Stunden|hour|hora
die Minute|die Minuten|minute|minuto
der Tag|die Tage|day|dia
die Woche|die Wochen|week|semana
der Monat|die Monate|month|mês
das Jahr|die Jahre|year|ano
der Morgen|die Morgen|morning|manhã
der Mittag|die Mittage|noon|meio-dia
der Abend|die Abende|evening|noite (início)
die Nacht|die Nächte|night|noite
heute||today|hoje
morgen||tomorrow|amanhã
gestern||yesterday|ontem
jetzt||now|agora
später||later|mais tarde
immer||always|sempre
nie||never|nunca
oft||often|frequentemente
der Montag|die Montage|Monday|segunda-feira
der Dienstag|die Dienstage|Tuesday|terça-feira
der Mittwoch|die Mittwoche|Wednesday|quarta-feira
der Donnerstag|die Donnerstage|Thursday|quinta-feira
der Freitag|die Freitage|Friday|sexta-feira
der Samstag|die Samstage|Saturday|sábado
der Sonntag|die Sonntage|Sunday|domingo
das Wochenende|die Wochenenden|weekend|fim de semana
der Januar||January|janeiro
der Februar||February|fevereiro
der März||March|março
der April||April|abril
der Mai||May|maio
der Juni||June|junho
der Juli||July|julho
der August||August|agosto
der September||September|setembro
der Oktober||October|outubro
der November||November|novembro
der Dezember||December|dezembro
der Frühling|die Frühlinge|spring|primavera
der Sommer|die Sommer|summer|verão
der Herbst|die Herbste|autumn|outono
der Winter|die Winter|winter|inverno
der Geburtstag|die Geburtstage|birthday|aniversário`,

  weather: `
das Wetter||weather|tempo (clima)
die Sonne|die Sonnen|sun|sol
der Regen||rain|chuva
der Schnee||snow|neve
der Wind|die Winde|wind|vento
die Wolke|die Wolken|cloud|nuvem
der Himmel|die Himmel|sky|céu
warm||warm|morno / quente
kalt||cold|frio
heiß||hot|quente
das Meer|die Meere|sea|mar
der Strand|die Strände|beach|praia
der Berg|die Berge|mountain|montanha
der Fluss|die Flüsse|river|rio
der See|die Seen|lake|lago
der Baum|die Bäume|tree|árvore
die Blume|die Blumen|flower|flor`,

  animals: `
das Tier|die Tiere|animal|animal
der Hund|die Hunde|dog|cachorro
die Katze|die Katzen|cat|gato
das Pferd|die Pferde|horse|cavalo
die Kuh|die Kühe|cow|vaca
das Schwein|die Schweine|pig|porco
der Vogel|die Vögel|bird|pássaro
die Maus|die Mäuse|mouse|rato
das Huhn|die Hühner|chicken (animal)|galinha
der Bär|die Bären|bear|urso`,

  work: `
die Arbeit|die Arbeiten|work|trabalho
der Beruf|die Berufe|profession|profissão
das Büro|die Büros|office|escritório
die Firma|die Firmen|company|empresa
der Chef|die Chefs|boss|chefe
das Geld||money|dinheiro
die Klasse|die Klassen|class|turma / classe
der Kurs|die Kurse|course|curso
die Frage|die Fragen|question|pergunta
die Antwort|die Antworten|answer|resposta
das Wort|die Wörter|word|palavra
der Satz|die Sätze|sentence|frase
die Sprache|die Sprachen|language|idioma / língua
die Hausaufgabe|die Hausaufgaben|homework|lição de casa
der Stift|die Stifte|pen / pencil|caneta / lápis
das Papier|die Papiere|paper|papel
das Heft|die Hefte|notebook|caderno
die Prüfung|die Prüfungen|exam|prova / exame
der Termin|die Termine|appointment|compromisso / horário marcado`,

  verbs: `
sein||to be|ser / estar
haben||to have|ter
werden||to become|tornar-se / ficar
gehen||to go (on foot)|ir (a pé)
kommen||to come|vir
machen||to do / to make|fazer
sagen||to say|dizer
sprechen||to speak|falar
essen||to eat|comer
trinken||to drink|beber
schlafen||to sleep|dormir
wohnen||to live (reside)|morar
leben||to live|viver
arbeiten||to work|trabalhar
lernen||to learn|aprender
lesen||to read|ler
schreiben||to write|escrever
hören||to hear / to listen|ouvir / escutar
sehen||to see|ver
kaufen||to buy|comprar
bezahlen||to pay|pagar
fahren||to drive / to ride|dirigir / ir (de veículo)
fliegen||to fly|voar
spielen||to play|jogar / brincar / tocar
kochen||to cook|cozinhar
finden||to find|encontrar / achar
geben||to give|dar
nehmen||to take|pegar / tomar
brauchen||to need|precisar
mögen||to like|gostar
möchten||would like|gostaria (querer, educado)
wollen||to want|querer
können||can / to be able to|poder / conseguir
müssen||must / to have to|ter que / dever
dürfen||may / to be allowed to|poder (ter permissão)
heißen||to be called|chamar-se
verstehen||to understand|entender
wissen||to know (a fact)|saber
kennen||to know (be familiar with)|conhecer
fragen||to ask|perguntar
antworten||to answer|responder
öffnen||to open|abrir
schließen||to close|fechar
beginnen||to begin|começar
helfen||to help|ajudar
warten||to wait|esperar
suchen||to look for|procurar
bringen||to bring|trazer
stehen||to stand|estar de pé
sitzen||to sit|estar sentado
liegen||to lie (be lying)|estar deitado
laufen||to run / to walk|correr / andar
schwimmen||to swim|nadar
tanzen||to dance|dançar
singen||to sing|cantar
lieben||to love|amar
denken||to think|pensar
glauben||to believe|acreditar
zeigen||to show|mostrar
reisen||to travel|viajar
besuchen||to visit|visitar
anrufen||to call (phone)|ligar (telefonar)
aufstehen||to get up|levantar-se
einkaufen||to go shopping|fazer compras`,

  adj: `
gut||good|bom
schlecht||bad|ruim
groß||big / tall|grande / alto
klein||small|pequeno
neu||new|novo
alt||old|velho
jung||young|jovem
schön||beautiful / nice|bonito / lindo
hässlich||ugly|feio
lang||long|longo / comprido
kurz||short|curto
schnell||fast|rápido
langsam||slow|lento / devagar
teuer||expensive|caro
billig||cheap|barato
richtig||correct|certo
falsch||wrong|errado
leicht||easy / light|fácil / leve
schwer||difficult / heavy|difícil / pesado
müde||tired|cansado
glücklich||happy|feliz
traurig||sad|triste
krank||sick|doente
gesund||healthy|saudável
hungrig||hungry|com fome
voll||full|cheio
leer||empty|vazio
viel||much / a lot|muito
wenig||little / few|pouco
lecker||tasty|gostoso
nett||nice / kind|legal / gentil
wichtig||important|importante
frei||free|livre
offen||open|aberto
geschlossen||closed|fechado
früh||early|cedo
spät||late|tarde`,

  basics: `
ich||I|eu
du||you (informal)|você (informal) / tu
er||he|ele
sie||she / they|ela / eles
es||it|ele / ela (neutro)
wir||we|nós
ihr||you (plural)|vocês
Sie||you (formal)|o senhor / a senhora
wer?||who?|quem?
was?||what?|o quê?
wo?||where?|onde?
wohin?||where to?|para onde?
woher?||where from?|de onde?
wann?||when?|quando?
warum?||why?|por quê?
wie?||how?|como?
wie viel?||how much?|quanto?
und||and|e
oder||or|ou
aber||but|mas
weil||because|porque
mit||with|com
ohne||without|sem
für||for|para / por
in||in|em / dentro de
auf||on|sobre / em cima de
unter||under|embaixo de
neben||next to|ao lado de
von||from / of|de
zu||to|para / a
nach||after / to (places)|depois de / para
hier||here|aqui
da||there|aí / ali
dort||over there|lá
sehr||very|muito
auch||also|também
nicht||not|não (negação)
nur||only|só / apenas
noch||still|ainda
schon||already|já
vielleicht||maybe|talvez
gern||gladly|com prazer
alles||everything|tudo
nichts||nothing|nada
etwas||something|algo
ein bisschen||a little|um pouco`,
};
