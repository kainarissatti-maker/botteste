# Automação de Faturas (Gmail → Planilha + Drive)

Google Apps Script que, a cada 10 minutos:

1. Busca e-mails no Gmail com as palavras **"Fatura"** ou **"Recibo"**.
2. Extrai **remetente**, **data** e **valor total**.
3. Adiciona uma linha na aba **Faturas** da planilha.
4. Salva os **anexos PDF** na pasta **"Faturas 2026"** do Google Drive (link na planilha).

Cada e-mail é processado uma única vez (o ID fica numa coluna oculta).

## Instalação (5 minutos)

1. Crie uma Planilha Google nova.
2. Menu **Extensões → Apps Script**.
3. Apague o conteúdo de `Code.gs` e cole o conteúdo de [`Code.gs`](Code.gs).
4. Salve, selecione a função **`instalar`** e clique em **Executar**.
5. Autorize o acesso ao Gmail, Drive e Planilhas quando o Google pedir.

Pronto: a aba **Faturas**, a pasta **Faturas 2026** e o gatilho automático são criados.

## Configuração

No topo de `Code.gs`, objeto `CONFIG`:

| Campo | Padrão | O que faz |
|---|---|---|
| `QUERY` | `(fatura OR recibo) newer_than:30d` | Busca do Gmail |
| `PASTA_DRIVE` | `Faturas 2026` | Pasta dos PDFs |
| `ABA` | `Faturas` | Aba da planilha |
| `INTERVALO_MINUTOS` | `10` | Frequência (1, 5, 10, 15 ou 30) |

## Como o valor é detectado

- Prioriza números próximos da palavra **"total"** (ex.: `Valor total: R$ 1.234,56`).
- Se não houver, usa o **maior valor monetário** do e-mail (`R$`, `$`, `€`, `USD`...).
- Entende formato brasileiro (`1.234,56`) e americano (`1,234.56`).
- Se nenhum valor for encontrado, a célula fica vazia para revisão manual.
