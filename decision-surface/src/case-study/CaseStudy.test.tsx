// @vitest-environment jsdom
//
// Guards the additive case-study surface: it mounts, its launch CTAs resolve to
// the live trial (the entry-branch contract), and the load-bearing beats render.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CaseStudy } from './CaseStudy'

afterEach(cleanup)

describe('CaseStudy landing surface', () => {
  it('renders the thesis and the section beats', () => {
    render(<CaseStudy />)
    expect(screen.getByRole('heading', { level: 1, name: /country data overview/i })).toBeTruthy()
    // one representative beat from each half of the arc
    expect(screen.getByText(/one surface, three readers/i)).toBeTruthy()
    expect(screen.getByText(/budgets that fail the build/i)).toBeTruthy()
    expect(screen.getByText(/what an agent needs to be trusted/i)).toBeTruthy()
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
