"""Split a self-contained page snapshot (everything as data: URIs) into index.html + assets/.
Usage: python3 tools/snap_post.py snapshot.html public/embeds/<name>
Raster images are capped at 1500px wide and re-encoded as WebP; fonts and SVG are kept as-is."""
import re, sys, base64, hashlib, io, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out + '/assets', exist_ok=True)
html = open(src, encoding='utf-8').read()
rx = re.compile(r'data:([a-zA-Z0-9/+.\-]+);base64,([A-Za-z0-9+/=]+)')
seen = {}
EXT = {'font/woff2': 'woff2', 'font/woff': 'woff', 'application/font-woff': 'woff', 'application/font-woff2': 'woff2',
       'font/ttf': 'ttf', 'application/x-font-ttf': 'ttf', 'font/otf': 'otf', 'image/svg+xml': 'svg',
       'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/gif': 'gif'}
def sub(m):
    mime, b64 = m.group(1), m.group(2)
    if len(b64) < 3000: return m.group(0)
    h = hashlib.md5(b64.encode()).hexdigest()[:12]
    if h in seen: return seen[h]
    raw = base64.b64decode(b64)
    if mime in ('image/jpeg', 'image/png', 'image/webp'):
        try:
            im = Image.open(io.BytesIO(raw)); im.load()
            if im.width > 1500: im = im.resize((1500, round(im.height * 1500 / im.width)), Image.LANCZOS)
            has_a = im.mode in ('RGBA', 'LA', 'P')
            im = im.convert('RGBA' if has_a else 'RGB')
            name = f'{h}.webp'; im.save(f'{out}/assets/{name}', 'WEBP', quality=86, method=5)
        except Exception as e:
            name = f'{h}.{mime.split("/")[1]}'; open(f'{out}/assets/{name}', 'wb').write(raw)
    else:
        ext = EXT.get(mime, 'bin'); name = f'{h}.{ext}'; open(f'{out}/assets/{name}', 'wb').write(raw)
    seen[h] = 'assets/' + name
    return seen[h]
html = rx.sub(sub, html)
if 'embeds/snap.js' not in html and '../snap.js' not in html:
    html = html.replace('</body>', '<script src="../snap.js"></script></body>', 1)
open(out + '/index.html', 'w', encoding='utf-8').write(html)
tot = sum(os.path.getsize(f'{out}/assets/{f}') for f in os.listdir(out + '/assets'))
print('index.html', os.path.getsize(out + '/index.html') // 1024, 'KB; assets', len(seen), tot // 1024, 'KB')
