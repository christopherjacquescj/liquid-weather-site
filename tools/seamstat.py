import sys, numpy as np
from PIL import Image
def stats(name, fixed):
    a=np.asarray(Image.open(f'qa/orig/{name}.webp').convert('RGB')).astype(np.float32)
    b=np.asarray(Image.open(fixed).convert('RGB')).astype(np.float32)
    path=np.load(f'qa/out/path_{name}.npy')
    seams=[s for s in range(1,len(path)) if path[s]-path[s-1]>=300]
    tot_b=[];tot_a=[]
    print(name)
    for s in seams:
        def st(img): return np.median(img[s+1:s+6],axis=0)-np.median(img[s-6:s-1],axis=0)
        sb,sa=st(a),st(b)
        row=[]
        for nm,xs in (('mL',slice(2,14)),('g60-200',slice(60,200)),('g250-420',slice(250,420)),('g460-630',slice(460,630)),('mR',slice(646,658))):
            vb=np.median(sb[xs],axis=0); va=np.median(sa[xs],axis=0)
            row.append('%s %s→%s'%(nm,vb.round(0).astype(int).tolist(),va.round(0).astype(int).tolist()))
            tot_b.append(np.abs(vb).max()); tot_a.append(np.abs(va).max())
        print(' ',s,' | '.join(row))
    print('  mean |max step| before %.1f after %.1f'%(np.mean(tot_b),np.mean(tot_a)))
if __name__=='__main__':
    for n in sys.argv[1:]:
        stats(n,f'qa/out/{n}_fixed.png')
