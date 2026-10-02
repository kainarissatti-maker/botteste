// Pronúncia "aportuguesada", do jeito que professores ensinam brasileiros: wie -> "vi", Straße -> "chtrasse".
// É uma aproximação por regras; ö e ü ficam como estão (não existem em português — ver o guia).

// Palavras que fogem das regras (estrangeirismos e casos especiais).
const EXC = {
  restaurant: 'restorã', 'café': 'kafê', hotel: 'rrotél', computer: 'kompiúta', handy: 'rréndi', baby: 'bêibi',
  't-shirt': 'ti-chârt', cousin: 'kuzã', cousine: 'kuzinê', orange: 'orãjê', chef: 'chéf', museum: 'muzêum',
  november: 'novémba', video: 'vídeo', 'universität': 'univerzitét', sofa: 'zôfa', taxi: 'táksi', cola: 'kôla',
  toilette: 'toaletê', bus: 'bus', park: 'park', person: 'perzôn', personen: 'perzônen', familie: 'famíliê',
  banane: 'bananê', tomate: 'tomatê', 'büro': 'büro', april: 'april', august: 'august', juli: 'iúli', juni: 'iúni',
  okay: 'oukêi', euro: 'óiro', berlin: 'berlín', brasilien: 'brazíliên', englisch: 'énglich', deutsch: 'dóitch',
};

const VOW = 'aeiouäöüy';
const isV = (c) => Boolean(c) && VOW.includes(c);

function word(w) {
  const s = w.toLowerCase();
  if (EXC[s]) return EXC[s];
  if (!/[a-zäöüß]/.test(s)) return w;
  let out = '';
  let i = 0;
  // Depois de prefixo (ver-, be-, ge-…) o st/sp também vira "cht"/"chp": verstehen = "ferchtêen".
  const prefixLen = (s.match(/^(ver|be|ge|ent|zer|auf|ein|an|aus|mit|vor|zu)(?=s[tp])/) || [''])[0].length || -1;
  const at = (re) => { re.lastIndex = i; const m = re.exec(s); return m ? m[0] : null; };
  const end = (n) => i + n >= s.length;
  while (i < s.length) {
    const c = s[i], prev = s[i - 1], next = s[i + 1];
    let m;
    if ((m = at(/tsch/y))) { out += 'tch'; i += 4; continue; }
    if ((m = at(/sch/y))) { out += 'ch'; i += 3; continue; }
    if ((i === 0 || i === prefixLen) && (m = at(/s[tp]/y))) { out += m === 'st' ? 'cht' : 'chp'; i += 2; continue; }
    if ((m = at(/ng/y))) { out += 'ng'; i += 2; continue; }
    if ((m = at(/chs/y))) { out += 'ks'; i += 3; continue; }
    if ((m = at(/ch/y))) { out += 'aou'.includes(prev) ? 'rr' : 'ch'; i += 2; continue; }
    if ((m = at(/ig$/y))) { out += 'ich'; i += 2; continue; }
    if ((m = at(/tion/y))) { out += 'tsion'; i += 4; continue; }
    if ((m = at(/(ei|ey|ai|ay)/y))) { out += 'ai'; i += 2; continue; }
    if ((m = at(/ie/y))) { out += 'i'; i += 2; continue; }
    if ((m = at(/(eu|äu)/y))) { out += 'ói'; i += 2; continue; }
    if ((m = at(/au/y))) { out += 'au'; i += 2; continue; }
    if ((m = at(/(aa|ah)/y))) { out += 'á'; i += 2; continue; }
    if ((m = at(/(ee|eh)/y))) { out += 'ê'; i += 2; continue; }
    if ((m = at(/(oo|oh)/y))) { out += 'ô'; i += 2; continue; }
    if ((m = at(/(uh|ih|äh|öh|üh)/y))) { out += { uh: 'u', ih: 'i', 'äh': 'é', 'öh': 'ö', 'üh': 'ü' }[m]; i += 2; continue; }
    if ((m = at(/qu/y))) { out += 'kv'; i += 2; continue; }
    if ((m = at(/ck/y))) { out += 'k'; i += 2; continue; }
    if ((m = at(/tz/y))) { out += 'ts'; i += 2; continue; }
    if ((m = at(/ph/y))) { out += 'f'; i += 2; continue; }
    if ((m = at(/th/y))) { out += 't'; i += 2; continue; }
    if ((m = at(/(ß|ss)/y))) { out += 'ss'; i += m.length; continue; }
    if (s.length > 3 && (m = at(/er$/y))) { out += 'a'; i += 2; continue; }
    // Consoante dobrada soa como uma só.
    if (c === next && !isV(c) && c !== 's') { i += 1; continue; }
    if (isV(c)) {
      if (c === 'e' && end(1) && s.length > 2) out += 'ê'; // e final: "ê" fraquinho, nunca "i"
      else if (c === 'e' && s.length <= 3 && next === 'r' && end(2)) out += 'ê'; // der, wer = "dêr", "vêr"
      else out += { 'ä': 'é', y: 'ü' }[c] || c;
      i += 1; continue;
    }
    switch (c) {
      case 'w': out += 'v'; break;
      case 'v': out += 'f'; break;
      case 'z': out += 'ts'; break;
      case 'j': out += 'i'; break;
      case 'x': out += 'ks'; break;
      case 'c': out += 'ei'.includes(next) ? 'ts' : 'k'; break;
      case 's': out += isV(next) && (i === 0 || isV(prev)) ? 'z' : 's'; break;
      case 'h': out += (i === 0 || !isV(prev)) && isV(next) ? 'rr' : ''; break;
      case 'r': out += i === 0 ? 'rr' : end(1) && isV(prev) && s.length > 3 ? 'a' : 'r'; break;
      case 'g': out += 'ei'.includes(next) ? 'gu' : end(1) ? 'k' : 'g'; break;
      case 'd': out += end(1) ? 't' : 'd'; break;
      case 'b': out += end(1) ? 'p' : 'b'; break;
      default: out += c;
    }
    i += 1;
  }
  return out;
}

// ---------- divisão em sílabas (sobre a pronúncia já aportuguesada) ----------
const NUC = /^(ói|ai|au|[aeiouáéíóúâêôãõöü])/;
const CONS = /^(tch|ch|rr|ts|gu(?=[eêéi])|kv|[bcdfghjklmnpqrstvwxyzç])/;
const ONSET2 = /^([bpdtkgf]|ch)[rl]$/; // pares que ficam juntos no começo da sílaba: br, pl, tr, chr...

function units(w) {
  const out = [];
  let i = 0;
  while (i < w.length) {
    const rest = w.slice(i);
    let m = rest.match(NUC);
    if (m) { out.push({ t: m[0], v: true }); i += m[0].length; continue; }
    m = rest.match(CONS);
    const t = m ? m[0] : rest[0];
    out.push({ t, v: false });
    i += t.length;
  }
  return out;
}

function syllables(w) {
  const u = units(w);
  const nuclei = u.map((x, k) => (x.v ? k : -1)).filter((k) => k >= 0);
  if (nuclei.length < 2) return w;
  const cuts = new Set();
  for (let n = 0; n < nuclei.length - 1; n++) {
    const a = nuclei[n], b = nuclei[n + 1];
    const cons = b - a - 1;
    // "a" final que veio do R (hier -> rria) fica na mesma sílaba.
    if (cons === 0) { if (!(b === u.length - 1 && u[b].t === 'a')) cuts.add(b); }
    else if (cons === 1) cuts.add(a + 1);
    else {
      const pair = u[b - 2].t + u[b - 1].t;
      const keep = ONSET2.test(pair) || (u[b - 2].t === 'ch' && /^[tp]$/.test(u[b - 1].t)); // cht, chp (de st/sp)
      cuts.add(keep ? b - 2 : b - 1);
    }
  }
  return u.map((x, k) => (cuts.has(k) ? `-${x.t}` : x.t)).join('');
}

export function pron(text) {
  return text.split(/(\s+|[-.,!?;:„“"…]+)/)
    .map((part) => (/^[\p{L}']+$/u.test(part) ? syllables(word(part.replace(/'/g, ''))) : part))
    .join('');
}

// Regras do guia de pronúncia, com um exemplo do vocabulário (tem áudio gravado).
export const RULES = [
  { k: 'W', v: 'v', ex: 'das Wasser', tip: 'W alemão é o nosso V.' },
  { k: 'V', v: 'f', ex: 'der Vater', tip: 'V quase sempre soa F.' },
  { k: 'Z', v: 'ts', ex: 'zehn', tip: 'Z é "ts", como em "tsunami".' },
  { k: 'J', v: 'i', ex: 'Ja', tip: 'J soa como o "i" de "iate".' },
  { k: 'S + vogal', v: 'z', ex: 'sieben', tip: 'S antes de vogal soa Z.' },
  { k: 'St / Sp (no início)', v: 'cht / chp', ex: 'die Straße', tip: 'No começo da palavra o S vira "ch".' },
  { k: 'Sch', v: 'ch', ex: 'die Schule', tip: 'Igual ao "ch" de "chuva".' },
  { k: 'ch (depois de a, o, u)', v: 'rr', ex: 'das Buch', tip: 'Arranhado na garganta, como o "rr" carioca.' },
  { k: 'ch (depois de e, i, consoante)', v: 'ch', ex: 'ich', tip: 'Um "ch" suave, sorrindo, quase um chiado.' },
  { k: 'ei / ai', v: 'ai', ex: 'drei', tip: 'EI se lê "ai".' },
  { k: 'ie', v: 'i (longo)', ex: 'das Bier', tip: 'IE é um "i" comprido.' },
  { k: 'eu / äu', v: 'ói', ex: 'neun', tip: 'EU se lê "ói".' },
  { k: 'ä', v: 'é', ex: 'der Käse', tip: 'Ä é um "é" aberto.' },
  { k: 'ö', v: 'ö', ex: 'schön', tip: 'Fale "ê" com a boca em bico de "ô".' },
  { k: 'ü', v: 'ü', ex: 'fünf', tip: 'Fale "i" com a boca em bico de "u".' },
  { k: 'H', v: 'rr / mudo', ex: 'das Haus', tip: 'No começo é aspirado (rr carioca). Depois de vogal não se fala: só alonga a vogal.' },
  { k: 'R', v: 'rr / a', ex: 'der Lehrer', tip: 'No começo, R de garganta. No fim, "-er" vira quase "a".' },
  { k: 'e final', v: 'ê', ex: 'Danke', tip: 'É um "ê" fraquinho. Nunca "i": "dankê", não "danki".' },
  { k: 'g / d / b no final', v: 'k / t / p', ex: 'der Hund', tip: 'No fim da palavra ficam "secos": Tag = "tak", Hund = "hunt".' },
  { k: '-ig', v: 'ich', ex: 'richtig', tip: 'Terminação -ig soa "ich".' },
  { k: 'ß / ss', v: 's forte', ex: 'heiß', tip: 'Sempre "s" de "sapo", nunca "z".' },
  { k: 'T e D', v: 't / d secos', ex: 'der Tisch', tip: 'Nunca "tchi" ou "dji" como no Brasil: Tisch é "tich", não "tchich".' },
];
