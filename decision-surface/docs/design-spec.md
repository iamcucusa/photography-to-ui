# Case-Study Design Spec: Country Data Overview

> Requirements for the case-study build: a standalone, mostly client-side
> project. This document says what the product must do, in one voice. Where a
> requirement matches something Pegasus already did, it is stated as a
> requirement anyway. Background analysis (why these requirements, what Pegasus
> proved) lives in the Pegasus analysis docs (kept outside this repo).
> Read those for context, never as build instructions.
> The mock-data contract (fixtures, constraints, anti-leakage) is
> `data-spec.md`; it implements §G and never overrides it.
> Personas, used by name throughout: **Ana**, the feasibility analyst who decides
> (P1). **Vera**, the reviewer who verifies (P2). **Agent Atlas**, the
> decision-support agent that reads the data under the charts (P3).

---

## A. Problem

Planning a clinical trial means choosing which countries to run it in. The
evidence is scattered and statistical: how sites in each country performed across
comparable historical trials. Enrollment rates, startup times, site-to-site
variability, investigator depth. All of it split by whether those historical
trials are truly comparable ("benchmark") or not. Raw, this is thousands of
site-level data points across dozens of countries. No human can eyeball it.

The product is the decision surface for that choice. It compresses the evidence
into a ranked, comparable, per-country view. It lets the expert define what
"good" means by adjusting ranking weights. It records the include-or-exclude
decision as shared, persistent state. And it serves that state to three readers
at once: the analyst, the reviewer, and the agent.

One sentence: *a decision surface that turns a large body of historical
performance data into a ranked country shortlist, where the ranking criteria are
user-steerable, every decision is persisted shared state, and humans and an
agent work from that same state.*

## The feature: Country Data Overview

*The canonical description. UX derives and validates the user flows from it,
product scopes and accepts against it, engineering maps it to the contracts in
§G, and an implementing model follows it without inventing behavior.*

**Definition.** One screen where Ana turns historical performance evidence into
a saved country shortlist. Every candidate country (roughly 10 to 60) is one
ranked row, backed by three evidence families and per-country distributions.
Ana tunes what the rank means, selects countries, and commits. The whole
investigation lives in the URL, so Vera can reopen it exactly, and Agent Atlas
reads the same data to propose findings.

**What it does.** Six capabilities. Each is a complete interaction with a
defined outcome; §D gives the business rules, §E the step-by-step flows.

1. **Rank.** Show all candidate countries as one list, ordered by a composite
   score. The current best answer is the first thing on screen.
2. **Explain.** For any country, show the evidence behind its rank: the three
   families, the distribution behind each median, and the raw site evidence in
   a windowed grid that scales to thousands of records.
3. **Re-scope.** Filter by provenance, country scope, and evidence family. The
   list updates instantly and the URL updates with it.
4. **Steer.** Edit the ranking weights. The score recomputes and the list
   re-orders. Rank changes this way and no other way.
5. **Decide.** Select countries and commit. Selection, weights, and the
   investigation record persist as shared state, and the analytics refresh.
6. **Assist.** Atlas reads the same data, proposes findings with evidence, and
   each finding restores the exact view it is about. Ana accepts or rejects,
   and the next run learns from her answer.

**Who can do what.** The permission model in one view. Every control, route,
and write in the build must trace to a "yes" cell here; anything that doesn't
is out of scope.

| # | Capability | Ana | Vera | Atlas |
|---|---|---|---|---|
| 1 | Rank | yes | yes | reads the same rows |
| 2 | Explain | yes | yes | reads the same fields |
| 3 | Re-scope | yes, and her URL updates | yes, her own view only | not needed: reads unfiltered data |
| 4 | Steer weights | yes | no | may propose a change, never apply it |
| 5 | Decide and commit | yes | no | never |
| 6 | Findings | accepts or rejects | sees them with their evidence | emits them; learns from answers |

Three persona rules the table implies. Ana is the only writer of shared state.
Vera has the full surface with zero write paths; read-only is a role, not a
degraded page. Atlas has full read access and exactly one output type, the
finding; filters shape human views, never its input.

**Entry and exit.** A plain URL opens a trial's default view. An investigation
link restores an exact prior view (§G.3). There is no "finish": Ana leaves
after a commit, with everything saved, or without one, with her view still
shareable as a URL and the data untouched. Nothing is lost silently: an
uncommitted selection is visibly pending until she saves or discards it.

**Every state has a next step.** The §E flows close every one of these paths,
not just the happy one:
- *No data for the trial.* The surface says what is missing and where it comes
  from.
- *Weights that don't total 100%.* Save stays disabled and the remainder is
  shown until fixed.
- *Empty filter result.* The empty state names the active filters, and one
  action clears them.
- *A finding about a country the current filter hides.* Opening the finding
  switches the view. A finding never points at something invisible.
- *A failed load or save.* The error names what failed and offers retry. What
  Ana entered is kept.

**Done means.** Four feature-level checks:
1. Any investigation is restorable from its URL, by Ana, by Vera, or by a
   finding.
2. Rank changes only through weights; selection changes only through explicit
   commit.
3. Every Atlas claim opens its evidence and its view; claims without either do
   not render.
4. Each of the five information items in §C renders for Ana, reads typed for
   Atlas, and links back (the §C table is the checklist).

## B. Target audience & personas

### Target audience

Clinical-operations experts who decide which countries a trial runs in, and must
defend that choice in a regulated setting. They know the domain and the
statistics; they are not engineers. Two facts shape the design. First, this
expertise is rare, so the surface must make reasoning visible and repeatable
instead of locked in a few heads. Second, the surface has two readers: the
human, who needs fast, legible views to spot patterns, and the agent, which
reads the structured data underneath. Both work from the same shared state.
Serve each in its own encoding. Force either into the other's, and you fail
both.

### P1: Ana, the feasibility analyst (primary human, expert)

- **Who & pressure.** Ana plans country selection for several trials a year.
  This choice gates the whole trial timeline, a wrong pick costs months, and
  everything she decides must hold up in front of leadership and reviewers.
- **Goal.** Reach a defensible ranked shortlist fast. See why each country ranks
  where it does. Adjust the ranking weights when a trial doesn't fit the default.
- **Needs.** Density and short paths. The ranked list is the spine of the
  surface, and every evidence view is one action away.
- **Trust.** Ana rejects black-box scores, so the ranking must be inspectable
  and steerable. She is also the person most likely to over-trust the agent, so
  its findings always arrive with their evidence, never as bare answers.

### P2: Vera, the reviewer / approver (secondary human, read-mostly)

- **Who & pressure.** Vera signs off on the shortlist later. She is accountable
  for a decision she didn't watch being made.
- **Goal.** Retrace why these countries: which filters, which weights, which
  distributions supported the call.
- **Needs.** One link reopens the exact investigation that produced the
  decision: same data, same filters, same view (§G.3).
- **Trust.** Her risk is too little trust: if she can't retrace the reasoning,
  she redoes the analysis or blocks the decision. Vera gets the full surface in
  a read-only role, without commit actions.

### P3: Agent Atlas, the decision-support agent (non-human persona)

A persona in its own right. It has goals, needs, and failure modes like any
user, and it negotiates with Ana and Vera over who acts, on the same shared
state.

- **Who.** A software actor reading the same data as Ana and Vera, never a
  fork. Its senses: the typed country rows, the ranking weights, the benchmark
  set, the saved selections. Atlas reads the data under the charts, not the
  charts.
- **Goal.** Spot what a human under time pressure misses. A rank carried by one
  weight. A prediction far from history. An ordering that flips when filtered.
  Atlas proposes; it never commits. Selection and weights stay human-owned.
- **Needs.**
  1. A queryable data tier instead of pixels (§G.1).
  2. One truth-source per metric, with stable entity IDs.
  3. Findings that link back to the human view: every finding carries the view
     state (§G.3), so "show me" restores exactly what the claim is about.
  4. Write access to proposals only, plus sight of human corrections, so a
     re-run learns from them.
- **Trust.** An unlinked claim is the surface's biggest trust risk, because
  explanations without a way to verify and override make over-trust worse. One
  hard rule: **no claim without its evidence and its restorable view.**

## C. The decision Ana is making

**"Which countries should this trial include?"** A multi-select over roughly 10
to 60 candidates, committed explicitly.

**What a good decision looks like.** The three qualities her persona demands:
- *Defensible.* Every included country points to the evidence that earned its
  place. This is what survives leadership and review.
- *Balanced.* No country gets in or out on one flattering number. The rank is a
  weighted composite, and spread sits next to every median.
- *Revisitable.* Saving is an update, not a verdict. When a trial doesn't fit
  the default, Ana changes the weights and decides again.

The costs are asymmetric. A wrong pick costs months, as startup delay. An
unclear pick costs days, when Vera cannot retrace it and blocks sign-off. The
surface optimizes both at once: speed for Ana, traceability for Vera.

**The minimal information set.** Five items. One list, two readers: what the UI
renders fast for Ana is also the read contract Atlas consumes.

1. The **composite rank** per country. The list's default order.
2. The **three evidence families** behind the rank: footprint (sites,
   investigators), enrollment and performance (historical against predicted),
   and timelines (startup, site-to-site variability).
3. **Provenance.** The same metrics restricted to benchmark trials only, one
   action to switch.
4. **Spread, not just medians.** Per-country distributions next to the point
   estimates. Medians without spread mislead.
5. **What the rank means.** The weight vector, open and editable.

The list maps onto Ana's persona: item 1 gives her speed, items 2 to 4 give her
the why, item 5 gives her the steering. Every item is one action away.

**What the commit captures.** One commit, three readers:
- the selection vector, `{id, selected}` per country;
- the ranking weights in force at commit time;
- the investigation record: the §G.3 view state that produced the decision.

All of it is readable by Atlas through the same tier the UI uses. Nothing about
the decision lives only in pixels or only in memory.

**One map from information to data, interaction, and agent check.** Each row is
an acceptance criterion.

| # | Information | Atlas reads (data) | Ana's interaction | Atlas check |
|---|---|---|---|---|
| 1 | Composite rank | `ranking` on the country row | default sort of the list | is the rank carried by a single weight? |
| 2 | Evidence families | the metric fields per row | switch family, one action | prediction far from its own history |
| 3 | Provenance | provenance field on each row | one filter action | does the top 5 flip under benchmark-only? |
| 4 | Distributions | derived quartile series | open distribution view per country | good median hiding a wide spread |
| 5 | Rank meaning | the weight vector | edit weights, must sum to 100% | weights drifted far from defaults, flag it |

Rule derived from the table: render every row fast for Ana, expose it typed for
Atlas, and link every Atlas claim back to the exact interaction in its row. If a
new metric cannot fill all three columns, it does not ship.

## D. Business rules

One table, cited by ID from every flow in §E, enforceable in code.

| ID | Rule | Defined in |
|---|---|---|
| BL1 | Rank changes only through the weight vector; recompute happens in the data layer | Feature entry, §C |
| BL2 | Selection changes only through explicit commit | Feature entry, §C |
| BL3 | Weights must total 100%; until then save is disabled and the remainder is shown | Feature entry, §C item 5 |
| BL4 | A commit persists three things: the selection vector, the weights in force, the investigation record | §C, §G.3 |
| BL5 | A finding without `derivedFrom` and `suggestedState` is invalid and never renders | §G.4 |
| BL6 | Findings are proposals; only humans write shared state; finding status is visible to the next Atlas run | §G.4, feature matrix |
| BL7 | Every view-state change lands in the URL; a link restores the exact investigation | §F, §G.3 |
| BL8 | Vera has the full surface with zero write paths | Feature matrix, §B |
| BL9 | An uncommitted selection is visibly pending until saved or discarded; nothing is lost silently | Feature entry |
| BL10 | One truth-source per metric; aggregation happens below the view. The overview renders tens of marks; raw site evidence renders only through the windowed grid: tens of mounted rows over thousands of records | §G.1, §G.2 |

## E. User flows

Four flows: one per persona, plus the joint human-and-agent loop. Build order:
A first, then C, then D; B validates the share primitive end to end.

**Notation.** Numbered steps are the happy path. Lettered steps with E (3a-E)
are edge, error, or exit branches of the step they follow. System responses
cite the §D rules. *End-to-end* means happy path plus all edges.

### Flow A: Ana commits a shortlist

**Persona:** Ana. **Type: end-to-end.**
**Goal, stated exactly:** "Commit a defensible country shortlist for trial T,
with the investigation shareable as a link."
**Preconditions:** Ana is authenticated with the edit role; trial T exists.
**Exit points:** step 8, 8a-E, 1a-E.

| Step | User goal | Trigger / Action | System response | Success / Error state |
|---|---|---|---|---|
| 1 | Start or resume the investigation for trial T | Opens the surface for trial T (plain URL or investigation link) | Loads the trial; renders the ranked list first, sorted by composite rank; URL reflects the state (BL7) | Success: ranked list visible with rank, active evidence family, selection, counts |
| 1a-E | Understand why there is nothing to work on | Trial T has no country data | Surface states what is missing and where it comes from | Exit point: no dead end, Ana knows the next action outside this surface |
| 1b-E | Recover from a failed load | Load request fails | Error names what failed and offers retry; no partial UI | Error with recovery: retry re-runs step 1 |
| 2 | See the current best answer before touching anything | Reads the default view | Nothing to compute: rank order is the spine, answer-first (BL1, BL10) | Success: shortlist shape visible in seconds |
| 3 | Focus the evidence on what is comparable to this trial | Toggles provenance, country scope, or evidence family; or types a country search | List updates instantly; URL updates with each change (BL7) | Success: list reflects scope; state shareable at any moment |
| 3a-E | Get back to a useful view | Active filters produce zero rows | Empty state names the active filters; one action clears them | Recovery: clear returns to step 2 view |
| 4 | Understand why country X ranks where it does | Opens country X's distribution view | Shows quartiles and spread behind each median; outliers toggle; time-unit switch re-buckets (BL10) | Success: spread visible next to the point estimate |
| 4b | See the raw evidence behind the aggregates | Opens the site evidence grid | Windowed grid over every observation in scope; rows mount on scroll via keyset pages from the data layer (BL10) | Success: thousands of records reachable, tens of rows in the DOM |
| 5 | Make the rank reflect this trial's profile | Opens ranking criteria; edits per-variable weights; may add a custom variable | Shows live total and remainder while editing (BL3) | In progress: save disabled until total is 100% |
| 5a-E | Know exactly what is wrong with my weights | Total is not 100% | Save stays disabled; remainder shown until fixed (BL3) | Validation error, inline, self-explaining |
| 5b | Apply my definition of "good" | Saves valid weights | Composite recomputes in the data layer; list re-orders on fresh numbers (BL1) | Success: new ranking visible; weights now in force |
| 5c-E | Not lose my edits to a failure | Weight save fails | Error names what failed, offers retry; edits kept | Error with recovery: retry re-runs 5b |
| 6 | Mark my shortlist | Checks and unchecks countries | Selection shown as visibly pending, not yet shared state (BL2, BL9) | In progress: pending state distinct from committed state |
| 7 | Make the decision permanent and visible to everyone | Explicit commit ("Save Countries") | Persists selection, weights in force, and the investigation record; derived analytics refresh (BL4) | Success: committed state confirmed; pending indicator cleared |
| 7a-E | Not lose my selection to a failure | Commit fails | Error names what failed, offers retry; selection kept as pending (BL9) | Error with recovery: retry re-runs 7 |
| 8 | Hand the investigation to others exactly as I see it | Copies the URL; leaves | Link restores this exact view for anyone with access (BL7) | Exit point: clean, everything committed |
| 8a-E | Leave without committing, on purpose | Navigates away with pending selection | Pending state is visible and must be saved or discarded; nothing lost silently (BL9) | Exit point: deliberate, with an explicit choice |

### Flow B: Vera retraces and reaches a verdict

**Persona:** Vera. **Type: end-to-end.**
**Goal, stated exactly:** "Verify why these countries were chosen, well enough
to sign off or block."
**Preconditions:** Vera is authenticated with the read-only role; she has an
investigation link (from Ana or from a finding).
**Exit points:** step 5. The sign-off action itself is outside this surface in
the first version: Vera has zero write paths (BL8).

| Step | User goal | Trigger / Action | System response | Success / Error state |
|---|---|---|---|---|
| 1 | Reopen the exact investigation that produced the shortlist | Opens the investigation link | Restores data, filters, sort, and view precisely as committed (BL7) | Success: Vera sees what Ana saw, not a default view |
| 1a-E | Recover from a failed load | Restore fails | Error names what failed, offers retry | Error with recovery: retry re-runs 1 |
| 2 | See what was decided and by which criteria | Reads the restored view | Shows the committed selection and the weights in force; no commit actions anywhere (BL8) | Success: outcome and criteria both visible, read-only |
| 3 | Probe the evidence myself without breaking anything | Re-scopes her own view: filters, distributions, search | Her view and her URL update; shared state untouched (BL7, BL8) | Success: full surface, zero write paths; not a degraded page |
| 3a-E | Get back to a useful view | Her filters produce zero rows | Empty state names her filters; one action clears them | Recovery: same as Flow A 3a-E |
| 4 | Confirm the rank means what it claims to mean | Opens the ranking criteria, read-only | Shows the weight vector and custom variables; no editing (BL8) | Success: the composite is explainable, not a black box |
| 5 | Reach a verdict I can stand behind | Satisfied, or not | Nothing to do on the surface: both verdicts happen outside it in v1 | Exit point: approve (sign-off outside), or block and send her link back to Ana as the exact point of disagreement |

### Flow C: Atlas emits a valid finding

**Persona:** Agent Atlas (non-human). **Type: end-to-end.** An agent
interaction flow: "user goal" is what Atlas must accomplish at that step.
**Goal, stated exactly:** "Emit only findings a human can verify in one click,
and learn from every answer."
**Preconditions:** read access to the row tier, weights, selections, benchmark
membership (§G.1). Runs after shared state changes.

| Step | User goal | Trigger / Action | System response | Success / Error state |
|---|---|---|---|---|
| 1 | Know the full, unfiltered state | Shared state changed (commit, weight save) | Data tier serves the same typed rows and weights the UI reads; no human filter applies (BL10, feature matrix) | Success: Atlas and Ana read identical numbers |
| 2 | Find what the humans missed | Runs its checks: rank carried by one weight, prediction far from history, order flips under provenance, median hiding wide spread, weights far from defaults (§C table) | Analysis over typed fields only, never rendered views | Success: zero or more candidate claims |
| 3 | Only speak claims a human can verify | Assembles each claim with `derivedFrom` and `suggestedState` | Contract validation (BL5) | Success: valid finding. Error: invalid finding is discarded and never renders; no partial cards |
| 4 | Surface the finding without interrupting | Emits the valid finding | Renders as a card beside the list, never blocking it (§F); carries its restorable view (BL7) | Success: visible, ignorable, verifiable |
| 5 | Learn from the human's answer | Ana sets accepted or rejected | Status lands in shared state, visible to the next run (BL6) | Success: the next run incorporates the answer. Quiet state: no new claims, no cards, no noise |

### Flow D: Ana and Atlas close the loop together

**Personas:** Ana with Atlas. **Type: end-to-end** for the interaction loop;
assumes Flow A works.
**Goal, stated exactly:** "Use Atlas to catch what I missed, verify its claim
against the evidence, and let the system learn from my answer."
**Preconditions:** Flow A in progress or completed; Flow C has emitted at least
one finding.
**Exit points:** step 6, or any Flow A exit.

| Step | User goal | Trigger / Action | System response | Success / Error state |
|---|---|---|---|---|
| 1 | Stay focused until I choose to look | A finding card appears beside the list | Card is non-blocking; the list stays fully usable (§F) | Success: no interruption; finding waits |
| 2 | Judge whether the claim is worth my time | Opens the card | Shows the one-sentence claim and the exact rows and fields it derived from (BL5) | Success: claim assessable in one read |
| 3 | See exactly what the claim is about | Activates "show me" | Restores the finding's `suggestedState`: filters, sort, highlighted countries (BL7) | Success: the view now shows what the claim describes |
| 3a-E | Trust that findings never point at nothing | The finding concerns a country her current filter hides | The view switches so the country is visible; a finding never points at something invisible | Success by rule: no dead end possible here |
| 4 | Verify the claim against the data | Inspects the highlighted rows and the distribution | Same evidence surfaces as Flow A steps 3 and 4 | Success: Ana confirms or refutes with data, not trust |
| 5a | Act on a claim I accept | Marks accepted; edits weights or selection accordingly | Her edits follow Flow A rules (BL1, BL2); status recorded (BL6) | Success: human-owned correction on shared state |
| 5b | Dismiss a claim I refute | Marks rejected | Status recorded, visible to the next run (BL6) | Success: rejection is also signal, not silence |
| 6 | Let the system catch up with my corrections | Commits (Flow A step 7) | Atlas re-reads shared state (Flow C step 1); re-run reflects her answers | Success: loop settles. Quiet state: no new findings is a valid, calm end |

### Coverage check

Every edge state in the feature entry maps to a flow step:

| Feature-entry edge state | Flow step |
|---|---|
| No data for the trial | A 1a-E |
| Weights that don't total 100% | A 5a-E |
| Empty filter result | A 3a-E, B 3a-E |
| Finding about a hidden country | D 3a-E |
| Failed load or save | A 1b-E, 5c-E, 7a-E; B 1a-E |
| Uncommitted selection on exit | A 8a-E |
| Invalid finding | C 3 |

Anything a flow does that this spec does not state is out of scope.

## F. Information architecture

How information is organized, labeled, and navigated. Four parts: zones
(organization), the URL (navigation), the vocabulary (taxonomy and labels),
and disclosure rules (priority). Everything here binds to the §G.3 state
shape and the six feature capabilities; nothing introduces new concepts.

### F.1 Organization: seven named zones

One screen, seven zones. The names are canonical: use them in code, tests,
and design files.

| Zone | Capability | Shows | State it owns (§G.3) |
|---|---|---|---|
| `ContextBar` | entry, commit | Trial name, commit state (pending or saved), the share link | `trialId` |
| `ScopeBar` | 3 Re-scope | The three scope controls plus country search, always visible | `provenance`, `countriesScope`, `evidenceFamily`, `list.filterText` |
| `CountryList` | 1 Rank, 5 Decide | The ranked rows: rank, active family's metrics, selection checkboxes, counts | `list.sortField`, `list.sortOrder` |
| `DistributionPanel` | 2 Explain | One country's quartiles and startup buckets, outliers toggle, unit switch | `distribution` |
| `SiteExplorer` | 2 Explain (site level) | The windowed evidence grid: every observation in scope, sortable, only visible rows mounted | `sites` |
| `RankingCriteria` | 4 Steer | The weight vector and custom variables, behind an explicit control | none (weights are shared state, not view state) |
| `FindingsRail` | 6 Assist | Atlas cards beside the list, never blocking it | `highlight` |

Hierarchy: trial, then investigation (both in the URL), then the overview
(`CountryList` with context), then per-country detail (`DistributionPanel`),
then the site-level drill (later version, §H).

### F.2 Navigation: the URL is the navigation system

There is no page tree to navigate; there is one workspace whose every view
state is addressable. Route: `/trial/:trialId`. Every other §G.3 field maps
to one query parameter:

| §G.3 field | Param | Values | Default |
|---|---|---|---|
| `provenance` | `prov` | `all`, `benchmark`, `non-benchmark` | `all` |
| `countriesScope` | `scope` | `all`, `selected` | `all` |
| `evidenceFamily` | `family` | `footprint`, `enrollment-performance`, `timelines` | `footprint` |
| `list.sortField` + `list.sortOrder` | `sort` | `<field>:asc` or `<field>:desc` | `ranking:desc` |
| `list.filterText` | `q` | free text, country name only | empty |
| `distribution` | `dist` | `<countryCode>:<all|outliers>:<unit>`, absent when null | absent |
| `sites` | `sites` | `<sortField>:<asc|desc>`, absent when closed | absent |
| `highlight` | `hl` | comma-separated country codes, set by findings only | absent |

Two serialization rules make links stable (BL7):
1. **Omit defaults.** A parameter at its default value never appears, so the
   plain entry URL is `/trial/trial-001`.
2. **Canonical order.** Parameters serialize in the table's order, so equal
   states always produce byte-equal links. Link equality is state equality.

Entry points, all landing in the same workspace: a plain trial URL (defaults),
an investigation link from Ana or Vera (full state), a finding's "show me"
(the finding's `suggestedState`).

### F.3 Taxonomy: one term everywhere

The controlled vocabulary. Each term has exactly one UI label, one code
identifier, and one URL value; never introduce synonyms.

| Concept | UI label | Values (code / URL) | Defined in |
|---|---|---|---|
| Provenance | "Trial source" | `all`, `benchmark`, `non-benchmark` | §G.3 |
| Evidence family | "Evidence" | `footprint`, `enrollment-performance`, `timelines` | §C item 2 |
| Country scope | "Countries" | `all`, `selected` | §G.3 |
| Selection state | "Pending" / "Saved" | runtime shared state | BL9, §G.0 |
| Finding status | "Proposed" / "Accepted" / "Rejected" | `proposed`, `accepted`, `rejected` | §G.4 |
| Site evidence | "Site evidence" | the windowed observation grid, read-only | §G.2 |
| Commit action | "Save Countries" | the only shared-state write for selection | BL2 |
| Weight total | "Remaining" | shown until weights total 100% | BL3 |

### F.4 Priority and progressive disclosure

- **Prioritization.** Rank order is the spine. Charts are context, not
  navigation. The current best answer renders first.
- **Progressive disclosure.** One evidence family visible at a time.
  Distributions on demand. Ranking internals behind an explicit control.
  Findings wait in their rail.
- **Shown by default:** rank, the active family's metrics, selection state,
  counts, finding badges. **Hidden until asked:** the other families, the
  weight vector, custom variables, and the site evidence grid (on demand,
  windowed).

### F.5 Wayfinding: the user always knows where they are

- The active scope is always visible in `ScopeBar`; the empty state names it
  (Flow A 3a-E depends on this).
- Pending or saved is always visible in `ContextBar` (BL9).
- The URL is always current, so "where am I" and "send this to someone" are
  the same answer (BL7).
- Finding badges count unread proposals without demanding attention.

## The interaction contract

Every interaction in the product, with what it reads and writes against the
§G.0 tiers. If an interaction is not in these tables, it does not exist. Two
protections are built in: no interaction writes a tier it is not listed for,
and drafts never leak into the URL or the shared tier before commit.

**The tiers interactions touch** (from §G.0): fixtures (never written),
derived (read-only everywhere), local drafts, runtime shared state, view
state (the URL), plus ephemeral UI state (hover, open panels, focus) that is
never persisted anywhere.

### Invariants (the architecture-savers)

| ID | Invariant |
|---|---|
| I1 | Exactly three interactions write shared state: commit, save weights, set finding status. Everything else writes drafts, view state, or ephemeral state |
| I2 | All URL writes go through the F.2 canonical serializer. No zone touches the URL directly |
| I3 | Drafts persist locally (survive reload, BL9) but never appear in the URL or the shared tier |
| I4 | The derived tier is read-only for every actor; it changes only because its inputs changed |
| I5 | Atlas is triggered only by shared-state change and writes only `Finding` records (BL6) |
| I6 | Vera's role removes write interactions, never zones. Same surface, fewer verbs |
| I7 | Motion never gates function: every animation is interruptible, and reduced-motion collapses durations to zero while keeping end states |

### History semantics (which interactions create a back-button stop)

Discrete navigation **pushes** a history entry: provenance, scope, family,
sort, open or close distribution or the site grid, the grid's sort, a
finding's "show me". Continuous input **replaces** the current entry: search
typing (debounced 250 ms), outliers toggle, unit switch. Back therefore walks
investigation moves, not keystrokes. Scroll positions and cursors are never
state: links share intent (sort, filters), never scroll offsets.

### CountryList

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Row hover | pointer over row | derived row | ephemeral hover | Row emphasis and affordances fade in, 120 ms; full-precision values in tooltip |
| Sort | click column header; Enter on focused header | derived rows | view: `sort` (push) | Rows reorder with position transitions, 200 ms; sorted column marked |
| Scroll | wheel, drag; PageUp or PageDown | derived rows | ephemeral only; never the URL | Rows flow continuously under the pinned header; a new sort or filter resets to the top |
| Select or deselect | checkbox click; Space on focused row | committed selection (for diff) | draft: pending selection | Checkbox state plus `ContextBar` pending count updates immediately (BL9) |
| Open distribution (drill) | row action click; Enter on focused row | derived `CountryDistribution` | view: `dist` (push) | `DistributionPanel` enters, 200 ms slide-fade; focus moves into panel |

### ScopeBar

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Provenance switch | segmented control | derived rows for the scope | view: `prov` (push) | Metrics crossfade 150 ms; rank column does not move (rank is scope-independent, §G.1) |
| Country scope switch | segmented control | derived rows, the selection in view (pending draft if one exists, else committed — BL9: pending is visible) | view: `scope` (push) | List filters with 200 ms transition; empty state per Flow A 3a-E |
| Evidence family switch | segmented control | derived rows | view: `family` (push) | Column block crossfades 150 ms; no row movement |
| Search | typing, debounced 250 ms | derived rows | view: `q` (replace) | Live narrowing; clear control always visible while active |
| Clear filters | empty state action | none | view: `prov`, `scope`, `q` to defaults (push) | Returns to overview in one action |

### DistributionPanel

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Outliers toggle | toggle | derived quartiles | view: `dist` (replace) | Points crossfade 150 ms, axes stable, no layout jump |
| Unit switch | segmented control | derived buckets, re-bucketed | view: `dist` (replace) | Bars morph between bucketings, 200 ms |
| Chart hover | pointer | derived series | ephemeral | Tooltip with exact values, 0 ms in, 120 ms out |
| Close | close control; Esc | none | view: `dist` absent (push) | Panel exits 200 ms; focus returns to the originating row |

### SiteExplorer

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Open grid | explicit control; Enter | first keyset page from the data layer | view: `sites` (push) | Grid enters 200 ms; header row and count visible immediately |
| Column sort | click header; Enter on focused header | fresh first page under the new sort | view: `sites` (push) | Windowed list resets to top; sorted column marked |
| Scroll | wheel, drag, keyboard | next keyset page when the window nears the end | ephemeral only; never the URL | Rows mount and recycle; no spinner unless a page is genuinely late |
| Row hover | pointer | the observation row | ephemeral | Row emphasis 120 ms; full values in tooltip |
| Close | close control; Esc | none | view: `sites` absent (push) | Grid exits 200 ms; focus returns to the trigger |

### RankingCriteria

Open state is ephemeral by design: an editing tool, not a shareable view
(§G.3 has no field for it).

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Open | explicit control | shared weights | ephemeral: dialog open | Dialog enters 200 ms; focus trapped inside |
| Edit weight | number input or drag | draft weights | draft: weights | Live total and remainder recompute per keystroke (BL3); save disabled until 100% |
| Add custom variable | action in dialog | none | draft: variable list | New row appears in place, 120 ms |
| Save weights | save action, enabled at 100% | draft weights | **shared: weights** | Dialog closes; list re-orders with 320 ms position transitions so causality is visible; failure keeps the dialog and the draft (Flow A 5c-E) |
| Cancel | cancel; Esc | none | discards draft weights | Dialog exits; committed weights untouched |

### ContextBar

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Commit ("Save Countries") | explicit action, enabled only with pending changes | draft selection, shared weights | **shared: selection, weights in force, investigation record (BL4)**; clears draft | Saving state on the control; on success pending indicator clears and derived analytics refresh; failure keeps draft (Flow A 7a-E) |
| Discard pending | explicit action beside commit | committed selection | clears draft | Checkboxes revert visibly, 150 ms |
| Copy link | copy action | current URL | clipboard | Confirmation toast, 2 s, non-blocking |

### FindingsRail (the agent interactions)

| Interaction | Trigger | Reads | Writes | Feedback and motion |
|---|---|---|---|---|
| Agent propose | Atlas run completes (I5) | full data tier | **shared: new `Finding` (proposed)** | Card enters the rail, 200 ms, list never shifts; badge increments; focus never stolen |
| Open card | click; Enter | finding claim, `derivedFrom` | ephemeral: card expanded | Card expands in place, 150 ms |
| Show me | action on card | finding `suggestedState` | view: full state (single push) | View transitions to the suggested state; highlighted rows pulse once, 600 ms, then settle (D 3a-E guarantees visibility) |
| Accept | action on card, Ana only | finding | **shared: status accepted (BL6)** | Card marked and settles; her follow-up edits are ordinary Flow A interactions |
| Reject | action on card, Ana only | finding | **shared: status rejected (BL6)** | Card marked and collapses; rejection is signal, not deletion |
| Re-run | shared-state change (commit or weight save) | full data tier, finding statuses | replaces stale `proposed` findings; `accepted` and `rejected` persist | New cards enter as above; the quiet state (no cards) is a valid outcome |

### Motion tokens and accessibility

- Durations: `fast` 120 ms (hover, small reveals), `standard` 200 ms (panels,
  reorders, cards), `settle` 320 ms (rank re-order after save), `pulse` 600 ms
  (one-time highlight). One standard ease-out curve for all.
- Purpose over polish: motion exists to show continuity (sort, re-rank) and
  causality (save, then reorder), never decoration.
- `prefers-reduced-motion`: all durations to zero, end states and highlights
  kept (I7).
- Every pointer interaction has a keyboard path (listed per table); focus
  order follows zone order; panel and dialog closes return focus to their
  trigger.

## G. Data model

Five tiers. Data flows upward only: fixtures feed the data layer, the data
layer derives, the UI and Atlas consume. Nothing writes downward into
fixtures. Derivation formulas, constraints, and generation rules live in
`data-spec.md`; this section owns the contracts.

### G.0 Tier map: every shape, where it lives, who reads and writes it

| Tier | Shapes | Stored | Written by | Read by |
|---|---|---|---|---|
| Source fixtures | `Observation`, `Prediction`, `RankingVariable` defaults, trial, countries, site names | Static seeded JSON, immutable at runtime | The generator only | The data layer only |
| Derived, never stored | `CountryMetrics`, `CountryDistribution`, `SitePage` | Computed on demand in the data layer | Nobody | UI and Atlas |
| Runtime shared state | Selection, weights in force, finding statuses | Data layer persistence (demo: localStorage) | Ana only; finding status via her accept or reject (BL2, BL6) | Ana, Vera, Atlas |
| Local drafts | Pending selection, weight edits in progress | localStorage, local to the user, never shared | Ana while editing | The editing zone and the `ContextBar` pending indicator |
| View state | `InvestigationState` | The URL, always (BL7) | The UI on every view change | UI, Vera's links, Atlas findings |

**The source grain.** One `Observation` is how one site performed in one
source historical trial. Everything country-level derives from it, so the
overview and the drill-down can never contradict. `Prediction` is generated
independently of the observations (anti-leakage rule L2 in the data spec).

```
Observation {
  id: string, siteId: string, countryCode: CountryCode3,
  sourceTrialId: string, benchmark: boolean,
  enrollmentRatePSM: number,        // achieved, patients per site per month
  targetEnrollmentRatePSM: number,  // planned for that source trial
  startupDays: number,              // integer, activation to first patient
  investigatorIds: string[]
}
Prediction {
  countryCode: CountryCode3,
  predictedEnrollmentRatePSM: number,
  predictedStartupDays: number
}
```

### G.1 The row tier: what the list and Atlas both read

One typed record per country and provenance scope, derived from observations.
The UI renders it; Atlas queries it. Never stored.

```
CountryMetrics {
  id: string, countryName: string, countryCode: CountryCode3,
  provenance: 'all' | 'benchmark' | 'non-benchmark',
  ranking: number,                       // 1 = best; derived, see algorithm below
  totalSites: number, totalInvestigators: number, multiTrialInvestigators: number,
  historicalMedianEnrollmentRate: number,   // patients per site per month
  predictedEnrollmentRate: number,          // from Prediction, never derived
  performanceRatio: number,                 // achieved over target, median
  medianStartupTime: number,                // days
  predictedStartupTime: number,             // days, from Prediction
  siteToSiteVariability: number,            // IQR over median of per-site means
  selected: boolean                         // the decision bit, runtime state
}
RankingVariable {
  id: string, name: string, title: string,
  metricKey: keyof CountryMetrics,          // the field this weight applies to
  weight: number,                           // fraction; all weights sum to 1
  isDefault: boolean, varType: 'Binary' | 'Numeric',
  contribution: 'Direct' | 'Inverse'        // Inverse: lower is better
}
```

**The rank algorithm (BL1, deterministic).** Computed over provenance `all`
and the full candidate set, so human filters never change a country's rank:
1. Per variable, min-max normalize the metric across candidates to [0, 1].
2. If contribution is Inverse, use 1 minus the normalized value.
3. Composite = sum of weight times normalized value.
4. Rank = dense rank of the composite, descending. Ties break alphabetically
   by `countryCode`.

**Writes.** Selection as `{id, selected}[]`; weights as `{id, weight}[]`. Both
go through the data layer into runtime shared state (fixtures stay immutable).
After a weight write the composite recomputes and every reader sees the new
ranking.

**One truth-source rule.** Each metric has exactly one authoritative
derivation from the grain. Nothing is fetched or stored as a second
independent source.

### G.2 Derived series: what the distribution views render

Computed in the data layer from observations: quartiles over per-site mean
enrollment, buckets over `startupDays`. The UI and Atlas never aggregate raw
records themselves.

```
CountryDistribution {
  countryCode: CountryCode3,
  quartiles: { q1, median, q3, average, min, max },   // per-site mean enrollment
  buckets: { unit: 'days' | 'weeks' | 'months', bucketSize: number,
             x: string[], y: number[] }               // startup histogram
}
```

The unit and bucket size are honored by the view: switching units re-buckets
without a redesign.

**The windowed evidence contract (keyset, never offset).** The data layer
serves the site grid in pages seekable by cursor, so deep scroll stays
flat-latency:

```
querySites({ scope, sortField, sortOrder, after?, limit }): SitePage
SitePage {
  rows: Observation[],          // sorted by (sortField, id); id is the tiebreak
  nextCursor: string | null     // encodes the last row's (sortValue, id)
}
```

Cursors are opaque, derived from data, and never appear in the URL; the
grid's shareable state is its sort (§G.3 `sites`), not its scroll position.

### G.3 InvestigationState: the shareable unit of work

Always serialized in the URL. One link restores the whole investigation for
Ana, for Vera, and for any finding Atlas emits.

```
InvestigationState {
  trialId: string,
  provenance: 'all' | 'benchmark' | 'non-benchmark',
  countriesScope: 'all' | 'selected',
  evidenceFamily: 'footprint' | 'enrollment-performance' | 'timelines',
  list: { sortField: string, sortOrder: 1 | -1, filterText: string },
  distribution: { countryCode: CountryCode3, outliers: boolean,
                  unit: 'days' | 'weeks' | 'months' } | null,
  sites: { sortField: string, sortOrder: 1 | -1 } | null,   // the evidence grid
  highlight: CountryCode3[]              // set by Atlas findings
}
```

Everything data-side is reconstructible from this state. Links carry view
intent, never data. That is what keeps them small, stable, and safe to share.

### G.4 The findings contract: how Atlas speaks

```
Finding {
  id: string,
  claim: string,                          // one sentence, plain language
  derivedFrom: [entityId: string, field: string][],  // the exact evidence
  suggestedState: InvestigationState,     // the view that shows it
  status: 'proposed' | 'accepted' | 'rejected'
}
```

Three rules. A finding without `derivedFrom` and `suggestedState` is invalid
and never renders (BL5). Findings are proposals; only humans change `selected`
or weights (BL6). Status changes are visible to Atlas, so the next run learns
from them.

## H. Scope of the first version (the interview MVP)

The first iteration is the MVP shown at the Dash0 interview. It is built as a
new consumer, `decision-surface`, inside the cucusa design-system workspace
(React 19, TypeScript strict, Vite, DTCG tokens, npm workspaces). The docs are
part of the deliverable: what is not built is presented as spec, and that is a
strength, not a gap. The consumer's operating manual is
`decision-surface/CLAUDE.md`; this spec and the data spec are copied into
`decision-surface/docs/` so the consumer is self-contained.

### H.1 Tech scope (deliberately Dash0-shaped)

| Choice | What | Why it maps to Dash0 |
|---|---|---|
| React 19 + TypeScript strict, Vite | Their stack, function components and hooks only | Direct stack match |
| URL-serialized investigation state | Native History API behind the F.2 canonical serializer, no router library | Their killer primitive: one link restores the exact view |
| DTCG design tokens as CSS custom properties | Zero hardcoded color, CI-enforced by the workspace coverage checker | Design system as infrastructure |
| Typed data layer over static fixtures | Decode-validated per the data spec; derivations per §G; serves keyset pages for the grid; no backend by design | The structured tier under the viz, the thing the agent reads |
| d3 (scale, shape, array) rendering to SVG | Quartiles and buckets computed and drawn with d3 primitives, styled by tokens | The observability-industry viz standard; owned to the element, no high-level chart wrapper |
| TanStack Query + TanStack Virtual | `useInfiniteQuery` over the data layer's keyset pages; windowed rendering of the evidence grid | Their scale pattern: flat-latency deep scroll, tens of DOM rows over thousands of records |
| Zustand for app state | Shared state, drafts, and ephemeral UI in small selector-based stores; the URL stays the canonical view state | Strong, scalable state without provider towers; the store map is 1:1 with the §G.0 tiers |
| localStorage for shared state and drafts | Behind the same data-layer interface a service would use (§G.0) | Tier boundaries real, transport swappable |
| Atlas as an in-app module | Runs the §C checks over the typed tier, emits §G.4 findings | The second reader, same substrate, no external service |

### H.2 MVP scope for the interview

**Must (demoable):**
1. Ranked `CountryList` from fixtures, derived tier live (§G.1 rank algorithm).
2. `ScopeBar` provenance and evidence family, with full URL round-trip: copy
   the link, open a new tab, the exact view restores (BL7). The demo's proof
   moment.
3. `RankingCriteria`: edit weights with the 100% rule, save, recompute, and
   the 320 ms re-rank reorder (BL1, BL3).
4. Atlas minimal: two checks (rank carried by one weight; top reorders under
   benchmark-only) emitting finding cards whose "show me" restores state with
   highlights (BL5, BL7).
5. `SiteExplorer`: the virtualized evidence grid over thousands of
   observations, keyset-paginated by the data layer, sort in the URL (BL10).

**Stretch (build if time remains, otherwise spec-only):**
6. `DistributionPanel` with d3 quartiles and outliers toggle.
7. Pending selection and commit to shared state (BL2, BL9).

**Presented as spec, not built:** Vera's read-only role (her primitive, the
restorable link, is demoed anyway), the accept/reject learning loop, the full
edge-state matrix, the site-level drill.

**The 90-second demo script:** open the plain URL (ranked answer first), flip
provenance (metrics change, rank column holds still), open weights and shift
one (list re-ranks, causality visible), open the site evidence grid and
scroll through thousands of windowed records, an Atlas card appears, "show me"
restores its view with highlights, copy the URL, paste in a fresh tab:
identical investigation. Close on the spec: "everything else is designed, here
is the contract."

| Persona | In the MVP demo | Presented as spec |
|---|---|---|
| Ana | Rank, re-scope, steer, URL share | Commit and pending (if stretch missed) |
| Vera | Her core primitive: any link restores the exact view | The read-only role and verdict path |
| Atlas | Two real checks, evidence-carrying cards, "show me" | Accept/reject learning, re-run replacement |

### H.3 Performance budgets (set now, enforced in the build)

| Budget | Limit | Enforced by |
|---|---|---|
| Initial JS | 180 KB gzip (React, d3 modules, TanStack Query and Virtual, Zustand, app) | Vite build output check, fails the build |
| Fixtures | 2 MB raw, about 250 KB gzip transfer, fetched after first paint | Data spec C10 + async load |
| Evidence grid | 60 fps scroll; at most 40 mounted rows; keyset page serve under 30 ms | TanStack Virtual config + dev perf assertion |
| Rank recompute to reordered paint | 50 ms at 60 countries | Dev-mode perf assertion around the derive call |
| Any interaction to visual response | 100 ms; no long task over 50 ms | Manual profile before the demo |
| Deployed page (static hosting) | Lighthouse performance 90+ | One audit run pre-interview |
| Render model | Motion via CSS transitions on the contract's tokens, no rAF loops or animation libraries; virtualized scroll re-renders windowed rows only, nothing outside the grid | Code review + the evidence-grid budget above |

### H.4 Scope rules

- Every element of the build names the persona it serves; if it serves none of
  the three, it is out of scope.
- Country-level decisions only. Site evidence is explorable (read-only,
  windowed) in v1; site-level selection is the same pattern one level down,
  later.
- Non-goals, stated in the interview if asked: a real backend (the data layer
  boundary, including the keyset contract, is exactly where one would plug
  in), and site-level writes.

**Provenance note (for the interview, not for execution).** The human loop
(ranked list, filters, weight steering, explicit commit, aggregation below the
view) re-implements patterns proven in a production system I led the frontend
for. The investigation state in the URL, the agent tier, and the findings
contract are new design for this case study.
