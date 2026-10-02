"""Gera os áudios (voz neural Piper) de todas as palavras dos pacotes.

Uso:  python3 tools/gen_audio.py --voices <pasta com os modelos .onnx>
Modelos: de_DE-thorsten-high e en_US-lessac-high (huggingface.co/rhasspy/piper-voices).
Só gera o que ainda não existe, então pode rodar de novo depois de adicionar palavras.
"""
import argparse, hashlib, json, re, sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'audio'
EXTRA = {
    'de': ['Guten Morgen! Ich lerne Deutsch.'],
    'en': ['Good morning! I am learning German.'],
}
VOICES = {'de': 'de_DE-thorsten-high', 'en': 'en_US-lessac-high'}
# Pastas de saída e velocidade (length_scale > 1 = mais devagar). Gravar devagar de verdade
# soa muito melhor do que acelerar/desacelerar o áudio no navegador.
VARIANTS = {
    'de': {'de': 1.12, 'de-slow': 1.55, 'de-slower': 2.0},
    'en': {'en': 1.0, 'en-slow': 1.4},
}


def clean(text):
    # Igual a clean() em js/speech.js: é a chave usada para achar o áudio.
    text = re.sub(r'\(.*?\)', '', text).replace('…', '').split('/')[0]
    return re.sub(r'\s+', ' ', text).strip()


COMMA = {'aber', 'denn', 'weil', 'dass', 'wenn', 'obwohl'}


def build_text(line):
    # Igual a buildText() em js/views/build.js.
    parts = [p.strip() for p in line.strip().split('¦')]
    out = ''
    for i, chunk in enumerate(parts[0].split(' / ')):
        role, txt = chunk.split('=', 1)
        sep = '' if i == 0 else (', ' if role == 'C' and txt.lower() in COMMA else ' ')
        out += sep + txt
    out += '?' if parts[1].endswith('?') else '.'
    return out, parts[1]


def file_id(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:12]


def collect():
    texts = {'de': set(EXTRA['de']), 'en': set(EXTRA['en'])}
    for pack in sorted((ROOT / 'js' / 'data').glob('*.js')):
        for line in pack.read_text(encoding='utf-8').splitlines():
            parts = line.strip().split('|')
            if line.lstrip().startswith('//'):
                continue
            if '¦' in line:        # montar frases: "S=Ich / V=lerne ¦ inglês ¦ português"
                de, en = build_text(line)
                texts['de'].add(clean(de))
                texts['en'].add(clean(en))
                continue
            if len(parts) == 4:    # palavra: alemão|plural|inglês|português
                texts['de'].add(clean(parts[0]))
                texts['en'].add(clean(parts[2]))
            elif len(parts) == 3:  # frase: alemão|inglês|português
                texts['de'].add(clean(parts[0]))
                texts['en'].add(clean(parts[1]))
    return {k: sorted(t for t in v if t) for k, v in texts.items()}


_voice = None


def _init(model):
    global _voice
    from piper import PiperVoice
    _voice = PiperVoice.load(model)


def _synth(job):
    import lameenc
    from piper.config import SynthesisConfig
    text, path, speed = job
    pcm = b''.join(c.audio_int16_bytes for c in _voice.synthesize(text, SynthesisConfig(length_scale=speed)))
    enc = lameenc.Encoder()
    enc.set_bit_rate(48)
    enc.set_in_sample_rate(_voice.config.sample_rate)
    enc.set_channels(1)
    enc.set_quality(2)
    Path(path).write_bytes(enc.encode(pcm) + enc.flush())
    return text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voices', required=True)
    ap.add_argument('--workers', type=int, default=4)
    args = ap.parse_args()
    texts = collect()
    manifest = {}
    for lang, items in texts.items():
        manifest[lang] = {t: file_id(t) for t in items}
        jobs = []
        for name, speed in VARIANTS[lang].items():
            folder = OUT / name
            folder.mkdir(parents=True, exist_ok=True)
            jobs += [(t, str(folder / f'{file_id(t)}.mp3'), speed) for t in items if not (folder / f'{file_id(t)}.mp3').exists()]
        print(f'{lang}: {len(items)} textos, {len(jobs)} arquivos para gerar', flush=True)
        model = str(Path(args.voices) / f'{VOICES[lang]}.onnx')
        with ProcessPoolExecutor(args.workers, initializer=_init, initargs=(model,)) as ex:
            for i, _ in enumerate(ex.map(_synth, jobs, chunksize=8), 1):
                if i % 100 == 0:
                    print(f'  {lang} {i}/{len(jobs)}', flush=True)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('ok')


if __name__ == '__main__':
    sys.exit(main())
