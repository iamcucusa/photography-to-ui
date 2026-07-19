// The case-study landing surface, structured as a decision-under-uncertainty
// narrative (~700 words): skim hero, ambiguous start, tensions, alternatives,
// ONE decision braided through product / design / engineering, outcome,
// reflection. Built in decision-surface's own line-based system so the page is
// itself proof of the craft it describes. Additive: rendered only at
// /case-study; shares nothing with the live app.

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

// The decision, made visible: a serialized investigation.
function UrlChip() {
  return (
    <code className="cs-urlchip" aria-label="An investigation serialized in the URL">
      …/trial/trial-001<span className="cs-urlchip-q">?prov=benchmark&amp;hl=ESP,POL</span>
    </code>
  )
}

const TENSIONS = [
  'Ana needs speed; Vera needs the exact view back; Atlas needs typed rows, not pixels.',
  'Expert density on one screen, yet a first-time reviewer must be able to read it.',
  'One table unifies many sources for speed, yet every number must answer for where it came from.',
  'Deep scroll over thousands of records, yet motion that shows cause, not decoration.',
]

const ALTERNATIVES = [
  {
    name: 'A client store as the truth, with a Share button that serializes on demand.',
    rejected:
      'A view you must remember to share is a view that gets lost. Vera can’t paste her way back at review time.',
  },
  {
    name: 'A router library with route params.',
    rejected:
      'One workspace, no page tree. A dependency to solve what one small serializer solves exactly.',
  },
  {
    name: 'Hash-fragment state.',
    rejected: 'Links stop reading as places, and the address bar stops telling the truth.',
  },
]

const LENSES = [
  {
    lens: 'Product',
    body: 'The link is the unit of trust. Ana hands Vera the exact view that produced the proposal. That proposal comes from a team, and one member of the team is an agent; the standard doesn’t change. Atlas attaches a restorable view to every finding, and a claim without one never renders.',
  },
  {
    lens: 'Design',
    body: 'The URL disciplines the interface. Rank holds still while filters change, so filtering never quietly reorders the answer. Drafts stay visibly pending and never leak into the link. Scroll is never state: links share intent, not offsets, and Back walks investigation moves, not keystrokes. I rejected the maximal version; a link that replays your scroll position is noise wearing a permalink.',
  },
  {
    lens: 'Engineering',
    body: 'The price is discipline across three homes for state: the URL, a shared store, and local drafts, each with its own writer and its own rules. The one bug that escaped came from blurring that boundary: a save rewrote fields it hadn’t changed, React saw them as new, and a data effect re-ran in a loop until the app went down. It’s fixed with a regression test on the boundary itself; rules that subtle deserve tests, not conventions. The payoff is freedom at the heavy end: because scroll and cursors never enter the URL, the evidence grid windows 5,121 records down to 40 rendered rows, and the link never notices.',
  },
]

const PROOFS = [
  'Open the app. The ranked answer is the first thing on screen.',
  'Filter, flip the trial source, open Site evidence. The URL keeps up.',
  'Press “Show me” on an Atlas finding. The exact view returns, highlighted.',
  'Copy the URL into a fresh tab. The identical investigation reopens.',
]

export function CaseStudy() {
  return (
    <div className="cs">
      <header className="cs-header">
        <span className="cs-brand">Country Data Overview</span>
        <ThemeToggle />
      </header>

      <main className="cs-main">
        {/* Hero: the 30-second skim */}
        <section className="cs-hero">
          <p className="cs-eyebrow">Case study · Frontend product engineering</p>
          <h1 className="cs-title">Country Data Overview</h1>
          <dl className="cs-skim">
            <div>
              <dt>Challenge</dt>
              <dd>
                Country selection for a clinical trial runs on evidence scattered across registries,
                internal history, and benchmark databases, and dense once unified: 5,121 site
                records behind one screen, one pick, defended under review.
              </dd>
            </div>
            <div>
              <dt>Decision</dt>
              <dd>
                The whole investigation lives in the URL: every filter, sort, and open view written
                into the address. Link equality is state equality.
              </dd>
            </div>
            <div>
              <dt>Impact</dt>
              <dd>
                Any view is restorable in one click by an analyst, a reviewer, or an agent’s
                finding. Live below.
              </dd>
            </div>
          </dl>
          <p className="cs-thesis">
            Charts are for humans. Agents read the structured data underneath. One serializable
            state serves both.
          </p>
          <UrlChip />
          <div className="cs-chips" aria-label="Stack">
            <span className="chip">React 19</span>
            <span className="chip">TypeScript strict</span>
            <span className="chip">d3</span>
            <span className="chip">TanStack Query · Virtual</span>
            <span className="chip">Zustand</span>
            <span className="chip">DTCG tokens</span>
          </div>
          <div className="cs-actions">
            <a className="cs-cta" href={DEMO_HREF}>
              Open the live investigation →
            </a>
          </div>
        </section>

        <section className="cs-section">
          <p className="cs-section-num">01 · The starting point</p>
          <h2 className="cs-h2">Three readers, no obvious home for the truth</h2>
          <p className="cs-body">
            Choosing the countries for a clinical trial means reading site-level evidence:
            enrollment rates, startup times, site-to-site spread. That evidence lives scattered
            across public registries, internal trial history, and licensed benchmark databases, so
            the work has long run on exports and spreadsheets. The stakes are unforgiving: one in
            ten selected sites never enrolls a single patient, a wrong pick costs months, and in
            trials months mean patients waiting.
          </p>
          <p className="cs-body">
            Pulling the sources into one ranked view is the obvious fix, and it trades the old
            problem for two new ones: density and trust. Thousands of records now sit behind a
            single screen that has to stay readable, and the moment numbers from many systems share
            a table, every reader asks what each number weighs and where it came from. And the
            readers span an organization. Ana, on the global feasibility team, builds the country
            proposal. Vera, the trial manager for her country, reviews and revises it weeks later,
            accountable for a call she didn’t watch happen. Atlas, an in-app agent on Ana’s team,
            reads the same evidence to catch what a tired human misses.
          </p>
          <p className="cs-body">
            Three readers, one open question: where does an investigation live so all of them can
            hold the same one, weeks apart?
          </p>
        </section>

        <section className="cs-section">
          <p className="cs-section-num">02 · Forces in tension</p>
          <h2 className="cs-h2">What pulled against what</h2>
          <ul className="cs-maplist">
            {TENSIONS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="cs-section">
          <p className="cs-section-num">03 · Alternatives</p>
          <h2 className="cs-h2">The alternatives I weighed</h2>
          <ul className="cs-alts">
            {ALTERNATIVES.map((alt) => (
              <li key={alt.name}>
                <p className="alt-name">{alt.name}</p>
                <p className="alt-rejected">{alt.rejected}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="cs-section" id="decision">
          <p className="cs-section-num">04 · The decision</p>
          <h2 className="cs-h2">The investigation lives in the URL</h2>
          <p className="cs-lead">
            One module is its only writer: parameters in a fixed order, defaults omitted, so the
            same investigation always writes the same link, byte for byte. Link equality is state
            equality.
          </p>
          <div className="cs-lenses">
            {LENSES.map((l) => (
              <div key={l.lens} className="lens">
                <p className="lens-label">{l.lens}</p>
                <p className="cs-body">{l.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cs-section">
          <p className="cs-section-num">05 · Outcome</p>
          <h2 className="cs-h2">What that made true</h2>
          <p className="cs-body">
            Every claim below is checkable in the live app in under a minute.
          </p>
          <ol className="cs-checklist">
            {PROOFS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <ul className="cs-receipts" aria-label="Evidence">
            <li>
              <strong>74</strong> tests
            </li>
            <li>
              <strong>98.3 KB</strong> initial JS vs a 180 KB build-enforced budget (this page
              included)
            </li>
            <li>
              <strong>56</strong> contrast checks, both themes
            </li>
            <li>
              seeded fixtures, <strong>13 of 13</strong> integrity checks
            </li>
          </ul>
          <p className="cs-body">
            Two second-order effects: the keyset contract is the seam where a real backend plugs in
            without touching the app, and the interaction contract is cited by ID in code and
            commits, so review has a shared vocabulary.
          </p>
        </section>

        <section className="cs-section">
          <p className="cs-section-num">06 · Reflection</p>
          <h2 className="cs-h2">What I’d do differently</h2>
          <p className="cs-body">
            Next time the boundary tests come first, not after the bug. The hardest craft call was
            restraint: not virtualizing the one list whose animation carries the thesis. And an
            agent earns trust the way a colleague does, by showing its evidence and letting you
            check. Next: a real backend behind the keyset seam, derivation off the main thread,
            multi-user investigations.
          </p>
          <p className="cs-provenance">
            The human loop re-implements patterns proven in production: a clinical-trial site
            selection tool whose frontend I led, in a program that counted its wins in days cut from
            development timelines. In usability testing there, users kept asking two questions: how
            is this rank calculated, and where does this number come from. The transparency this
            rebuild treats as architecture began as answers people actually asked for. The
            investigation-in-a-URL, the agent tier, and the findings contract are new design for
            this case study.
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
