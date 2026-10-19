"""Converte i render originali in WebP responsive (640, 1280 e massima fino a 1920).
Uso: python3 -I scripts/optimize-images.py <cartella-sorgente> <cartella-destinazione>"""
import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.lower().endswith(('.png', '.jpg', '.jpeg')))
for i, f in enumerate(files, 1):
    im = Image.open(os.path.join(src, f)).convert('RGB')
    for name, w in (('640', 640), ('1280', 1280), ('max', min(im.width, 1920))):
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(os.path.join(dst, f'{i:02d}-{name}.webp'), 'WEBP', quality=72, method=6)
    print(f'{i:02d}', f, im.size)
