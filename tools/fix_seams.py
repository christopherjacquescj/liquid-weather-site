#!/usr/bin/env python3
"""Removes the seams of the stitched app captures (assets/home, forecast*, compare*, moon).

The app paints a fixed background (gradient + soft glows) behind its scrolling content, so every band of a
stitched capture carries the part of the screen background it was taken from: the glows repeat and the tone
jumps at each join. Here:
  1. the background is rebuilt from the app's own drawing code (tools/appbg.py), fitted on the margins of
     the first screen (the only unstitched part);
  2. tools/bandmap.py finds which screen rows each band came from;
  3. every pixel gets the difference between the background it sits on and the one the first screen
     continues with, weighted by how much of the pixel is background seen through glass (text, icons and
     strokes are left alone).

    python3 tools/fix_seams.py            # all captures

The un-corrected captures must be in qa/orig/<name>.webp (copied there on the first run; afterwards the script
always starts from them, so it can be re-run safely). They are in git history:
    git show bdfec70:assets/home.webp > qa/orig/home.webp     (same for the other captures)
"""
import os, sys, shutil
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
import fitbg, bandmap
from appbg import H_PX, W_PX

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
JOBS = {
    'standard': ['home', 'forecast', 'forecast-s0', 'forecast-s1', 'compare', 'compare-s0', 'compare-s1', 'compare-s2'],
    'cosmic': ['moon'],
}
os.makedirs('qa/orig', exist_ok=True); os.makedirs('qa/out', exist_ok=True)

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def load(name):
    src = f'qa/orig/{name}.webp'
    if not os.path.exists(src):
        shutil.copy(f'assets/{name}.webp', src)
    return np.asarray(Image.open(src).convert('RGB')).astype(np.float32)

def joint_fit(kind, imgs, y0=40, y1=1100):
    rows = np.arange(y0, y1)
    ms = [fitbg.margins(a, rows) for a in imgs]
    best = None
    for s1 in (0.6, 0.7, 0.85, 1.0, 1.2):
        for s2 in (0.6, 0.7, 0.85, 1.0, 1.2):
            base, d1, d2 = fitbg.components(kind, s1, s2)
            sse = 0; params = []
            for ch in range(3):
                A, b = [], []
                for (L, R) in ms:
                    for xs, M in ((slice(2, 14), L), (slice(W_PX - 14, W_PX - 2), R)):
                        bb = base[rows][:, xs, ch].mean(1); x1 = d1[rows][:, xs].mean(1); x2 = d2[rows][:, xs].mean(1)
                        A.append(np.stack([bb, np.ones_like(bb), x1, x2], 1)); b.append(M[:, ch])
                A = np.concatenate(A); b = np.concatenate(b)
                p, *_ = np.linalg.lstsq(A, b, rcond=None)
                sse += float(((A @ p - b) ** 2).sum()); params.append(p)
            if best is None or sse < best[0]:
                best = (sse, s1, s2, np.array(params), len(b) * 3)
    sse, s1, s2, params, n = best
    print(f'  fit {kind}: rms {np.sqrt(sse / (n * len(ms) * 2 / 3 * 1.0)) if False else np.sqrt(sse / (len(b) * 3 * len(ms) * 2 / 1)):.2f}  sigma x{s1},{s2}')
    return fitbg.field(kind, params, s1, s2)

def alpha_of(a, Gk):
    """share of each pixel that is something drawn over the background (white or black, as text/strokes are)."""
    E = a - Gk
    up = np.clip(E, 0, None) / np.maximum(255 - Gk, 20)
    dn = np.clip(-E, 0, None) / np.maximum(Gk, 20)
    return np.clip(np.maximum(up.max(-1), dn.max(-1)), 0, 1)

REGIONS = np.array([70, 140, 220, 335, 450, 530, 600], np.float32)

def calibrate(G, items, lam=250.0, prior=0.8):
    """How much of a change of the background shows through the glass cards, per channel and column."""
    num = np.zeros((len(REGIONS), 3)); den = np.zeros((len(REGIONS), 3))
    for a, path in items:
        for s in range(1, len(path)):
            if path[s] - path[s - 1] < 300 or s < 10 or s > len(path) - 10:
                continue
            ob, oa = path[s - 1], path[s]
            rb = np.clip(np.arange(s - 6, s - 1) - ob, 0, H_PX - 1); ra = np.clip(np.arange(s + 1, s + 6) - oa, 0, H_PX - 1)
            up = np.median(a[s - 6:s - 1], axis=0); dn = np.median(a[s + 1:s + 6], axis=0)
            Gu = np.median(G[rb], axis=0); Gd = np.median(G[ra], axis=0)
            ok = (alpha_of(up, Gu) < .2) & (alpha_of(dn, Gd) < .2)
            dI, dG = dn - up, Gd - Gu
            for i, c in enumerate(REGIONS):
                sel = ok & (np.abs(np.arange(W_PX) - c) <= 45)
                if sel.sum() < 15:
                    continue
                num[i] += (dG[sel] * dI[sel]).sum(0); den[i] += (dG[sel] ** 2).sum(0)
    k = (num + lam * prior) / (den + lam)
    return np.clip(k, 0.2, 1.0)

def kappa_map(k):
    xs = np.arange(W_PX, dtype=np.float32)
    kx = np.stack([np.interp(xs, REGIONS, k[:, ch]) for ch in range(3)], 1)      # (W,3)
    d = np.minimum(xs, W_PX - 1 - xs)
    near = smoothstep(12, 28, d)[:, None]                                          # margins show the background fully
    return 1 - (1 - kx) * near

def correct(a, G, path, kap):
    H, W, _ = a.shape
    rows = np.arange(H)
    first_seam = int(np.nonzero(np.diff(path) >= 300)[0][0] + 1)
    Gk = G[np.clip(rows - path, 0, H_PX - 1)].copy()
    # what the margins really show (the model is only fitted to about 2/255): carried a little way inwards
    M = bandmap.margin_signal(a)
    from scipy.ndimage import gaussian_filter1d
    xs = np.arange(W, dtype=np.float32)
    for side, sl, w in ((0, slice(0, 3), np.exp(-xs / 90)), (1, slice(3, 6), np.exp(-(W - 1 - xs) / 90))):
        pred = np.stack([Gk[:, 2:14, c].mean(1) if side == 0 else Gk[:, W - 14:W - 2, c].mean(1) for c in range(3)], 1)
        e = np.clip(gaussian_filter1d(M[:, sl] - pred, 3, axis=0), -14, 14)
        e[:first_seam] = 0
        Gk += e[:, None, :] * w[None, :, None]
    T = G[np.minimum(rows, H_PX - 1)]
    mean = G[250:1250].mean(0)
    t = smoothstep(first_seam, first_seam + 560, rows.astype(np.float32))[:, None, None]
    T = T * (1 - t) + mean[None] * t
    C = T - Gk
    m = 1 - smoothstep(0.12, 0.9, alpha_of(a, Gk))
    out = a + C * m[..., None] * kap[None, :, :]
    return np.clip(out, 0, 255)

def main(only=None):
    for kind, names in JOBS.items():
        names = [n for n in names if only is None or n in only]
        if not names:
            continue
        imgs = {n: load(n) for n in names}
        G = joint_fit(kind, list(imgs.values()))
        items = []
        paths = {}
        for n, a in imgs.items():
            pf = f'qa/out/path_{n}.npy'
            if os.path.exists(pf):
                path = np.load(pf)
            else:
                path, _ = bandmap.find_offsets(a, G); np.save(pf, path)
            path = path.copy()
            jumps = np.nonzero(np.diff(path) >= 300)[0]
            path[:jumps[0] + 1 if len(jumps) else 0] = 0            # the first screen is not stitched: offset exactly 0
            paths[n] = path; items.append((a, path))
            print(' ', n, [(s[0], s[2]) for s in bandmap.segments(path) if s[2] == 0 or True][:14])
        k = calibrate(G, items)
        print('  kappa by region (R,G,B):'); print(np.round(k, 2).T)
        kap = kappa_map(k)
        for n, a in imgs.items():
            out = correct(a, G, paths[n], kap)
            img = Image.fromarray(out.round().astype(np.uint8))
            img.save(f'qa/out/{n}_fixed.png')
            img.save(f'assets/{n}.webp', 'WEBP', quality=90, method=6)
            print('  ->', n, os.path.getsize(f'assets/{n}.webp') // 1024, 'KB (was', os.path.getsize(f'qa/orig/{n}.webp') // 1024, 'KB)')

if __name__ == '__main__':
    main(sys.argv[1:] or None)
