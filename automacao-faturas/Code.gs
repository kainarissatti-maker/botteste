/**
 * Automação de faturas/recibos do Gmail -> Planilha Google + Google Drive.
 *
 * - Busca e-mails com "Fatura" ou "Recibo".
 * - Extrai remetente, data e valor total.
 * - Adiciona uma linha na planilha.
 * - Salva os anexos PDF na pasta "Faturas 2026" do Drive.
 *
 * Instalação: veja README.md. Rode `instalar()` uma vez.
 */

const CONFIG = {
  QUERY: '(fatura OR recibo) newer_than:30d',
  PASTA_DRIVE: 'Faturas 2026',
  ABA: 'Faturas',
  MAX_THREADS: 100,
  INTERVALO_MINUTOS: 10,
};

const CABECALHO = ['Data', 'Remetente', 'E-mail', 'Assunto', 'Valor total', 'PDFs', 'ID da mensagem'];

/** Rode uma vez: cria a aba, a pasta e o gatilho automático. */
function instalar() {
  obterAba_();
  obterPasta_();
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processarFaturas')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('processarFaturas')
    .timeBased()
    .everyMinutes(CONFIG.INTERVALO_MINUTOS)
    .create();
  processarFaturas();
}

/** Processa os e-mails novos. Chamado automaticamente pelo gatilho. */
function processarFaturas() {
  const aba = obterAba_();
  const pasta = obterPasta_();
  const idsProcessados = lerIdsProcessados_(aba);
  const novasLinhas = [];

  const threads = GmailApp.search(CONFIG.QUERY, 0, CONFIG.MAX_THREADS);
  threads.forEach(thread => {
    thread.getMessages().forEach(msg => {
      const id = msg.getId();
      if (idsProcessados.has(id)) return;
      if (!/fatura|recibo/i.test(msg.getSubject() + ' ' + msg.getPlainBody())) return;

      const remetente = separarRemetente_(msg.getFrom());
      const valor = extrairValor_(msg.getSubject() + '\n' + msg.getPlainBody());
      const links = salvarPdfs_(msg, pasta);

      novasLinhas.push([
        msg.getDate(),
        remetente.nome,
        remetente.email,
        msg.getSubject(),
        valor === null ? '' : valor,
        links.join('\n'),
        id,
      ]);
      idsProcessados.add(id);
    });
  });

  if (novasLinhas.length) {
    aba.getRange(aba.getLastRow() + 1, 1, novasLinhas.length, CABECALHO.length).setValues(novasLinhas);
  }
  console.log(`${novasLinhas.length} e-mail(s) processado(s).`);
}

// ---------- Funções auxiliares ----------

function obterAba_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(CONFIG.ABA);
  if (!aba) {
    aba = planilha.insertSheet(CONFIG.ABA);
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
    aba.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    aba.getRange('E:E').setNumberFormat('#,##0.00');
    aba.hideColumns(CABECALHO.length);
  }
  return aba;
}

function obterPasta_() {
  const pastas = DriveApp.getFoldersByName(CONFIG.PASTA_DRIVE);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(CONFIG.PASTA_DRIVE);
}

function lerIdsProcessados_(aba) {
  const ultima = aba.getLastRow();
  if (ultima < 2) return new Set();
  const ids = aba.getRange(2, CABECALHO.length, ultima - 1, 1).getValues().flat();
  return new Set(ids.filter(String));
}

/** "Fulano de Tal <fulano@x.com>" -> { nome, email } */
function separarRemetente_(from) {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { nome: m[1].trim() || m[2], email: m[2].trim() };
  return { nome: from.trim(), email: from.trim() };
}

/**
 * Procura o valor total no texto. Prioriza números perto de "total";
 * se não achar, usa o maior valor monetário encontrado.
 * Entende 1.234,56 (BR) e 1,234.56 (US).
 */
function extrairValor_(texto) {
  const numero = '(\\d{1,3}(?:[.,\\s]\\d{3})*(?:[.,]\\d{2})|\\d+(?:[.,]\\d{2})?)';
  const moeda = '(?:R\\$|US\\$|\\$|€|BRL|USD|EUR)';

  const reTotal = new RegExp('(?:valor\\s+)?total[^\\d\\n]{0,40}?' + numero, 'gi');
  const totais = [...texto.matchAll(reTotal)].map(m => normalizarNumero_(m[1])).filter(v => v !== null);
  if (totais.length) return totais[totais.length - 1];

  const reMoeda = new RegExp(moeda + '\\s*' + numero, 'gi');
  const valores = [...texto.matchAll(reMoeda)].map(m => normalizarNumero_(m[1])).filter(v => v !== null);
  return valores.length ? Math.max(...valores) : null;
}

function normalizarNumero_(bruto) {
  let s = bruto.replace(/\s/g, '');
  const ultimaVirgula = s.lastIndexOf(',');
  const ultimoPonto = s.lastIndexOf('.');
  if (ultimaVirgula > ultimoPonto) {
    s = s.replace(/\./g, '').replace(',', '.');   // 1.234,56
  } else {
    s = s.replace(/,/g, '');                      // 1,234.56
  }
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function salvarPdfs_(msg, pasta) {
  return msg.getAttachments()
    .filter(a => a.getContentType() === 'application/pdf' || /\.pdf$/i.test(a.getName()))
    .map(a => pasta.createFile(a.copyBlob().setName(a.getName())).getUrl());
}
