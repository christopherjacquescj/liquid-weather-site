"""Analytic model of the app's two backgrounds, rendered at capture resolution (660 px wide).

standard : AppBackgroundTheme.standard  (Home, Forecast, Compare…)  gradient + two blurred glows
cosmic   : CosmicBackground             (Lunaria)                  gradient + two radial glows (stars excluded)
Screen is 402 x 874 pt (iPhone 17 Pro); capture scale = 660/402 px per pt.
Colours are composited in gamma-encoded sRGB, as SwiftUI does.
"""
import numpy as np
from scipy.ndimage import gaussian_filter

PT_W, PT_H = 402.0, 874.0
W_PX = 660
S = W_PX / PT_W
H_PX = int(round(PT_H * S))

def _grid():
    ys, xs = np.mgrid[0:H_PX, 0:W_PX].astype(np.float32)
    return xs / S, ys / S                           # in points

def _linear(colors):
    xs, ys = _grid()
    t = (xs * PT_W + ys * PT_H) / (PT_W ** 2 + PT_H ** 2)
    stops = np.array([0.0, 0.5, 1.0], np.float32)
    c = np.array(colors, np.float32)
    out = np.empty((H_PX, W_PX, 3), np.float32)
    for k in range(3):
        out[..., k] = np.interp(t, stops, c[:, k])
    return out

def _blurred_disc(cx, cy, r, sigma_pt, radial=None):
    xs, ys = _grid()
    d = np.hypot(xs - cx, ys - cy)
    if radial is None:
        a = (d <= r).astype(np.float32)
    else:                                            # radial gradient: 1 at centre → 0 at `radial` (clipped by the frame circle)
        a = np.clip(1 - d / radial, 0, 1) * (d <= r)
    return gaussian_filter(a.astype(np.float32), sigma_pt * S, mode="constant")

def over(bg, colour, alpha):
    return bg * (1 - alpha[..., None]) + np.array(colour, np.float32) * alpha[..., None]

BLUE = (10 / 255, 132 / 255, 255 / 255)
PURPLE = (191 / 255, 90 / 255, 242 / 255)
INDIGO = (94 / 255, 92 / 255, 230 / 255)
CYAN = (100 / 255, 210 / 255, 255 / 255)

def standard(sig_scale=1.0, a1=0.26, a2=0.23):
    bg = _linear([(0.04, 0.05, 0.11), (0.06, 0.10, 0.22), (0.02, 0.03, 0.08)])
    bg = over(bg, BLUE, a1 * _blurred_disc(PT_W / 2 - 135, PT_H / 2 - 260, 140, 52 * sig_scale))
    bg = over(bg, PURPLE, a2 * _blurred_disc(PT_W / 2 + 150, PT_H / 2 + 190, 130, 60 * sig_scale))
    return bg * 255

def cosmic(sig_scale=1.0):
    bg = _linear([(0.018, 0.022, 0.055), (0.035, 0.043, 0.105), (0.018, 0.020, 0.048)])
    w = PT_W
    # circle 1: frame 1.05w at top-left of the reader, offset (0.34w, -0.42w); radial gradient to 0.55w
    c1 = (1.05 * w / 2 + 0.34 * w, 1.05 * w / 2 - 0.42 * w)
    bg = over(bg, INDIGO, 0.25 * _blurred_disc(*c1, 1.05 * w / 2, 45 * sig_scale, radial=0.55 * w))
    c2 = (1.15 * w / 2 - 0.55 * w, 1.15 * w / 2 + 0.45 * PT_H)
    bg = over(bg, CYAN, 0.12 * _blurred_disc(*c2, 1.15 * w / 2, 55 * sig_scale, radial=0.60 * w))
    return bg * 255
