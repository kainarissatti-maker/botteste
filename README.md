# 🪐 APIvonKAKA
**(ALEMÃO PARA IDIOTAS)** 🇩🇪 🇬🇧 🇧🇷

App para aprender **alemão** usando **inglês e português** juntos, com repetição espaçada (estilo Anki).

**Abrir o app:** https://kainarissatti-maker.github.io/botteste/

## O que já tem
- ~460 palavras do nível **A1**, com artigo (der/die/das em cores), plural e categoria
- **Estudar:** cartões que viram em 3D, com repetição espaçada; arraste → Bom, ← Errei
- **Quiz:** DE→PT, DE→EN, PT→DE, EN→DE, artigo, escrita, ouvir e escolher, ditado
- **Jogo dos pares** contra o relógio, com recorde
- **XP, meta diária e 18 conquistas**, palavra do dia e treino das palavras difíceis
- **Palavras:** busca, filtros por nível/categoria/situação e suas próprias palavras
- **Progresso:** mapa de atividade, conquistas, por nível e por categoria
- **Áudio com voz neural natural** (Piper: Thorsten em alemão, Lessac em inglês) em 3 velocidades gravadas (normal, devagar, bem devagar) e botão 🐢; a voz do navegador fica como reserva
- Tema **roxo espacial** (estrelas animadas, nebulosa, estrelas cadentes) ou lavanda clara, efeitos sonoros e animações (respeita "reduzir movimento" do sistema)
- Interface em português, inglês ou alemão
- Funciona offline e pode ser instalado na tela inicial (PWA)

## Próximos passos
- Pacotes A2, B1 e B2
- Sincronização entre PC e celular (Supabase)
- APK para Android (Capacitor)

## Gerar os áudios de palavras novas
```
pip install piper-tts lameenc
python3 tools/gen_audio.py --voices <pasta com de_DE-thorsten-high.onnx e en_US-lessac-high.onnx>
```
Os modelos ficam em https://huggingface.co/rhasspy/piper-voices. O script só gera o que ainda falta.

## Rodar no seu PC (opcional)
O app não precisa de build: é só servir a pasta.

```
npx serve .
```

## Licença das vozes
- Alemão: Piper **Thorsten** (dados CC0).
- Inglês: Piper **Lessac** (dados Blizzard 2013, uso não comercial). Para publicar o app comercialmente, troque por uma voz com licença comercial.
