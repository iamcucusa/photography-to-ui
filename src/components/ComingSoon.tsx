import { useState } from 'react'
import './comingSoon.css'

const comingSoonItems = [
  'Responsive behavior across breakpoints, without changing hierarchy',
  'Pattern usage documentation and rationale',
  'Interaction case studies focused on intent and outcome',
  'Design-in-code process insights and decision notes',
  'Asset optimization for responsive layouts and performance',
  'Design tokens inspect widget interaction',
]

function ComingSoon() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Formspree endpoint - replace with your Formspree form ID
    const formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID'

    try {
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setEmail('')
        setMessage('')
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="coming-soon-component">
      <div className="coming-soon-section">
        <h3 className="coming-soon-section-title">Coming soon</h3>
        <ul className="coming-soon-list">
          {comingSoonItems.map((item, index) => (
            <li key={index} className="coming-soon-item">
              <span className="coming-soon-bullet coming-soon-bullet--oval"></span>
              <span className="coming-soon-text">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="coming-soon-contact">
        <p className="coming-soon-question">
          Want to collaborate or discuss this work?
        </p>
        <form className="coming-soon-cta" onSubmit={handleSubmit}>
          <div className="coming-soon-cta-group">
            <input
              type="email"
              className="coming-soon-cta-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <button type="submit" className="coming-soon-cta-button" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Say hello'}
            </button>
          </div>
          <textarea
            className="coming-soon-cta-message"
            placeholder="Say hello, share feedback, or just drop a line..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          {submitStatus === 'success' && (
            <div className="coming-soon-cta-status coming-soon-cta-status-success">
              Thanks! I'll get back to you soon.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="coming-soon-cta-status coming-soon-cta-status-error">
              Something went wrong. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default ComingSoon

