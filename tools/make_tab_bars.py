#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fabrique assets/*-tab.webp : la barre d'onglets de l'app, seule, sur fond transparent.

Les captures longues de la visite sont posées derrière cette barre. Les anciens bandeaux du bas
(assets/*-bot.webp) contenaient aussi des morceaux d'écran d'autres endroits de la page : on ne garde donc
que le capsule (verre aplati) et les vrais pictos/textes de l'app (clé sur le blanc et sur le bleu).

    python3 tools/make_tab_bars.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
S, W, H = 4, 660, 154
NAMES = ["home", "forecast", "compare", "moon"]
LEFTS = {"home": 37.5, "forecast": 151.8, "compare": 266.2, "moon": 495.0}   # bord gauche de chaque onglet (px, sur 660)


def rr(x0, y0, x1, y1, r, feather=0.0):
    m = Image.new("L", (W * S, H * S), 0)
    ImageDraw.Draw(m).rounded_rectangle([x0 * S, y0 * S, x1 * S, y1 * S], radius=r * S, fill=255)
    m = m.resize((W, H), Image.LANCZOS)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(m).astype(np.float32) / 255.0


def sm(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


imgs = [np.asarray(Image.open(os.path.join(A, n + "-bot.webp")).convert("RGB")).astype(np.float32) for n in NAMES]
med = np.median(np.stack(imgs), axis=0)
cap = rr(31, 29, 629, 124, 47.5)
inner = rr(36, 34, 624, 119, 42.5)
rim = np.clip(cap - inner, 0, 1)[..., None]
mn = med.min(axis=2)
sel = (inner > .99) & (mn < 140) & (mn > 40)
glass = np.array([np.percentile(med[..., c][sel], 50) for c in range(3)])

pill_cols = []
for k, n in enumerate(NAMES):
    x0 = LEFTS[n]
    pin = rr(x0 - 1, 34, x0 + 123.5, 119, 42)
    s = imgs[k]
    m = (pin > .99) & (s.min(axis=2) < 110) & (s[..., 2] - s[..., 0] < 60)
    pill_cols.append([np.percentile(s[..., c][m], 40) for c in range(3)])
pillc = np.mean(pill_cols, axis=0)          # la même pastille pour tous les onglets

for k, n in enumerate(NAMES):
    x0 = LEFTS[n]
    pillm = rr(x0 - 5, 30, x0 + 132.5, 123, 46, feather=1.2)[..., None]
    pin = rr(x0 - 1, 34, x0 + 123.5, 119, 42)[..., None]
    prim = np.clip(pillm - pin, 0, 1)
    src = imgs[k]
    white = sm(168, 214, med.min(axis=2))[..., None]
    base = glass[None, None, :] * (1 - white) + med * white
    blue = sm(70, 140, src[..., 2] - src[..., 0])[..., None] * sm(120, 190, src[..., 2])[..., None]
    pill = pillc[None, None, :] * (1 - blue) + src * blue
    pill = pill * (1 - prim) + src * prim
    out = base * (1 - pillm) + pill * pillm
    out = out * (1 - rim) + med * rim
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert("RGBA")
    im.putalpha(Image.fromarray((cap * 255).astype(np.uint8)))
    im.save(os.path.join(A, n + "-tab.webp"), "WEBP", quality=92, method=6)
    print("écrit", n + "-tab.webp")
