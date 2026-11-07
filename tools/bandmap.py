"""Find, for every row of a stitched capture, which row of the original screen it came from."""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter
sys.path.insert(0, 'tools')
from appbg import W_PX, H_PX

def margin_signal(a):
    L = np.median(a[:, 2:14, :], axis=1)
    R = np.median(a[:, W_PX - 14:W_PX - 2, :], axis=1)
    m = np.concatenate([L, R], axis=1)                 # (H, 6)
    return median_filter(m, size=(5, 1), mode='nearest')

def model_profile(G):
    L = G[:, 2:14, :].mean(1)
    R = G[:, W_PX - 14:W_PX - 2, :].mean(1)
    return np.concatenate([L, R], axis=1)              # (H_PX, 6)

def find_offsets(a, G, lam=1500.0, clip=40.0):
    H = a.shape[0]
    M = margin_signal(a)                               # (H, 6)
    P = model_profile(G)                               # (H_PX, 6)
    omax = H - 150
    INF = 1e12
    cost_row = np.full(omax + 1, INF, np.float64)
    dp = np.full(omax + 1, INF); dp[0] = 0.0
    back = np.zeros((H, omax + 1), dtype=np.int32)     # predecessor offset
    os_ = np.arange(omax + 1)
    for y in range(H):
        r = y - os_
        ok = (r >= 0) & (r < H_PX)
        c = np.full(omax + 1, INF)
        d = M[y][None, :] - P[np.clip(r, 0, H_PX - 1)]
        cc = np.minimum((d ** 2).sum(1), clip ** 2 * 6)
        c[ok] = cc[ok]
        if y == 0:
            new = dp + c
            back[0] = os_
        else:
            # option stay: dp[o]; option jump from o' < o with penalty lam
            pm = np.minimum.accumulate(dp)
            arg = np.zeros(omax + 1, dtype=np.int32)
            # argmin prefix
            best_idx = 0; best = dp[0]; idxs = np.empty(omax + 1, dtype=np.int32)
            # vectorised prefix argmin
            idxs = np.zeros(omax + 1, dtype=np.int32)
            run_min = np.minimum.accumulate(dp)
            is_new = np.concatenate([[True], dp[1:] < run_min[:-1]])
            pos = np.where(is_new, os_, 0)
            idxs = np.maximum.accumulate(pos)
            jump = np.full(omax + 1, INF); jump[1:] = run_min[:-1] + lam
            jfrom = np.zeros(omax + 1, dtype=np.int32); jfrom[1:] = idxs[:-1]
            use_jump = jump < dp
            base = np.where(use_jump, jump, dp)
            back[y] = np.where(use_jump, jfrom, os_)
            new = base + c
        dp = new
    o = int(np.argmin(dp)); path = np.zeros(H, dtype=np.int32)
    for y in range(H - 1, -1, -1):
        path[y] = o
        o = int(back[y, o])
    return path, float(dp.min())

def segments(path):
    segs = []; start = 0
    for y in range(1, len(path) + 1):
        if y == len(path) or path[y] != path[y - 1]:
            segs.append((start, y, int(path[start]))); start = y
    return segs
