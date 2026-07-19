# Presenter run sheet: Country Data Overview (≤15 min)

The case-study page (`/case-study`) is the teleprompter: one section per beat, in
order. The structure is a decision-under-uncertainty narrative; the live demo sits
inside beat 04, where the decision is shown rather than described. Total ~14 min.

**Before you start:** open two tabs, the case-study page and a clean
`…/decision-surface/trial/trial-001`. Clear the app's localStorage so the demo starts
neutral. Pick the theme you'll present in.

---

## 00:00 · Skim (1 min) · Hero

- Read the three skim lines almost verbatim, slowly: challenge, decision, impact.
- Thesis once: _"Charts are for humans. Agents read the structured data underneath. One
  serializable state serves both."_
- One line on you: solo, covering product, design, and engineering. Frontend-only by
  design.

## 01:00 · The starting point (1.5 min) · Section 01

- **The three-era arc, spoken as a story.** Era one, scattered: "This evidence lives in
  public registries, internal trial history, and licensed benchmark databases, so for
  years the work ran on exports and spreadsheets. One in ten selected sites never
  enrolls a single patient; a wrong pick costs months, and months are patient time."
  Era two, unified: "Pulling it into one ranked view is the obvious fix, and it trades
  the old problem for two new ones: density and trust. The moment numbers from many
  systems share a table, everyone asks what each number weighs and where it came from."
- **The cast, with its org chart:** "Ana proposes from the global feasibility team.
  Vera, the trial manager for her country, reviews weeks later, accountable for a call
  she didn't watch happen. And Atlas, the agent, works on Ana's team, reading the same
  evidence. Where does an investigation live so all of them can hold the same one?
  That question had no obvious answer, and it's the decision this case study is about."
- **The bridge is SPOKEN, never written.** The page deliberately stops at the open
  question so the reviewer can draw the line themselves. In the room, you draw it:
  "These are your problems. Evidence stitched from many systems, dense data at scale,
  restorable investigation state, an agent reading the signals under the charts. The
  on-call engineer in the first minutes of an incident and the trial analyst are the
  same user." If they've drawn it before you say it, even better; let them.

## 02:30 · Forces in tension (1 min) · Section 02

- Walk the four tensions quickly; they justify everything that follows. Land on:
  "Speed for one reader, retraceability for another, typed rows for the third, and
  every number accountable for its source."

## 03:30 · Alternatives (1.5 min) · Section 03

- Give each alternative its honest one-liner and why it lost. The store-plus-share
  rejection is the one to say in full: "A view you must remember to share is a view
  that gets lost. Vera can't paste her way back at review time."
- Frame: "I wanted the rejected paths on the page because that's how decisions get
  reviewed, options first, then the call."

## 05:00 · The decision, LIVE (6 min) · Section 04, switch to the app tab

Say the decision first: "Investigation state is the URL. One writer, fixed parameter
order, defaults omitted. Byte-equal links mean equal state." Then prove it, narrating
the three lenses while driving:

1. **Answer first.** Open the plain trial URL. "The ranked shortlist is the first thing
   on screen."
2. **Product lens.** Flip Trial source to Benchmark: "Every view move lands in the URL
   as I make it. The link is the unit of trust." Then steer a weight in Ranking
   criteria and save: "And weights deliberately don't ride the link. They're part of
   the saved investigation, the decision's truth, and rank recomputes the moment I
   save."
3. **Design lens.** Point at the rank column during the flip: "Metrics changed, rank
   held still. Filtering never quietly reorders the answer. And notice what's NOT in
   the URL: scroll, cursors, drafts. Links share intent, not offsets."
4. **Engineering lens.** Open Site evidence, scroll hard: "5,121 records, about forty
   rows mounted, keyset pages, flat latency at any depth. And the one list that is NOT
   virtualized is deliberate: the re-rank animation proves cause, and windowing would
   have killed it."
5. **The agent.** Click "Show me" on an Atlas finding: "The exact view its claim is
   about, highlighted. No claim renders without a restorable view."
6. **The primitive.** Copy the URL, paste in a fresh tab: "Identical investigation.
   That's the decision, working."

## 11:00 · Outcome (1.5 min) · back to the page, Section 05

- "Everything I just did, you can redo in under a minute; the page lists the four
  steps." Then the receipts, lightly: 74 tests; 98.3 KB initial JS against a 180 KB
  build-enforced budget, and that includes this page; 56 contrast checks in both
  themes; seeded fixtures passing 13 of 13 integrity checks.
- The leverage line: "The keyset contract is the seam where a real backend plugs in
  without touching the app, and the interaction contract is cited by ID in code and
  commits, so review has a shared vocabulary."

## 12:30 · Reflection + close (1.5 min) · Section 06

- Honest, three beats: boundary tests should have come before the state-home bug, not
  after; the hardest craft call was restraint (not virtualizing the list whose motion
  carries the thesis); an agent earns trust by showing its evidence.
- Provenance, plainly: "The human loop re-implements patterns proven in a production
  system whose frontend I led. In usability testing there, users kept asking two
  questions: how is this rank calculated, and where does this number come from. The
  transparency this rebuild treats as architecture began as answers people actually
  asked for. The URL-state, the agent tier, and the findings contract are new design
  for this case study." If it fits the moment, add the stakes: "That system was
  chartered to cut about four weeks from clinical development timelines. In trials,
  calendar time is patient time; that's what a better site-selection surface buys."
- Close on the thesis: _"Charts for humans, structured data for agents. One state, and
  the link is the proof."_

---

## If the live demo breaks

Don't debug on stage. Beat 04's lenses read as prose without the pixels; narrate them
from the page, use the hero URL chip for the primitive, and recover at Outcome. The
story is the decision, not the demo.

## Anticipated questions (have these ready)

- _"Tell me about the production system."_ (Spoken only; the public page stays
  anonymized by design, and internal names/numbers stay out of the repo.) It's
  Pegasus, an internal data-driven tool for operational planning and site selection
  in clinical trials, one of the first use cases on the company's data platform.
  Its charter: contribute roughly 28 days of savings to development timelines inside
  a larger ~227-day acceleration program. It was a large cross-functional team; my
  owned scope was the frontend. This case study re-implements that human loop solo,
  and everything agent-and-URL-shaped is new design, not a copy.

- _"Why aren't the weights in the URL?"_ Deliberate split: the link shares where you're
  looking (filters, sorts, open views); the saved investigation holds what the team
  decided (weights, selection). A link that changed the ranking model on paste would
  make every old link a liar. Restoring weights across users is the multi-user next
  step named in Reflection.
- _"Why not a router?"_ One workspace, no page tree. A router is a dependency to solve
  what one small serializer solves exactly, and the serializer is what makes links
  byte-equal, which is the property everything else stands on.
- _"Does the keyset paging actually scale?"_ The contract is real: sort by (field, id),
  opaque cursor, never offsets. The data source is client-side fixtures; swapping a
  service in changes one layer. That's why the seam is drawn there.
- _"What broke while building it?"_ A store write that re-set unchanged fields, gave
  them new identities, and looped a render effect until React unmounted the tree. It's
  the reason the state-home boundaries now have regression tests, and the reason I'd
  write those tests first next time.
- _"What would break first at 10× the data?"_ Main-thread derivation. Memoized and
  under budget at this scale; past it, aggregation moves to a worker. I'd rather show
  the honest limit than pretend there isn't one.
