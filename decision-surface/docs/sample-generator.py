import json, random, statistics as st, itertools, os, sys

SEED = 42
rng = random.Random(SEED)
OUT = os.path.dirname(os.path.abspath(__file__))

CTRY = [("ARG","Argentina"),("AUS","Australia"),("BEL","Belgium"),("BRA","Brazil"),
        ("CAN","Canada"),("DEU","Germany"),("ESP","Spain"),("POL","Poland")]
SRC = [("src-%02d"%i, i%2==0) for i in range(1,7)]  # 6 source trials, 3 benchmark

# Latent profiles (NEVER exported). Plants: S1=POL fast startup, S2=BRA pred 2x,
# S3=ESP benchmark-weak/nonbench-strong, S4=CAN bimodal sites.
LAT = {}
for code,_ in CTRY:
    LAT[code] = dict(enroll=rng.uniform(0.35,0.75), startup=rng.uniform(140,240),
                     benchBias=1.0, bimodal=False, predMult=rng.uniform(0.9,1.15))
LAT["POL"].update(enroll=0.30, startup=55, predMult=1.0)   # S1
LAT["BRA"].update(predMult=2.0)                     # S2
LAT["ESP"].update(benchBias=0.5)                    # S3 (benchmark obs weaker)
LAT["CAN"].update(bimodal=True)                     # S4

observations, oid = [], 0
for code,_ in CTRY:
    L = LAT[code]
    nsites = rng.randint(5,10)
    for s in range(1, nsites+1):
        site = f"site-{code}-{s:02d}"
        if L["bimodal"]:
            site_q = rng.choice([0.22, 2.0])
        else:
            site_q = max(0.15, rng.gauss(1.0, 0.18))
        invs = [f"inv-{code}-{rng.randint(1,nsites*3):03d}" for _ in range(rng.randint(1,3))]
        picks = rng.sample(SRC, rng.randint(2,4))
        for tid, bench in picks:
            base = L["enroll"] * site_q * (L["benchBias"] if bench else (1.4 if code=="ESP" else 1.0))
            rate = min(3.0, max(0.05, rng.gauss(base, 0.06)))
            target = min(3.0, max(0.1, rng.gauss(L["enroll"]*1.1, 0.08)))
            days = int(min(400, max(30, rng.gauss(L["startup"], 22))))
            oid += 1
            observations.append(dict(id=f"obs-{oid:04d}", siteId=site, countryCode=code,
                sourceTrialId=tid, benchmark=bench, enrollmentRatePSM=round(rate,3),
                targetEnrollmentRatePSM=round(target,3), startupDays=days,
                investigatorIds=invs))
    # C3 guarantee: at least one of each provenance
    provs = {o["benchmark"] for o in observations if o["countryCode"]==code}
    assert provs == {True, False}, f"C3 provenance for {code}"

predictions = [dict(countryCode=code,
    predictedEnrollmentRatePSM=round(min(3.0,max(0.05, LAT[code]["enroll"]*LAT[code]["predMult"]*rng.uniform(0.92,1.08))),3),
    predictedStartupDays=int(min(400,max(30, LAT[code]["startup"]*rng.uniform(0.85,1.1)))))
    for code,_ in CTRY]

rankvars = [
  dict(id="rv-01", name="historical-enrollment", title="Historical enrollment rate",
       metricKey="historicalMedianEnrollmentRate", weight=0.2, isDefault=True, varType="Numeric", contribution="Direct"),
  dict(id="rv-02", name="performance-ratio", title="Performance ratio",
       metricKey="performanceRatio", weight=0.2, isDefault=True, varType="Numeric", contribution="Direct"),
  dict(id="rv-03", name="startup-time", title="Median startup time",
       metricKey="medianStartupTime", weight=0.2, isDefault=True, varType="Numeric", contribution="Inverse"),
  dict(id="rv-04", name="site-variability", title="Site-to-site variability",
       metricKey="siteToSiteVariability", weight=0.2, isDefault=True, varType="Numeric", contribution="Inverse"),
  dict(id="rv-05", name="predicted-enrollment", title="Predicted enrollment rate",
       metricKey="predictedEnrollmentRate", weight=0.2, isDefault=True, varType="Numeric", contribution="Direct"),
]
trial = dict(id="trial-001", name="Phase III sample study", candidateCountries=[c for c,_ in CTRY])
countries = [dict(code=c, name=n) for c,n in CTRY]

files = {"trial.json":trial, "countries.json":countries, "observations.json":observations,
         "predictions.json":predictions, "ranking-variables.json":rankvars}
for fn, data in files.items():
    with open(os.path.join(OUT,fn), "w") as f: json.dump(data, f, indent=1, sort_keys=True)

# ---------- VALIDATOR ----------
results = []
def check(cid, ok, note=""):
    results.append((cid, ok, note)); print(f"{'PASS' if ok else 'FAIL'}  {cid}  {note}")

# C1
ids = [o["id"] for o in observations]
site_ctry = {}
ok = len(set(ids))==len(ids)
for o in observations:
    ok &= o["countryCode"] in {c["code"] for c in countries}
    ok &= site_ctry.setdefault(o["siteId"], o["countryCode"]) == o["countryCode"]
ok &= all(any(o["countryCode"]==c for o in observations) for c in trial["candidateCountries"])
check("C1", ok, "ids unique, referential integrity")
# C2
check("C2", all(0<o["enrollmentRatePSM"]<=3 and 0<o["targetEnrollmentRatePSM"]<=3
     and isinstance(o["startupDays"],int) and 30<=o["startupDays"]<=400 for o in observations), "ranges")
# C3
ok=True
for c,_ in CTRY:
    obs=[o for o in observations if o["countryCode"]==c]
    ok &= len({o["siteId"] for o in obs})>=5
    ok &= {True,False} <= {o["benchmark"] for o in obs}
check("C3", ok, ">=5 sites, both provenances per country")
# C4
keys={"historicalMedianEnrollmentRate","performanceRatio","medianStartupTime","siteToSiteVariability","predictedEnrollmentRate"}
check("C4", abs(sum(v["weight"] for v in rankvars)-1.0)<1e-9 and all(v["metricKey"] in keys for v in rankvars), "weights sum 1, metricKeys derivable")
# Derivations
def quart(vals):
    # exclusive-method quartiles, works on any python3
    n=len(vals)
    def q(p):
        idx=p*(n+1)-1
        if idx<0: return vals[0]
        if idx>=n-1: return vals[-1]
        lo=int(idx); frac=idx-lo
        return vals[lo]+(vals[lo+1]-vals[lo])*frac
    return q(0.25), q(0.75)

def metrics(code, prov="all"):
    obs=[o for o in observations if o["countryCode"]==code and (prov=="all" or o["benchmark"]==(prov=="benchmark"))]
    if not obs: return None
    sites={}
    for o in obs: sites.setdefault(o["siteId"],[]).append(o["enrollmentRatePSM"])
    smeans=sorted(st.mean(v) for v in sites.values())
    med=st.median(smeans)
    q1,q3=quart(smeans)
    pred=next(p for p in predictions if p["countryCode"]==code)
    return dict(
        historicalMedianEnrollmentRate=st.median(o["enrollmentRatePSM"] for o in obs),
        performanceRatio=st.median(o["enrollmentRatePSM"]/o["targetEnrollmentRatePSM"] for o in obs),
        medianStartupTime=st.median(o["startupDays"] for o in obs),
        siteToSiteVariability=(q3-q1)/med if med else 0,
        predictedEnrollmentRate=pred["predictedEnrollmentRatePSM"],
        quart=dict(min=smeans[0],q1=q1,median=med,q3=q3,max=smeans[-1]))
# C5
ok=True
for c,_ in CTRY:
    for prov in ("all","benchmark","non-benchmark"):
        m=metrics(c,prov)
        if m:
            q=m["quart"]; ok &= q["min"]<=q["q1"]<=q["median"]<=q["q3"]<=q["max"]
check("C5", ok, "quartile ordering, all provenances")
# C6
check("C6", all(0<p["predictedEnrollmentRatePSM"]<=3 and 30<=p["predictedStartupDays"]<=400 for p in predictions), "prediction plausibility")
# C7/C8 adherence: exact keysets
shapes={"observations.json":{"id","siteId","countryCode","sourceTrialId","benchmark","enrollmentRatePSM","targetEnrollmentRatePSM","startupDays","investigatorIds"},
        "predictions.json":{"countryCode","predictedEnrollmentRatePSM","predictedStartupDays"},
        "ranking-variables.json":{"id","name","title","metricKey","weight","isDefault","varType","contribution"},
        "countries.json":{"code","name"}}
ok=True
for fn,keyset in shapes.items():
    data=json.load(open(os.path.join(OUT,fn)))
    for rec in data: ok &= set(rec.keys())==keyset
forbidden={"selected","ranking","rank","median","status","q1","q3"}
raw=" ".join(open(os.path.join(OUT,fn)).read() for fn in files)
ok &= not any(f'"{w}"' in raw for w in forbidden)
check("C7+C8", ok, "no extra keys, no runtime/derived fields in fixtures")
# C10
total=sum(os.path.getsize(os.path.join(OUT,fn)) for fn in files)
check("C10", total<500_000 and len(observations)<3000, f"{len(observations)} obs, {total//1024} KB total")
# Leakage: prediction/history correlation < 0.9
hist=[metrics(c)["historicalMedianEnrollmentRate"] for c,_ in CTRY]
pred=[next(p for p in predictions if p["countryCode"]==c)["predictedEnrollmentRatePSM"] for c,_ in CTRY]
mx,my=st.mean(hist),st.mean(pred)
r=sum((a-mx)*(b-my) for a,b in zip(hist,pred))/ (st.pstdev(hist)*st.pstdev(pred)*len(hist))
check("L2", abs(r)<0.9, f"pred/history correlation r={r:.2f}")
# Rank + scenario probes
def rank(weights, prov="all", zero=None):
    ms={c: metrics(c,prov) for c,_ in CTRY}
    ms={c:m for c,m in ms.items() if m}
    w={v["metricKey"]:(0 if v["metricKey"]==zero else v["weight"]) for v in weights}
    tot=sum(w.values()); w={k:x/tot for k,x in w.items()}
    comp={}
    for key in w:
        vals={c:ms[c][key] for c in ms}
        lo,hi=min(vals.values()),max(vals.values())
        for c in ms:
            nv=(vals[c]-lo)/(hi-lo) if hi>lo else 0.5
            if next(v for v in rankvars if v["metricKey"]==key)["contribution"]=="Inverse": nv=1-nv
            comp[c]=comp.get(c,0)+w[key]*nv
    return sorted(comp, key=lambda c:(-comp[c],c))
base=rank(rankvars)
# S1: POL drops >=3 when startup weight zeroed
drop=rank(rankvars, zero="medianStartupTime").index("POL") - base.index("POL")
check("S1", base.index("POL")<5 and drop>=3, f"POL base #{base.index('POL')+1}, drops {drop} without startup weight")
# S2: BRA prediction ~2x history
m=metrics("BRA"); ratio=m["predictedEnrollmentRate"]/m["historicalMedianEnrollmentRate"]
others=sum(1 for c,_ in CTRY if c!="BRA" and metrics(c)["predictedEnrollmentRate"]/metrics(c)["historicalMedianEnrollmentRate"]>=1.8)
check("S2", ratio>=1.8 and others<=2, f"BRA pred/hist={ratio:.2f}, {others} other countries >=1.8")
# S3: top-3 changes under benchmark-only, ESP moves
bench=rank(rankvars, prov="benchmark")
check("S3", set(base[:3])!=set(bench[:3]) and abs(base.index("ESP")-bench.index("ESP"))>=2,
      f"top3 all={base[:3]} bench={bench[:3]}, ESP {base.index('ESP')+1}->{bench.index('ESP')+1}")
# S4: CAN variability high, others low
v_can=metrics("CAN")["siteToSiteVariability"]
others=sum(1 for c,_ in CTRY if c!="CAN" and metrics(c)["siteToSiteVariability"]>0.8)
check("S4", v_can>0.8 and others<=2, f"CAN variability={v_can:.2f}, {others} others >0.8")
# C9 determinism: re-run hash check is external (same seed, same bytes)
print()
fails=[r for r in results if not r[1]]
print(f"RESULT: {len(results)-len(fails)}/{len(results)} checks passed" + ("" if not fails else "  FAILURES: "+", ".join(f[0] for f in fails)))
sys.exit(1 if fails else 0)
