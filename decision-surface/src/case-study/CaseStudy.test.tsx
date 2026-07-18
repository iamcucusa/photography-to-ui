// @vitest-environment jsdom
//
// Guards the additive case-study surface: it mounts, its launch CTAs resolve
// to the live trial (the entry-branch contract), and the decision-under-
// uncertainty arc renders: skim, ambiguity, alternatives, decision, outcome,
// reflection.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CaseStudy } from './CaseStudy'

afterEach(cleanup)

describe('CaseStudy landing surface', () => {
  it('leads with the 30-second skim: challenge, decision, impact', () => {
    render(<CaseStudy />)
    expect(screen.getByRole('heading', { level: 1, name: /country data overview/i })).toBeTruthy()
    for (const label of ['Challenge', 'Decision', 'Impact']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('renders the decision-under-uncertainty arc', () => {
    render(<CaseStudy />)
    expect(screen.getByText(/three readers, no obvious home for the truth/i)).toBeTruthy()
    expect(screen.getByText(/the alternatives i weighed/i)).toBeTruthy()
    expect(screen.getByText(/the investigation lives in the url/i)).toBeTruthy()
    expect(screen.getByText(/what that made true/i)).toBeTruthy()
    expect(screen.getByText(/what i’d do differently/i)).toBeTruthy()
    // the braid: all three lenses on the one decision
    for (const lens of ['Product', 'Design', 'Engineering']) {
      expect(screen.getByText(lens)).toBeTruthy()
    }
  })

  it('every launch CTA opens the live trial (entry-branch contract)', () => {
    render(<CaseStudy />)
    const ctas = screen.getAllByRole('link', { name: /open the live investigation/i })
    expect(ctas.length).toBeGreaterThan(0)
    for (const cta of ctas) {
      expect(cta.getAttribute('href')).toBe('/trial/trial-001')
    }
  })

  it('exposes a working theme toggle', () => {
    render(<CaseStudy />)
    expect(screen.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeTruthy()
  })
})
