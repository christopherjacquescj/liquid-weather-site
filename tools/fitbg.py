"""Fit the analytic app background to the margins of the first (unstitched) screen of a capture."""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
sys.path.insert(0, 'tools')
import appbg
from appbg import S, W_PX, H_PX, PT_W, PT_H, _grid, _linear, _blurred_disc

def components(kind, s1, s2):
    """base gradient (0..255) and the two blurred unit discs."""
    w = PT_W
    if kind == 'standard':
        base = _linear([(0.04, 0.05, 0.11), (0.06, 0.10, 0.22), (0.02, 0.03, 0.08)]) * 255
        d1 = _blurred_disc(PT_W / 2 - 135, PT_H / 2 - 260, 140, 52 * s1)
        d2 = _blurred_disc(PT_W / 2 + 150, PT_H / 2 + 190, 130, 60 * s2)
    else:
        base = _linear([(0.018, 0.022, 0.055), (0.035, 0.043, 0.105), (0.018, 0.020, 0.048)]) * 255
        d1 = _blurred_disc(1.05 * w / 2 + 0.34 * w, 1.05 * w / 2 - 0.42 * w, 1.05 * w / 2, 45 * s1, radial=0.55 * w)
        d2 = _blurred_disc(1.15 * w / 2 - 0.55 * w, 1.15 * w / 2 + 0.45 * PT_H, 1.15 * w / 2, 55 * s2, radial=0.60 * w)
    return base, d1, d2

def margins(a, rows):
    L = np.median(a[rows][:, 2:14, :], axis=1)
    R = np.median(a[rows][:, W_PX - 14:W_PX - 2, :], axis=1)
    return L, R

def fit(kind, a, y0=40, y1=1100):
    rows = np.arange(y0, y1)
    L, R = margins(a, rows)
    best = None
    for s1 in (0.7, 0.85, 1.0, 1.2, 1.4):
        for s2 in (0.7, 0.85, 1.0, 1.2, 1.4):
            base, d1, d2 = components(kind, s1, s2)
            sse = 0; params = []
            for ch in range(3):
                A, b = [], []
                for side, xs, M in (('L', slice(2, 14), L), ('R', slice(W_PX - 14, W_PX - 2), R)):
                    bb = base[rows][:, xs, ch].mean(1); x1 = d1[rows][:, xs].mean(1); x2 = d2[rows][:, xs].mean(1)
                    A.append(np.stack([bb, np.ones_like(bb), x1, x2], 1)); b.append(M[:, ch])
                A = np.concatenate(A); b = np.concatenate(b)
                p, *_ = np.linalg.lstsq(A, b, rcond=None)
                sse += float(((A @ p - b) ** 2).sum()); params.append(p)
            if best is None or sse < best[0]:
                best = (sse, s1, s2, np.array(params))
    return best

def field(kind, params, s1, s2):
    base, d1, d2 = components(kind, s1, s2)
    out = np.empty_like(base)
    for ch in range(3):
        g, b, e1, e2 = params[ch]
        out[..., ch] = g * base[..., ch] + b + e1 * d1 + e2 * d2
    return out

if __name__ == '__main__':
    kind, cap = sys.argv[1], sys.argv[2]
    a = np.asarray(Image.open(f'assets/{cap}.webp').convert('RGB')).astype(np.float32)
    sse, s1, s2, params = fit(kind, a)
    n = (1100 - 40) * 2 * 3
    print(kind, cap, 'rms', (sse / n) ** .5, 's1', s1, 's2', s2)
    print(params.round(3))
    np.save(f'qa/out/fit_{kind}.npy', np.concatenate([[s1, s2], params.ravel()]))
