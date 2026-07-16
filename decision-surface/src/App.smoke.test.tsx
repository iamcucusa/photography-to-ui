// @vitest-environment jsdom
//
// End-to-end smoke test of the 90-second demo path (§H.2). This guards the
// orchestration layer — App wiring, effects, store/URL interplay — where both
// production regressions this project hit actually lived (the stale-fixtures
// crash and the shared-store identity loop). It does not assert pixels; it
// asserts the flow mounts and each demo beat drives state without throwing.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

// jsdom lacks these; TanStack Virtual and the scroll-reset effects call them.
beforeEach(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
  window.scrollTo = () => {}
  // jsdom doesn't implement <dialog> modal methods; reflect `open` so the
  // dialog is exposed with its accessible role.
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false
  }
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

afterEach(cleanup)

async function loadedApp() {
  const user = userEvent.setup()
  render(<App />)
  // Answer-first: the ranked list renders and the entry URL is canonical.
  await screen.findByText(/of 36 countries/i, undefined, { timeout: 8000 })
  expect(window.location.pathname).toBe('/trial/trial-001')
  return user
}

describe('demo path smoke test (§H.2)', () => {
  it('loads the ranked answer, re-scopes, and opens the site evidence grid', async () => {
    const user = await loadedApp()
    expect(screen.getByText('#1')).toBeTruthy()

    // Re-scope: flipping provenance lands in the URL (BL7) without a crash.
    await user.click(screen.getByRole('button', { name: 'Benchmark' }))
    await waitFor(() => expect(window.location.search).toContain('prov=benchmark'))
    // The list is still there (metrics changed, the surface held).
    expect(screen.getByText(/of 36 countries/i)).toBeTruthy()

    // Explain at site level: the windowed grid opens and reports its scope.
    await user.click(screen.getByRole('button', { name: /site evidence/i }))
    await screen.findByText(/observations in scope/i)
    expect(window.location.search).toContain('sites=')
  })

  it('steers weights under the 100% rule (BL3)', async () => {
    const user = await loadedApp()
    await user.click(screen.getByRole('button', { name: /ranking criteria/i }))
    const dialog = await screen.findByRole('dialog', { name: /ranking criteria/i })
    const save = within(dialog).getByRole('button', { name: /save weights/i })

    // Defaults total 100% → save enabled.
    expect(save.hasAttribute('disabled')).toBe(false)

    // Break the total → save disabled and the remainder is shown (BL3).
    await user.clear(within(dialog).getAllByRole('spinbutton')[0])
    await waitFor(() => expect(save.hasAttribute('disabled')).toBe(true))
    expect(within(dialog).getByText(/remaining/i)).toBeTruthy()
  })

  it('surfaces an Atlas finding whose "show me" restores its exact view (BL5, BL7)', async () => {
    const user = await loadedApp()
    // Atlas runs on hydration; the provenance-flip finding is deterministic.
    const claim = await screen.findByText(/top 5 changes under benchmark-only/i)
    await user.click(claim)
    await user.click(await screen.findByRole('button', { name: /show me/i }))
    // The finding's suggestedState lands whole: provenance + highlighted codes.
    await waitFor(() => {
      expect(window.location.search).toContain('prov=benchmark')
      expect(window.location.search).toContain('hl=')
    })
  })
})
