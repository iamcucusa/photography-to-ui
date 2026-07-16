# Presenter run sheet — Country Data Overview (≤15 min)

The case-study page (`/case-study`) is the teleprompter: one section per beat, in order.
Present from it, click into the live app for beat 03, come back to the page for the close.
Total ~14 min with the demo as the ~6-min spine — leaves slack for questions.

**Before you start:** open two tabs — the case-study page, and a clean
`…/decision-surface/trial/trial-001`. Clear the app's localStorage so the demo starts
neutral (no committed selection). Pick the theme you'll present in.

---

## 00:00 — Hook (1 min) · Hero section

- "This is a decision surface. It turns thousands of scattered records into one ranked,
  defensible decision — and it serves that decision to a human **and** an agent from the
  same state."
- Thesis, said once, slowly: *"Charts are for humans. Agents read the structured data
  underneath. One serializable state serves both."*
- One line on you: solo — product, design, and engineering. Frontend-only by design.

## 01:00 — The problem, and why it's yours (1.5 min) · Section 01

- The domain: choosing which countries a clinical trial runs in — thousands of site-level
  records, a wrong pick costs months, every call must survive a reviewer.
- **The bridge — say it explicitly:** "The domain is clinical trials, but the hard
  problems are exactly Dash0's — data-dense exploration at scale, performance over massive
  datasets, restorable investigation state, and an agent reading the signals under the
  charts. The trial analyst and the on-call engineer at 2 a.m. are the same user."

## 02:30 — Three readers (1.5 min) · Section 02

- Ana decides — the only writer of shared state. Vera verifies — read-only, and one link
  restores Ana's exact view. Atlas proposes — reads the data, not the charts; one output,
  an evidence-carrying finding.
- The product move: "The assumption I challenged is that a UI serves one user. This serves
  a human and an agent, each in its own encoding — force either into the other's and you
  fail both."

## 04:00 — LIVE DEMO (6 min) · Section 03 → switch to the app tab

Drive slowly; narrate the *why*, not the clicks.

1. **Answer first.** Open the plain trial URL. "The ranked shortlist is the first thing on
   screen — no dashboard to assemble."
2. **Provenance flip.** Switch Trial source to Benchmark. "Metrics change — but watch the
   rank column: it holds still. Rank is scope-independent by design, so filtering never
   quietly re-orders the answer under you."
3. **Steer a weight.** Open Ranking criteria, move one weight, save. "The list re-ranks in
   front of you with a 320 ms settle — the motion exists so the causality is visible. Rank
   changes only through weights, nowhere else."
4. **Scale.** Open Site evidence. Scroll hard. "Thousands of observations; never more than
   ~40 rows in the DOM. Keyset-paginated, flat latency at any depth — this is the pattern
   that survives going from thousands to billions."
5. **The agent.** Point to an Atlas card. Click **show me**. "It found that one country's
   rank rests on a single weight. 'Show me' restores the exact view the claim is about,
   countries highlighted. No claim renders without its evidence and a restorable view."
6. **The primitive.** Copy the URL, paste in a fresh tab. "Identical investigation. The
   link *is* the state — that's what lets Vera reopen exactly what Ana saw, and it's what
   an agent hands back with a finding."

## 10:00 — Architecture (2 min) · back to the page, Section 04

- The tiers, one-way flow, derive-on-read: "The derived tier is computed on read, never
  stored, so the overview and the drill-down can't contradict — one truth-source."
- The two decisions, as fork → choice → trade-off: **state in the URL** (link equality =
  state equality; the cost is serialization discipline — one canonical serializer, the
  only URL writer); **keyset + windowing** (flat-latency scale; the seam where a real
  backend plugs in — the demo runs it client-side, but the contract is production-shaped).

## 12:00 — Rigor (1.5 min) · Section 05

- "Budgets that fail the build: initial JS 98.6 KB against a 180 KB ceiling — and that
  includes this case-study page; the grid caps at 40 mounted rows; keyset pages serve
  under 30 ms." Point at the table.
- "70 tests, 54 contrast checks across both themes, zero hardcoded color enforced in CI,
  and the fixtures come from a seeded generator that passes 13 of 13 data-integrity checks
  including anti-leakage. Picky developers notice when it's done this well."

## 13:30 — The AI thread + close (1.5 min) · Section 06

- The findings contract: `Finding { claim · derivedFrom · suggestedState · status }`.
  "Atlas reads the typed rows, not the pixels. At 2 a.m. you don't want an answer — you
  want the answer and the exact view that proves it."
- What's next: a real backend behind the keyset contract (the socket's already the right
  shape); derivation off the main thread; multi-user shared state.
- **Provenance, said plainly:** "The human loop re-implements patterns I proved in a
  production system I led the frontend for. The URL-state, the agent tier, and the findings
  contract are new design for this case study."
- Close on the thesis: *"Charts for humans, structured data for agents — one state, and the
  link is the proof."*

---

## If the live demo breaks

Don't debug on stage. Fall back to Section 03's numbered checklist on the page — it reads
as a scripted walk of exactly what the demo shows — and keep narrating the *why*. The
copy-URL primitive can be shown statically with the URL chip in the hero. Recover to the
architecture section; the story doesn't depend on the pixels being live.

## Anticipated questions (have these ready)

- *"Does the keyset paging actually scale, or is it a demo trick?"* — The contract is real
  (sort by (field, id), opaque cursor, never offsets); the data source is client-side
  fixtures. Swapping a service in is a change of one layer — that's why the seam is drawn
  where it is.
- *"Why is state in the URL and not a store?"* — Because the requirement is that any view is
  restorable and shareable by a human, a reviewer, or an agent. A store can't be pasted
  into a Slack message at 2 a.m.
- *"What would break first at 10× the data?"* — Main-thread derivation. It's memoized and
  under budget at this scale; past it, aggregation moves to a worker. I'd rather show you
  the honest limit than pretend there isn't one.
