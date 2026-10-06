# Erzeugt die hellen Standbilder (…-dl/-ml.webp) aus den dunklen – gleiche Abbildung wie src/scripts/world/ink.ts.
# Aufruf: cd public/img/still && python3 ../../../scripts/ink-stills.py *-d.webp *-m.webp
import sys, numpy as np
from PIL import Image
def lin(c): return np.where(c<=0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def srgb(c): return np.where(c<=0.0031308, c*12.92, 1.055*np.power(np.clip(c,0,1),1/2.4)-0.055)
def hexl(h): return lin(np.array([int(h[i:i+2],16)/255 for i in (1,3,5)]))
BG, PAPER, INK = hexl('#0a1226'), hexl('#f4f6f8'), hexl('#14213f')
def ss(a,b,x): t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
for src in sys.argv[1:]:
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)/255
    e = np.maximum(lin(im)-BG, 0); m = e.max(-1, keepdims=True)
    a = ss(0.015, 1.0, m*2.6) ** 0.72
    hue = np.where(m>1e-4, e/np.maximum(m,1e-4), 0)
    white = hue.min(-1, keepdims=True)
    pure = (hue-white)/np.maximum(1-white,1e-3)
    col = pure*0.3 + (INK - pure*0.3)*ss(0.8,0.98,white)
    out = PAPER + (col-PAPER)*a*0.94
    dst = src.replace('-d.webp','-dl.webp').replace('-m.webp','-ml.webp')
    Image.fromarray((srgb(out)*255+0.5).clip(0,255).astype(np.uint8)).save(dst, quality=80, method=6)
    print(dst)
