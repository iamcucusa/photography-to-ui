// F.1 `ContextBar` — entry and commit. Trial name, commit state (pending or
// saved, BL9), the share link. Owns trialId (§G.3). "Where am I" and "send
// this to someone" are the same answer: the URL is always current (F.5).

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../useTheme'

interface ContextBarProps {
  trialName: string
  pendingCount: number
  savedCount: number
  onCommit?: () => void
  onDiscard?: () => void
}

export function ContextBar({
  trialName,
  pendingCount,
  savedCount,
  onCommit,
  onDiscard,
}: ContextBarProps) {
  const { mode, toggle } = useTheme()
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — the URL bar still carries the same link
    }
  }

  const hasPending = pendingCount > 0

  return (
    <header className="context-bar">
      <div className="context-trial">
        <h1>{trialName}</h1>
        <span className={`commit-state${hasPending ? ' is-pending' : ''}`}>
          {hasPending
            ? `Pending — ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} unsaved`
            : savedCount > 0
              ? `Saved — ${savedCount} ${savedCount === 1 ? 'country' : 'countries'} committed`
              : 'No selection committed yet'}
        </span>
      </div>
      <div className="context-actions">
        {hasPending && onDiscard && (
          <button type="button" className="btn btn-quiet" onClick={onDiscard}>
            Discard
          </button>
        )}
        {onCommit && (
          <button
            type="button"
            className="btn btn-accent"
            onClick={onCommit}
            disabled={!hasPending}
          >
            Save Countries
          </button>
        )}
        <button type="button" className="btn" onClick={copyLink}>
          Copy link
        </button>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={toggle}
          aria-pressed={mode === 'light'}
          aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        >
          mode: {mode}
        </button>
      </div>
      <div className="toast-region" role="status" aria-live="polite">
        {copied && <span className="toast">Link copied</span>}
      </div>
    </header>
  )
}
