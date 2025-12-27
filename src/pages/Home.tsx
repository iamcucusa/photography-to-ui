import { useState } from 'react'
import Typography from '../components/Typography'
import Colors from '../components/Colors'
import Interaction from '../components/Interaction'
import System from '../components/System'
import PhotographyContextInsight from '../components/PhotographyContextInsight'
import ComingSoon from '../components/ComingSoon'

const insights = [
  {
    id: 'typography',
    title: 'Typography leads the interface.',
    text: 'Layout follows reading, not decoration.',
    headline: 'Typography leads the interface_',
    supporting: 'Layout follows reading, not decoration. Type scale creates hierarchy. Weight and spacing guide attention.',
  },
  {
    id: 'color',
    title: 'Color is structural.',
    text: 'Accent is reserved for intent and focus.',
    headline: 'Color is structural_',
    supporting: 'The palette is extracted from a professional urban study and a personal natural one.',
  },
  {
    id: 'photography',
    title: 'Photography is context, not content.',
    text: 'It shapes layout and rhythm without competing for hierarchy..',
    headline: 'Photography is context, not content_',
    supporting: 'It informs decisions without demanding attention. Subdued. Muted. Supporting the narrative.',
  },
  {
    id: 'interaction',
    title: 'Minimal scrolling by design.',
    text: 'Exploration happens through interaction.',
    headline: 'Minimal scrolling by design_',
    supporting: 'Exploration happens through interaction. Click. Reveal. Engage. Content responds to intent.',
  },
  {
    id: 'system',
    title: 'This is not a design system.',
    text: 'It is a controlled starting point.',
    headline: 'This is not a design system_',
    supporting: 'It is a controlled starting point. Deliberate constraints. Intentional boundaries. Thoughtful defaults.',
  },
  {
    id: 'coming-soon',
    title: 'In progress',
    headline: 'In progress_',
    text: 'This exploration is intentionally incomplete.',
    supporting: 'Next iterations will extend structure, interaction, and system signals.',
  },
]

function Home() {
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [highlightedInsight, setHighlightedInsight] = useState<string | null>(null)

  const handleInsightLinkClick = (insightId: string) => {
    setSelectedInsight(insightId)
    // Clear highlight when clicking
    setHighlightedInsight(null)
  }

  const handleInsightLinkHover = (insightId: string | null) => {
    setHighlightedInsight(insightId)
  }

  const handleInsightItemClick = (insightId: string) => {
    // Toggle: if already selected, deselect; otherwise select
    setSelectedInsight(selectedInsight === insightId ? null : insightId)
    // Clear highlight when clicking
    setHighlightedInsight(null)
  }

  const narrativeText = `This is an exploration in design-in-code.

Photographic inputs inform color, rhythm, and emotional context.
Typography is selected from my daily development environment, optimized for reading, writing, and reasoning in code.

Layout and interaction constraints are resolved through implementation and iteration.`

  const renderNarrativeWithLinks = (text: string) => {
    const insightMap: Record<string, string> = {
      'design-in-code': 'system',
      'color': 'color',
      'rhythm': 'photography',
      'typography': 'typography',
      'interaction': 'interaction',
      'iteration': 'coming-soon',
    }

    // Split by longer phrases first, then single words (case-insensitive)
    const regex = /(design-in-code|typography|interaction|iteration|color|rhythm)/gi
    const parts: Array<{ text: string; isLink: boolean }> = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), isLink: false })
      }
      // Add the matched word/phrase (preserve original casing)
      const matchedText = text.substring(match.index, regex.lastIndex)
      parts.push({ text: matchedText, isLink: true })
      lastIndex = regex.lastIndex
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isLink: false })
    }
    
    return parts.map((part, index) => {
      if (part.isLink) {
        // Normalize to lowercase for lookup but preserve original casing in display
        const normalizedKey = part.text.toLowerCase()
        const insightId = insightMap[normalizedKey]
        if (!insightId) {
          return <span key={index}>{part.text}</span>
        }
        return (
          <button
            key={index}
            className={`narrative-link ${highlightedInsight === insightId ? 'narrative-link-highlighted' : ''} ${selectedInsight === insightId ? 'narrative-link-active' : ''}`}
            onClick={() => handleInsightLinkClick(insightId)}
            onMouseEnter={() => handleInsightLinkHover(insightId)}
            onMouseLeave={() => handleInsightLinkHover(null)}
            onFocus={() => handleInsightLinkHover(insightId)}
            onBlur={() => handleInsightLinkHover(null)}
            aria-label={`Inspect ${part.text} insight`}
          >
            {part.text}
          </button>
        )
      }
      // Preserve line breaks
      return (
        <span key={index}>
          {part.text.split('\n').map((line, lineIndex, array) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < array.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    })
  }

  return (
    <div className="app">
      <button
        className="page-title"
        onClick={() => setSelectedInsight(null)}
        aria-label="Return to homepage"
      >
        <span className="page-title-top">Photography</span>
        <span className="page-title-arrow">↓</span>
        <span className="page-title-bottom">Product UI</span>
      </button>
      <div className="layout">
        <div className="primary-panel">
          {!selectedInsight ? (
            <>
              <h1 className="homepage-headline">
                Photography translated into product UI
                <span className="headline-cursor">_</span>
              </h1>
              <div className="homepage-narrative">
                <div className="homepage-narrative-text">
                  {renderNarrativeWithLinks(narrativeText)}
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="primary-panel-headline">
                {insights.find((i) => i.id === selectedInsight)?.headline.replace('_', '') || ''}
                <span className="headline-cursor">_</span>
              </h1>
              <p className="primary-panel-supporting">
                {insights.find((i) => i.id === selectedInsight)?.supporting || ''}
              </p>
              {selectedInsight === 'typography' ? (
                <Typography />
              ) : selectedInsight === 'color' ? (
                <Colors />
              ) : selectedInsight === 'photography' ? (
                <PhotographyContextInsight variant="peripheral" />
              ) : selectedInsight === 'interaction' ? (
                <Interaction />
              ) : selectedInsight === 'system' ? (
                <System />
              ) : selectedInsight === 'coming-soon' ? (
                <ComingSoon />
              ) : null}
              <button
                className="back-home-nav"
                onClick={() => setSelectedInsight(null)}
                aria-label="Back to home"
              >
                <span className="back-home-arrow">←</span>
                <span className="back-home-label">back home</span>
              </button>
            </>
          )}
        </div>
        <aside className="insight-rail">
          <div className="insight-rail-header">
            <h2 className="insight-rail-title">Insights</h2>
            <button
              className="insight-rail-toggle"
              onClick={() => setRailCollapsed(!railCollapsed)}
              aria-expanded={!railCollapsed}
            >
              {railCollapsed ? 'Show' : 'Hide'}
            </button>
          </div>
          {!railCollapsed && (
            <>
              {insights.map((insight) => (
                <button
                  key={insight.id}
                  className={`insight-item ${selectedInsight === insight.id ? 'insight-item-active' : ''} ${highlightedInsight === insight.id && selectedInsight !== insight.id ? 'insight-item-highlighted' : ''}`}
                  onClick={() => handleInsightItemClick(insight.id)}
                  onMouseEnter={() => handleInsightLinkHover(insight.id)}
                  onMouseLeave={() => handleInsightLinkHover(null)}
                  aria-pressed={selectedInsight === insight.id}
                >
                  <div className="insight-item-title">{insight.title}</div>
                  <div className="insight-item-text">{insight.text}</div>
                </button>
              ))}
            </>
          )}
        </aside>
      </div>
      <div className="credit">
        <a
          href="https://www.linkedin.com/in/iamcucusa"
          target="_blank"
          rel="noopener noreferrer"
          className="credit-link"
        >
          Designed in code by <span className="credit-handle">@iamcucusa</span>
        </a>
      </div>
    </div>
  )
}

export default Home

