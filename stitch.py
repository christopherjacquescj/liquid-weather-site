#!/usr/bin/env python3
"""Stitches successive scroll screenshots (p0, p1, …) into one tall image.

The app draws a header (status bar + buttons) and a floating tab bar over its content, so the
scrolling band excludes both. The shift between two pages is found by image registration, then
each page paints its band over the previous ones. Prints the offsets so they can be checked.

usage: stitch.py <screens folder> <prefix> <out image> [header_px] [footer_px]
       (prefix like "iphone-fr-tab0-house-fill"; pages are <prefix>-p0.png, -p1.png …)
"""
import sys, re, glob, os
import numpy as np
from PIL import Image

def load(path):
    return Image.open(path).convert("RGB")

def edges(img):
    """Binary map of strong edges (text, card borders): what identifies a position in the page."""
    g = img.astype(np.float32)
    gx = np.abs(np.diff(g, axis=1, prepend=g[:, :1]))
    gy = np.abs(np.diff(g, axis=0, prepend=g[:1, :]))
    return (gx + gy) > 14

def score(a, b, top, bottom, s, ea=None):
    """1 − share of strong edges of `a` that coincide with `b` after shifting by s (0 = perfect)."""
    rows = bottom - top - s
    if rows < 160:
        return None
    ea = edges(a) if ea is None else ea
    mask = ea[top + s: top + s + rows]
    n = int(mask.sum())
    if n < 150:
        return None
    close = np.abs(a[top + s: top + s + rows] - b[top: top + rows]) < 10
    return 1.0 - float((close & mask).sum()) / n

def register(a, b, top, bottom, expected=None, scale=4, min_shift=60):
    """Vertical shift s such that b[y] ≈ a[y + s] inside the band [top, bottom)."""
    A = np.asarray(a.convert("L").resize((a.width // scale, a.height // scale)), dtype=np.float32)
    B = np.asarray(b.convert("L").resize((b.width // scale, b.height // scale)), dtype=np.float32)
    t, bt = top // scale, bottom // scale
    if expected is not None:
        lo, hi = max(min_shift // scale, expected // scale - 24), expected // scale + 24
    else:
        lo, hi = min_shift // scale, (bt - t) - 40 // scale
    EA = edges(A)
    best, best_s = None, None
    for s in range(lo, hi):
        d = score(A, B, t, bt, s, EA)
        if d is not None and (best is None or d < best):
            best, best_s = d, s
    if best_s is None:
        return 0, 99.0
    # refine at full resolution
    Af = np.asarray(a.convert("L"), dtype=np.float32)
    Bf = np.asarray(b.convert("L"), dtype=np.float32)
    fine_best, fine_s = None, best_s * scale
    EAf = edges(Af)
    for s in range(best_s * scale - 6, best_s * scale + 7):
        d = score(Af, Bf, top, bottom, s, EAf)
        if d is not None and (fine_best is None or d < fine_best):
            fine_best, fine_s = d, s
    return fine_s, fine_best if fine_best is not None else 99.0

def main():
    folder, prefix, out = sys.argv[1], sys.argv[2], sys.argv[3]
    header = int(sys.argv[4]) if len(sys.argv) > 4 else 340
    footer = int(sys.argv[5]) if len(sys.argv) > 5 else 2560
    files = sorted(glob.glob(os.path.join(folder, f"{prefix}-p*.png")), key=lambda p: int(re.search(r"-p(\d+)\.png$", p).group(1)))
    pages = [load(f) for f in files]
    w, h = pages[0].size
    offsets = [0]
    kept = [pages[0]]
    for i in range(1, len(pages)):
        prev, cur = pages[i - 1], pages[i]
        # Did the page move at all? (identical bands = the end of the content was reached)
        A = np.asarray(prev.convert("L").resize((w // 4, h // 4)), dtype=np.float32)
        B = np.asarray(cur.convert("L").resize((w // 4, h // 4)), dtype=np.float32)
        still = score(A, B, header // 4, footer // 4, 0)
        if still is not None and still < 0.05:
            print(f"page {i}: did not move (err {still:.2f}) -> end of content")
            break
        shift, err = register(prev, cur, header, footer)
        print(f"page {i}: shift {shift}px err {err:.2f}")
        if err > 0.5 or shift < 40:
            print("  ! no reliable match -> stop")
            break
        offsets.append(offsets[-1] + shift)
        kept.append(cur)
    pages = kept
    valid = list(zip(offsets, pages))
    total = valid[-1][0] + h
    canvas = Image.new("RGB", (w, total))
    canvas.paste(valid[0][1], (0, valid[0][0]))
    painted_to = valid[0][0] + footer            # canvas row up to which the band of the previous page is painted
    for o, p in valid[1:]:
        band_top, band_bottom = o + header, o + footer
        lo, hi = band_top, painted_to              # overlap between the new band and what is already painted
        seam = band_top
        if hi - lo > 200:
            # cut where the two captures agree best (inside the middle of the overlap)
            cv = np.asarray(canvas.crop((0, lo, w, hi)).convert("L"), dtype=np.float32)
            pv = np.asarray(p.crop((0, header, w, header + (hi - lo))).convert("L"), dtype=np.float32)
            rowdiff = np.abs(cv - pv).mean(axis=1)
            k = 24
            smooth = np.convolve(rowdiff, np.ones(k) / k, mode="same")
            m0, m1 = int((hi - lo) * 0.25), int((hi - lo) * 0.75)
            seam = lo + m0 + int(np.argmin(smooth[m0:m1]))
        canvas.paste(p.crop((0, seam - o, w, footer)), (0, seam))
        painted_to = band_bottom
    last_o, last_p = valid[-1]
    canvas.paste(last_p.crop((0, footer, w, h)), (0, last_o + footer))
    canvas.save(out)
    print("stitched", len(valid), "pages ->", out, canvas.size, "offsets", [o for o, _ in valid])

main()
