// The case-study landing surface, structured as a decision-under-uncertainty
// narrative (~700 words): skim hero, ambiguous start, tensions, alternatives,
// ONE decision braided through product / design / engineering, outcome,
// reflection. Built in decision-surface's own line-based system so the page is
// itself proof of the craft it describes. Additive: rendered only at
// /case-study; shares nothing with the live app.

import { useEffect, useRef } from 'react'
import { trialHref } from '../state/url'
import { useTheme } from '../useTheme'
import pkg from '../../package.json'

const DEMO_HREF = trialHref('trial-001')

// The stack, as the real manifest: imported from this consumer's actual
// package.json at build time, so every version shown is true by construction.
// Runtime dependencies only — the judgment surface, short enough to read
// whole. The full file lives one click away in the repo.
const STACK_JSON = JSON.stringify(
  { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies },
  null,
  2,
)

// The manifest disclosure: a native details with popover manners — click
// outside or Escape closes it, since the open panel overlays hero content.
function StackDisclosure() {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current
      if (el?.open && e.target instanceof Node && !el.contains(e.target)) el.open = false
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ref.current?.open) ref.current.open = false
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
  return (
    <details ref={ref} className="cs-stack">
      <summary aria-label="Tech stack, shown as this project’s real package.json">
        package.json
      </summary>
      <pre className="cs-stack-code">
        <code>{STACK_JSON}</code>
      </pre>
    </details>
  )
}

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

// The decision, made visible. Not an invented example: this is the exact
// link Atlas attaches to its benchmark finding in the live demo (pinned by
// test to the product, so the hero can never drift from what "Show me"
// actually writes). It is a real anchor: the artifact proves itself on
// click, while the CTA below keeps the neutral answer-first entry.
const CHIP_QUERY = '?prov=benchmark&hl=AUT,ESP,MEX,TUR'

function UrlChip() {
  return (
    <a
      className="cs-urlchip"
      href={DEMO_HREF + CHIP_QUERY}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open the link Atlas attaches to its benchmark finding in a new tab"
    >
      <code>
        …/trial/trial-001<span className="cs-urlchip-q">{CHIP_QUERY}</span>
      </code>
    </a>
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
    body: 'The price is discipline across three homes for state: the URL, a shared store, and local drafts, each with its own writer and its own rules. The URL’s writer is canonical: fixed parameter order, defaults omitted, the same investigation always the same link, byte for byte. The one bug that escaped came from blurring that boundary: a save rewrote fields it hadn’t changed, React saw them as new, and a data effect re-ran in a loop until the app went down. It’s fixed with a regression test on the boundary itself; rules that subtle deserve tests, not conventions. The payoff is freedom at the heavy end: because scroll and cursors never enter the URL, the evidence grid windows 5,121 records down to 40 rendered rows, and the link never notices.',
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
          <StackDisclosure />
          <dl className="cs-skim">
            <div>
              <dt>Challenge</dt>
              <dd>
                Country selection for a clinical trial runs on evidence scattered across registries,
                internal history, and benchmark databases, and dense once unified: <br />
                5,121 site records behind one screen, one pick, defended under review.
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
                finding.
              </dd>
            </div>
          </dl>
        </section>

        {/* The statement: thesis as an editorial pull-quote, both entrances beneath */}
        <section className="cs-statement">
          <p className="cs-thesis">
            Humans read the view. <br />
            Agents read the typed evidence underneath. <br />
            One serialized investigation serves both.
          </p>
          <div className="cs-actions">
            <a className="cs-cta" href={DEMO_HREF} target="_blank" rel="noopener noreferrer">
              Open the live investigation →
            </a>
            <UrlChip />
          </div>
        </section>

        <section className="cs-section">
          <p className="cs-section-num">01 · The starting point</p>
          <h2 className="cs-h2">Three readers, no obvious home for the truth</h2>
          <p className="cs-body">
            Choosing the countries for a clinical trial means reading site-level evidence:
            enrollment rates, startup times, site-to-site spread. <br />
            That evidence lives scattered across public registries, internal trial history, and
            licensed benchmark databases, so the work has long run on exports and spreadsheets.{' '}
            <br />
            The stakes are unforgiving: one in ten selected sites never enrolls a single patient, a
            wrong pick costs months, and in trials months mean patients waiting.
          </p>
          <p className="cs-body">
            Pulling the sources into one ranked view is the obvious fix, and it trades the old
            problem for two new ones: density and trust. <br />
            Thousands of records now sit behind a single screen that has to stay readable, and the
            moment numbers from many systems share a table, every reader asks what each number
            weighs and where it came from. <br />
            The readers span an organization. Ana, on the global feasibility team, builds the
            country proposal. Vera, the trial manager for her country, reviews and revises it weeks
            later, accountable for a call she didn’t watch happen. Atlas, an in-app agent on Ana’s
            team, reads the same evidence to catch what a tired human misses. Three readers, one
            open question:
          </p>
          <p className="cs-body">
            where does an investigation live so all of them can hold the same one, weeks apart?
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
              <strong>76</strong> tests
            </li>
            <li>
              <strong>99.4 KB</strong> initial JS vs a 180 KB build-enforced budget (this page
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
            The view for humans, the typed evidence for agents. One state, and the link is the
            proof.
          </p>
          <div className="cs-actions">
            <a className="cs-cta" href={DEMO_HREF} target="_blank" rel="noopener noreferrer">
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
