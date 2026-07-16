// The case-study landing surface — a portfolio narrative that frames the live
// app, and the spine of a ≤15-minute interview walk. Built in decision-surface's
// own line-based design system (tokens only, the --ds-* motion vocabulary), so
// the case study is itself proof of the craft it describes. Additive: rendered
// only at /case-study (App entry branch); shares nothing with the live app.

import { trialHref } from '../state/url'
import { useTheme } from '../useTheme'

const DEMO_HREF = trialHref('trial-001')

function ThemeToggle() {
  const { mode, toggle } = useTheme()
  return (
    <button
      type="button"
      className="cs-theme"
      onClick={toggle}
      aria-pressed={mode === 'light'}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      Theme: {mode === 'light' ? 'Light' : 'Dark'}
    </button>
  )
}

// A small monospace representation of a serialized investigation URL — the
// killer primitive made visible.
function UrlChip() {
  return (
    <code className="cs-urlchip" aria-label="An investigation serialized in the URL">
      …/trial/trial-001<span className="cs-urlchip-q">?prov=benchmark&amp;hl=ESP,POL</span>
    </code>
  )
}

const READERS = [
  {
    name: 'Ana',
    role: 'decides',
    body: 'The feasibility analyst. The only writer of shared state; she steers the ranking and commits the shortlist.',
  },
  {
    name: 'Vera',
    role: 'verifies',
    body: 'The reviewer, accountable for a decision she didn’t watch being made. One link restores Ana’s exact view: same data, filters, sort. Full surface, zero write paths.',
  },
  {
    name: 'Atlas',
    role: 'proposes',
    body: 'The agent. Reads the data under the charts, not the charts. One output: a finding that carries its evidence and a restorable view. Proposes; never commits.',
  },
]

const DEMO_STEPS = [
  'Open the plain URL. The ranked answer is the first thing on screen.',
  'Switch the trial source to Benchmark. The metrics change, and the rank column holds still: rank is scope-independent by design.',
  'Open Ranking criteria and shift one weight. The list re-ranks in front of you, with a 320 ms settle so the cause is visible.',
  'Open Site evidence and scroll: thousands of records, never more than ~40 rows in the DOM.',
  'An Atlas card appears. “Show me” restores the exact view its claim is about, countries highlighted.',
  'Copy the URL and paste it in a fresh tab. The identical investigation reopens.',
]

const DECISIONS = [
  {
    title: 'State lives in the URL',
    fork: 'A client store as the source of truth, or the URL.',
    choice:
      'The URL. Link equality is state equality, so any view can be reopened by anyone: Ana, Vera, or an agent’s finding.',
    tradeoff:
      'Serialization discipline: one canonical serializer is the only writer of the URL, and scroll positions are never state.',
  },
  {
    title: 'Keyset pagination + windowing',
    fork: 'Offset pagination, or cursor-based keyset over a windowed grid.',
    choice:
      'Keyset. Flat-latency deep scroll over thousands → billions of rows, ≤40 mounted in the DOM, and the exact seam where a real backend plugs in.',
    tradeoff:
      'The demo runs it client-side over fixtures, but the contract is production-shaped: swapping in a service changes one layer, not the app.',
  },
]

const BUDGETS = [
  {
    label: 'Initial JS',
    value: '98.6 KB',
    limit: '180 KB budget, build-enforced (this page included)',
  },
  { label: 'Evidence grid', value: '≤40 rows', limit: 'mounted over thousands of records' },
  { label: 'Keyset page', value: '<30 ms', limit: 'flat-latency at any scroll depth' },
  { label: 'Rank recompute', value: '<50 ms', limit: 'steer → reordered paint' },
]

export function CaseStudy() {
  return (
    <div className="cs">
      <header className="cs-header">
        <span className="cs-brand">Country Data Overview</span>
        <ThemeToggle />
      </header>

      <main className="cs-main">
        {/* 1 — Hero / thesis */}
        <section className="cs-hero">
          <p className="cs-eyebrow">Case study · Frontend product engineering</p>
          <h1 className="cs-title">Country Data Overview</h1>
          <p className="cs-thesis">
            Charts are for humans. Agents read the structured data underneath. One serializable
            state serves both.
          </p>
          <p className="cs-def">
            A decision surface that turns thousands of scattered performance records into a ranked,
            steerable shortlist, where every investigation is a shareable link and a human and an
            agent work from the same state.
          </p>
          <UrlChip />
          <div className="cs-chips" aria-label="Role and stack">
            <span className="chip chip-role">Solo: product · design · engineering</span>
            <span className="chip">React 19</span>
            <span className="chip">TypeScript strict</span>
            <span className="chip">d3</span>
            <span className="chip">TanStack Query · Virtual</span>
            <span className="chip">Zustand</span>
            <span className="chip">DTCG tokens</span>
            <span className="chip">frontend-only, by design</span>
          </div>
          <div className="cs-actions">
            <a className="cs-cta" href={DEMO_HREF}>
              Open the live investigation →
            </a>
            <a className="cs-cta-quiet" href="#demo">
              or skip to the demo ↓
            </a>
          </div>
        </section>

        {/* 2 — The problem / Dash0 bridge */}
        <section className="cs-section">
          <p className="cs-section-num">01 · The problem</p>
          <h2 className="cs-h2">Overwhelming data, one defensible decision</h2>
          <p className="cs-lead">
            Choosing which countries a clinical trial runs in means reading thousands of site-level
            records across dozens of countries: enrollment rates, startup times, site-to-site
            variability. Raw, no human can eyeball it. A wrong pick costs months; every call must
            survive a reviewer.
          </p>
          <div className="cs-bridge">
            <p className="cs-bridge-title">Different domain, the same hard problems.</p>
            <ul className="cs-maplist">
              <li>Data-dense exploration at scale</li>
              <li>Performance over massive datasets</li>
              <li>Restorable investigation state</li>
              <li>An agent reading the signals under the charts</li>
            </ul>
            <p className="cs-body">
              The trial analyst and the on-call engineer at 2&nbsp;a.m. are the same user: someone
              who has to turn too much data into a decision they can defend. The techniques here
              (windowed rendering, keyset paging, investigation-in-a-URL) are the ones a real-time
              observability surface lives or dies on.
            </p>
          </div>
        </section>

        {/* 3 — Three readers */}
        <section className="cs-section">
          <p className="cs-section-num">02 · Who it’s for</p>
          <h2 className="cs-h2">One surface, three readers</h2>
          <div className="cs-readers">
            {READERS.map((r) => (
              <article key={r.name} className="reader">
                <h3 className="reader-name">
                  {r.name} <span className="reader-role">{r.role}</span>
                </h3>
                <p className="cs-body">{r.body}</p>
              </article>
            ))}
          </div>
          <p className="cs-note">
            The assumption I challenged: a UI serves one user. This one serves a human <em>and</em>{' '}
            an agent, each in its own encoding. Force either into the other’s, and you fail both.
          </p>
        </section>

        {/* 4 — Live demo */}
        <section className="cs-section" id="demo">
          <p className="cs-section-num">03 · See it work</p>
          <h2 className="cs-h2">Ninety seconds, live</h2>
          <ol className="cs-checklist">
            {DEMO_STEPS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="cs-actions">
            <a className="cs-cta" href={DEMO_HREF}>
              Open the live investigation →
            </a>
          </div>
          <p className="cs-note">
            This is the live product, not a recording. Best explored with your own hands.
          </p>
        </section>

        {/* 5 — Architecture */}
        <section className="cs-section">
          <p className="cs-section-num">04 · Architecture</p>
          <h2 className="cs-h2">Structural decisions, not just features</h2>
          <div className="cs-tiers" aria-label="The tiered data model">
            <span className="tier">Seeded fixtures</span>
            <span className="tier-arrow">→</span>
            <span className="tier">Derived tier (compute on read)</span>
            <span className="tier-arrow">→</span>
            <span className="tier">View state (the URL) · shared &amp; draft state</span>
          </div>
          <p className="cs-body">
            Data flows one way. The derived tier is computed on read, never stored, so the overview
            and the drill-down can’t contradict: one truth-source, aggregation below the view. Then
            two decisions carry the weight:
          </p>
          <div className="cs-decisions">
            {DECISIONS.map((d) => (
              <article key={d.title} className="decision">
                <h3 className="decision-title">{d.title}</h3>
                <p className="decision-line">
                  <span className="decision-tag">Fork</span> {d.fork}
                </p>
                <p className="decision-line">
                  <span className="decision-tag decision-tag-choice">Chose</span> {d.choice}
                </p>
                <p className="decision-line">
                  <span className="decision-tag">Trade-off</span> {d.tradeoff}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* 6 — Rigor / receipts */}
        <section className="cs-section">
          <p className="cs-section-num">05 · Done well, provably</p>
          <h2 className="cs-h2">Budgets that fail the build</h2>
          <table className="cs-budgets">
            <tbody>
              {BUDGETS.map((b) => (
                <tr key={b.label}>
                  <th scope="row">{b.label}</th>
                  <td className="cs-budget-value">{b.value}</td>
                  <td className="cs-budget-limit">{b.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="cs-receipts">
            <li>
              <strong>70</strong> tests · 10 files
            </li>
            <li>
              <strong>54</strong> contrast checks · dark + light
            </li>
            <li>
              <strong>0</strong> hardcoded colors · CI-enforced
            </li>
            <li>
              seeded data · <strong>13/13</strong> validation with anti-leakage
            </li>
          </ul>
          <p className="cs-body">
            The interaction contract is written down and cited by ID in the code and the commit
            history: ten business rules a reviewer enforces, and seven invariants that keep the URL
            canonical and the agent honest.
          </p>
        </section>

        {/* 7 — AI thread + next + close */}
        <section className="cs-section">
          <p className="cs-section-num">06 · The reader under the charts</p>
          <h2 className="cs-h2">What an agent needs to be trusted</h2>
          <figure className="cs-finding">
            <p className="cs-finding-claim">
              Poland ranks #2 mostly on one variable: median startup time. Take that weight away and
              it falls to #10.
            </p>
            <p className="cs-finding-schema">
              <code>
                Finding {'{'} claim · derivedFrom · suggestedState · status {'}'}
              </code>
            </p>
          </figure>
          <p className="cs-body">
            Atlas reads the typed rows, not the pixels. Every finding carries its evidence{' '}
            <em>and</em> a restorable view; no claim renders without both. That’s the shape of
            AI-assisted debugging: at 2&nbsp;a.m. you don’t want an answer, you want the answer and
            the exact view that proves it.
          </p>

          <h3 className="cs-h3">What I’d build next</h3>
          <ul className="cs-next">
            <li>
              A real backend behind the keyset contract; the socket is already the right shape.
            </li>
            <li>Derivation off the main thread as the dataset grows past this scale.</li>
            <li>Multi-user shared state, so Ana and Vera can be live on one investigation.</li>
          </ul>

          <p className="cs-provenance">
            The human loop re-implements patterns proven in a production system whose frontend I
            led. The investigation-in-a-URL, the agent tier, and the findings contract are new
            design for this case study.
          </p>
          <p className="cs-close">
            Charts for humans, structured data for agents. One state, and the link is the proof.
          </p>
          <div className="cs-actions">
            <a className="cs-cta" href={DEMO_HREF}>
              Open the live investigation →
            </a>
          </div>
        </section>
      </main>

      <footer className="cs-footer">
        <span>Country Data Overview, a frontend product engineering case study.</span>
        <a
          href="https://www.linkedin.com/in/iamcucusa"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-credit-link"
        >
          Designed in code by <span className="cs-credit-handle">@iamcucusa</span>
        </a>
      </footer>
    </div>
  )
}
