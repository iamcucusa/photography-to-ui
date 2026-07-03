import type { ReactNode } from 'react'

// Full-bleed section band: sections are separated by full-width hairline
// rules and negative space (dividers-not-boxes); content re-insets to the
// reading column. The numbered title doubles as a typographic divider.
// `bleed` lets a section's content run edge-to-edge (palette bands,
// gradients, glows) while title + description stay in the reading column.
// Shared by the Tokens catalog and the Audit dashboard.
export function SectionBand({
  id,
  num,
  title,
  description,
  bleed = false,
  children,
}: {
  id: string
  num: string
  title: string
  description: string
  bleed?: boolean
  children: ReactNode
}) {
  return (
    <section className="token-section" id={id}>
      <div className="docs-inset">
        <h2 className="token-section-title">
          <span className="token-section-number" aria-hidden="true">
            {num}
          </span>
          {title}
        </h2>
        <p className="token-section-description">{description}</p>
        {!bleed && children}
      </div>
      {bleed && children}
    </section>
  )
}
