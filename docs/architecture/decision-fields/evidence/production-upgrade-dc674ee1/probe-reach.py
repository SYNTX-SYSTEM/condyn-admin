import os,re,sys
root=sys.argv[1]; targets=set(sys.argv[2:])
imp=re.compile(r'''(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)''',re.S)
def res(base,spec):
    if not spec.startswith('.'): return None
    p=os.path.normpath(os.path.join(os.path.dirname(base),spec))
    for c in [p,p+'.ts',p+'.tsx',os.path.join(p,'index.ts'),os.path.join(p,'index.tsx')]:
        if os.path.isfile(c): return c
    return None
entries=[]
for d,_,fs in os.walk(os.path.join(root,'app')):
    for f in fs:
        if re.match(r'(route|page|layout)\.tsx?$',f): entries.append(os.path.join(d,f))
for t in targets:
    hits=[]
    for e in entries:
        seen=set(); st=[(e,[e])]; found=None
        while st and not found:
            f,path=st.pop()
            if f in seen: continue
            seen.add(f)
            if os.path.relpath(f,root)==t: found=path; break
            try: src=open(f,encoding='utf-8').read()
            except: continue
            for m in imp.finditer(src):
                r=res(f,m.group(1) or m.group(2))
                if r and r not in seen: st.append((r,path+[r]))
        if found: hits.append(os.path.relpath(e,root))
    print(t,"<- reachable from",len(hits),"entries:",", ".join(sorted(hits))[:600])
