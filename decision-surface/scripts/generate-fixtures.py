#!/usr/bin/env python3
"""Full-volume fixture generator + validator for decision-surface.

Scaled from docs/sample-generator.py (the executed data-spec section 9 sample)
to the section 2 volumes: 36 candidate countries, 12 source trials, 12-40
sites per country, 4-7 observations per site (~5,000-8,000 observations).

Same seed produces byte-identical files (C9). Latent profiles never leave
this script (L5); planted scenarios carry no flag in any fixture (L1).

Usage: python3 scripts/generate-fixtures.py [outdir]
Default outdir: ../src/data/fixtures relative to this script.
"""
import json, random, statistics as st, os, sys

SEED = 42
rng = random.Random(SEED)
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.normpath(
    os.path.join(HERE, "..", "src", "data", "fixtures"))
os.makedirs(OUT, exist_ok=True)

CTRY = [("ARG","Argentina"),("AUS","Australia"),("AUT","Austria"),("BEL","Belgium"),
        ("BGR","Bulgaria"),("BRA","Brazil"),("CAN","Canada"),("CHE","Switzerland"),
        ("CHL","Chile"),("COL","Colombia"),("CZE","Czechia"),("DEU","Germany"),
        ("DNK","Denmark"),("ESP","Spain"),("FIN","Finland"),("FRA","France"),
        ("GBR","United Kingdom"),("GRC","Greece"),("HUN","Hungary"),("IND","India"),
        ("ISR","Israel"),("ITA","Italy"),("JPN","Japan"),("KOR","South Korea"),
        ("MEX","Mexico"),("NLD","Netherlands"),("NOR","Norway"),("NZL","New Zealand"),
        ("POL","Poland"),("PRT","Portugal"),("ROU","Romania"),("SVK","Slovakia"),
        ("SWE","Sweden"),("TUR","Turkey"),("USA","United States"),("ZAF","South Africa")]
assert len(CTRY) == 36 and len({c for c, _ in CTRY}) == 36
SRC = [("src-%02d" % i, i % 2 == 0) for i in range(1, 13)]  # 12 source trials, 6 benchmark

# Latent profiles (NEVER exported, L5). Plants: S1=POL exceptional startup /
# mediocre rest, S2=BRA prediction ~2x history, S3=ESP benchmark-weak &
# non-benchmark-strong, S4=CAN bimodal site quality (good median, wide spread).
LAT = {}
for code, _ in CTRY:
    LAT[code] = dict(enroll=rng.uniform(0.35, 0.75), startup=rng.uniform(150, 240),
                     benchBias=1.0, nonBenchBias=1.0, bimodal=False,
                     predMult=rng.uniform(0.65, 1.45))  # wide spread keeps L2 corr < 0.9 at n=36
LAT["POL"].update(enroll=0.62, startup=45, predMult=1.0)                       # S1
LAT["BRA"].update(predMult=2.15)                                               # S2
LAT["ESP"].update(enroll=0.75, startup=95, benchBias=0.5, nonBenchBias=1.45,
                  predMult=1.0)                                                # S3
LAT["CAN"].update(enroll=0.55, startup=165, bimodal=True, predMult=1.0)        # S4

observations, oid = [], 0
for code, _ in CTRY:
    L = LAT[code]
    nsites = rng.randint(12, 40)
    for s in range(1, nsites + 1):
        site = f"site-{code}-{s:02d}"
        if L["bimodal"]:
            # Deterministic majority-high split: every third site is weak, so
            # the median stays good while the spread stays wide (S4) at any
            # draw sequence.
            site_q = 0.22 if s % 3 == 0 else 1.55
        else:
            site_q = max(0.15, rng.gauss(1.0, 0.18))
        # Per-site investigator pool; each observation staffs a subset, so
        # "present in more than one sourceTrialId" is a real distinction.
        pool = sorted({f"inv-{code}-{rng.randint(1, nsites * 3):03d}" for _ in range(rng.randint(2, 4))})
        if code == "ESP":
            # S3 structure: mostly non-benchmark sources, so the 'all' median
            # sits stably in the strong cluster and benchmark-only exposes
            # the weakness. No fixture field marks this (L1).
            picks = rng.sample([t for t in SRC if not t[1]], 4) + rng.sample(
                [t for t in SRC if t[1]], 2)
        else:
            picks = rng.sample(SRC, rng.randint(4, 7))
        for tid, bench in picks:
            invs = sorted(rng.sample(pool, rng.randint(1, min(2, len(pool)))))
            base = L["enroll"] * site_q * (L["benchBias"] if bench else L["nonBenchBias"])
            rate = min(3.0, max(0.05, rng.gauss(base, 0.06)))
            target = min(3.0, max(0.1, rng.gauss(L["enroll"] * 1.1, 0.08)))
            days = int(min(400, max(30, rng.gauss(L["startup"], 22))))
            oid += 1
            observations.append(dict(id=f"obs-{oid:05d}", siteId=site, countryCode=code,
                sourceTrialId=tid, benchmark=bench, enrollmentRatePSM=round(rate, 3),
                targetEnrollmentRatePSM=round(target, 3), startupDays=days,
                investigatorIds=invs))
    # C3 guarantee: at least one of each provenance
    provs = {o["benchmark"] for o in observations if o["countryCode"] == code}
    assert provs == {True, False}, f"C3 provenance for {code}"

predictions = [dict(countryCode=code,
    predictedEnrollmentRatePSM=round(min(3.0, max(0.05,
        LAT[code]["enroll"] * LAT[code]["predMult"] * rng.uniform(0.92, 1.08))), 3),
    predictedStartupDays=int(min(400, max(30, LAT[code]["startup"] * rng.uniform(0.85, 1.1)))))
    for code, _ in CTRY]

# Site display names (reference data, data-spec §3.6). Drawn from a SECOND
# seeded stream so this pass never disturbs the draws above — observations,
# predictions, and the planted scenarios stay byte-identical (C9).
rng2 = random.Random(SEED + 1)
TYPES = ["University Hospital", "Medical Center", "Oncology Institute", "General Hospital",
         "Cancer Center", "Research Clinic", "Clinical Institute", "Memorial Hospital"]
CITIES = {
    "ARG": ["Córdoba", "Rosario", "Mendoza", "Salta", "Tucumán"],
    "AUS": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    "AUT": ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck"],
    "BEL": ["Brussels", "Antwerp", "Ghent", "Liège", "Leuven"],
    "BGR": ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse"],
    "BRA": ["Recife", "Salvador", "Curitiba", "Campinas", "Fortaleza"],
    "CAN": ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa"],
    "CHE": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
    "CHL": ["Santiago", "Valparaíso", "Concepción", "Temuco", "Antofagasta"],
    "COL": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"],
    "CZE": ["Prague", "Brno", "Ostrava", "Olomouc", "Plzeň"],
    "DEU": ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt"],
    "DNK": ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"],
    "ESP": ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
    "FIN": ["Helsinki", "Tampere", "Turku", "Oulu", "Espoo"],
    "FRA": ["Paris", "Lyon", "Marseille", "Toulouse", "Lille"],
    "GBR": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
    "GRC": ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"],
    "HUN": ["Budapest", "Debrecen", "Szeged", "Pécs", "Győr"],
    "IND": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"],
    "ISR": ["Jerusalem", "Haifa", "Rehovot", "Netanya", "Ashdod"],
    "ITA": ["Milan", "Rome", "Turin", "Naples", "Bologna"],
    "JPN": ["Tokyo", "Osaka", "Nagoya", "Fukuoka", "Sapporo"],
    "KOR": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
    "MEX": ["Guadalajara", "Monterrey", "Puebla", "Mérida", "Toluca"],
    "NLD": ["Amsterdam", "Rotterdam", "Utrecht", "Leiden", "Groningen"],
    "NOR": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø"],
    "NZL": ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin"],
    "POL": ["Warsaw", "Kraków", "Gdańsk", "Wrocław", "Poznań"],
    "PRT": ["Lisbon", "Porto", "Coimbra", "Braga", "Faro"],
    "ROU": ["Bucharest", "Cluj", "Timișoara", "Iași", "Brașov"],
    "SVK": ["Bratislava", "Košice", "Žilina", "Nitra", "Prešov"],
    "SWE": ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Lund"],
    "TUR": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
    "USA": ["Boston", "Houston", "Chicago", "Denver", "Atlanta"],
    "ZAF": ["Johannesburg", "Durban", "Pretoria", "Bloemfontein", "Soweto"],
}
sites = []
for code, _ in CTRY:
    ids = sorted({o["siteId"] for o in observations if o["countryCode"] == code})
    pool = [f"{city} {t}" for city in CITIES[code] for t in TYPES]  # 40 unique names
    for site_id, name in zip(ids, rng2.sample(pool, len(ids))):
        sites.append(dict(id=site_id, name=name))

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
trial = dict(id="trial-001", name="Phase III oncology study",
             candidateCountries=[c for c, _ in CTRY])
countries = [dict(code=c, name=n) for c, n in CTRY]

files = {"trial.json": trial, "countries.json": countries, "sites.json": sites,
         "observations.json": observations, "predictions.json": predictions,
         "ranking-variables.json": rankvars}
for fn, data in files.items():
    with open(os.path.join(OUT, fn), "w") as f:
        json.dump(data, f, indent=1, sort_keys=True)

# ---------- VALIDATOR (data-spec section 8; C-rules section 5, L-rules section 6) ----------
results = []
def check(cid, ok, note=""):
    results.append((cid, ok, note)); print(f"{'PASS' if ok else 'FAIL'}  {cid}  {note}")

# C1
ids = [o["id"] for o in observations]
site_ctry = {}
ok = len(set(ids)) == len(ids) and ids == sorted(ids)  # unique + lexicographically sortable
for o in observations:
    ok &= o["countryCode"] in {c["code"] for c in countries}
    ok &= o["countryCode"] in o["siteId"]  # siteId embeds its country
    ok &= site_ctry.setdefault(o["siteId"], o["countryCode"]) == o["countryCode"]
ok &= all(any(o["countryCode"] == c for o in observations) for c in trial["candidateCountries"])
# sites.json reference integrity: every observed siteId named exactly once,
# names unique within their country and at most 3 words
site_names = {s["id"]: s["name"] for s in sites}
ok &= len(site_names) == len(sites)
ok &= {o["siteId"] for o in observations} == set(site_names)
for code, _ in CTRY:
    names = [s["name"] for s in sites if s["id"].startswith(f"site-{code}-")]
    ok &= len(set(names)) == len(names)
ok &= all(1 <= len(n.split()) <= 3 for n in site_names.values())
check("C1", ok, "ids unique+sortable, referential integrity incl. sites.json")
# C2
check("C2", all(0 < o["enrollmentRatePSM"] <= 3 and 0 < o["targetEnrollmentRatePSM"] <= 3
     and isinstance(o["startupDays"], int) and 30 <= o["startupDays"] <= 400 for o in observations), "ranges")
# C3
ok = True
for c, _ in CTRY:
    obs = [o for o in observations if o["countryCode"] == c]
    ok &= len({o["siteId"] for o in obs}) >= 5
    ok &= {True, False} <= {o["benchmark"] for o in obs}
check("C3", ok, ">=5 sites, both provenances per country")
# C4
keys = {"historicalMedianEnrollmentRate", "performanceRatio", "medianStartupTime",
        "siteToSiteVariability", "predictedEnrollmentRate"}
check("C4", abs(sum(v["weight"] for v in rankvars) - 1.0) < 1e-9
      and all(v["metricKey"] in keys for v in rankvars), "weights sum 1, metricKeys derivable")
# Derivations
def quart(vals):
    n = len(vals)
    def q(p):
        idx = p * (n + 1) - 1
        if idx < 0: return vals[0]
        if idx >= n - 1: return vals[-1]
        lo = int(idx); frac = idx - lo
        return vals[lo] + (vals[lo + 1] - vals[lo]) * frac
    return q(0.25), q(0.75)

def metrics(code, prov="all"):
    obs = [o for o in observations if o["countryCode"] == code
           and (prov == "all" or o["benchmark"] == (prov == "benchmark"))]
    if not obs: return None
    sites = {}
    for o in obs: sites.setdefault(o["siteId"], []).append(o["enrollmentRatePSM"])
    smeans = sorted(st.mean(v) for v in sites.values())
    med = st.median(smeans)
    q1, q3 = quart(smeans)
    pred = next(p for p in predictions if p["countryCode"] == code)
    return dict(
        historicalMedianEnrollmentRate=st.median(o["enrollmentRatePSM"] for o in obs),
        performanceRatio=st.median(o["enrollmentRatePSM"] / o["targetEnrollmentRatePSM"] for o in obs),
        medianStartupTime=st.median(o["startupDays"] for o in obs),
        siteToSiteVariability=(q3 - q1) / med if med else 0,
        predictedEnrollmentRate=pred["predictedEnrollmentRatePSM"],
        quart=dict(min=smeans[0], q1=q1, median=med, q3=q3, max=smeans[-1]))
# C5
ok = True
for c, _ in CTRY:
    for prov in ("all", "benchmark", "non-benchmark"):
        m = metrics(c, prov)
        if m:
            q = m["quart"]; ok &= q["min"] <= q["q1"] <= q["median"] <= q["q3"] <= q["max"]
check("C5", ok, "quartile ordering, all provenances")
# C6
check("C6", all(0 < p["predictedEnrollmentRatePSM"] <= 3 and 30 <= p["predictedStartupDays"] <= 400
      for p in predictions), "prediction plausibility")
# C7/C8 adherence: exact keysets, no runtime or derived fields
shapes = {"observations.json": {"id","siteId","countryCode","sourceTrialId","benchmark",
                                "enrollmentRatePSM","targetEnrollmentRatePSM","startupDays","investigatorIds"},
          "predictions.json": {"countryCode","predictedEnrollmentRatePSM","predictedStartupDays"},
          "ranking-variables.json": {"id","name","title","metricKey","weight","isDefault","varType","contribution"},
          "countries.json": {"code","name"},
          "sites.json": {"id","name"}}
ok = True
for fn, keyset in shapes.items():
    data = json.load(open(os.path.join(OUT, fn)))
    for rec in data: ok &= set(rec.keys()) == keyset
ok &= set(json.load(open(os.path.join(OUT, "trial.json"))).keys()) == {"id","name","candidateCountries"}
forbidden = {"selected","ranking","rank","median","status","q1","q3"}
raw = " ".join(open(os.path.join(OUT, fn)).read() for fn in files)
ok &= not any(f'"{w}"' in raw for w in forbidden)
check("C7+C8", ok, "no extra keys, no runtime/derived fields in fixtures")
# C10 (full volumes, data-spec sections 1-2)
total = sum(os.path.getsize(os.path.join(OUT, fn)) for fn in files)
obs_size = os.path.getsize(os.path.join(OUT, "observations.json"))
check("C10", total < 2_500_000 and obs_size <= 2_000_000
      and 4000 <= len(observations) <= 12000,
      f"{len(observations)} obs, {total // 1024} KB total, observations.json {obs_size // 1024} KB")
# L2: prediction/history correlation < 0.9
hist = [metrics(c)["historicalMedianEnrollmentRate"] for c, _ in CTRY]
pred = [next(p for p in predictions if p["countryCode"] == c)["predictedEnrollmentRatePSM"] for c, _ in CTRY]
mx, my = st.mean(hist), st.mean(pred)
r = sum((a - mx) * (b - my) for a, b in zip(hist, pred)) / (st.pstdev(hist) * st.pstdev(pred) * len(hist))
check("L2", abs(r) < 0.9, f"pred/history correlation r={r:.2f}")
# Rank + scenario probes (full-volume thresholds)
def rank(weights, prov="all", zero=None):
    ms = {c: metrics(c, prov) for c, _ in CTRY}
    ms = {c: m for c, m in ms.items() if m}
    w = {v["metricKey"]: (0 if v["metricKey"] == zero else v["weight"]) for v in weights}
    tot = sum(w.values()); w = {k: x / tot for k, x in w.items()}
    comp = {}
    for key in w:
        vals = {c: ms[c][key] for c in ms}
        lo, hi = min(vals.values()), max(vals.values())
        for c in ms:
            nv = (vals[c] - lo) / (hi - lo) if hi > lo else 0.5
            if next(v for v in rankvars if v["metricKey"] == key)["contribution"] == "Inverse": nv = 1 - nv
            comp[c] = comp.get(c, 0) + w[key] * nv
    return sorted(comp, key=lambda c: (-comp[c], c))
base = rank(rankvars)
# S1: POL top 5, drops >=6 places when the startup weight is zeroed
drop = rank(rankvars, zero="medianStartupTime").index("POL") - base.index("POL")
check("S1", base.index("POL") < 5 and drop >= 6,
      f"POL base #{base.index('POL') + 1}, drops {drop} without startup weight")
# S2: BRA prediction ~2x history, at most 2 other countries >= 1.8
m = metrics("BRA"); ratio = m["predictedEnrollmentRate"] / m["historicalMedianEnrollmentRate"]
others = sum(1 for c, _ in CTRY if c != "BRA"
             and metrics(c)["predictedEnrollmentRate"] / metrics(c)["historicalMedianEnrollmentRate"] >= 1.8)
check("S2", ratio >= 1.8 and others <= 2, f"BRA pred/hist={ratio:.2f}, {others} other countries >=1.8")
# S3: top-5 reorders under benchmark-only, ESP moves >=3 places
bench = rank(rankvars, prov="benchmark")
check("S3", set(base[:5]) != set(bench[:5]) and abs(base.index("ESP") - bench.index("ESP")) >= 3,
      f"top5 all={base[:5]} bench={bench[:5]}, ESP {base.index('ESP') + 1}->{bench.index('ESP') + 1}")
# S4: CAN good median hiding wide spread, at most 2 others > 0.8
v_can = metrics("CAN")["siteToSiteVariability"]
med_can = sorted(metrics(c)["historicalMedianEnrollmentRate"] for c, _ in CTRY).index(
    metrics("CAN")["historicalMedianEnrollmentRate"])
others = sum(1 for c, _ in CTRY if c != "CAN" and metrics(c)["siteToSiteVariability"] > 0.8)
check("S4", v_can > 0.8 and med_can >= 18 and others <= 2,
      f"CAN variability={v_can:.2f}, median rank {med_can + 1}/36 (top half), {others} others >0.8")
# C9 determinism: re-run byte-identity is checked externally (same seed, same bytes)
print()
fails = [x for x in results if not x[1]]
print(f"RESULT: {len(results) - len(fails)}/{len(results)} checks passed"
      + ("" if not fails else "  FAILURES: " + ", ".join(f[0] for f in fails)))
sys.exit(1 if fails else 0)
