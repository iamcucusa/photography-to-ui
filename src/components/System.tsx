import { useState } from 'react'

const notes = [
  {
    description: 'An exercise in giving structure to abstract identity.',
    implementation: 'Implemented directly in code.',
  },
  {
    description: 'This is not a component buffet.',
    param: 'constraints',
    paramType: 'Object',
    paramDesc: 'Constraints are doing the heavy lifting.',
  },
  {
    description: 'Visual material comes from real contexts.',
    param: 'sources',
    paramType: 'Array<string>',
    paramDesc: 'Cities, environments, and experiments—not trends.',
  },
  {
    description: 'Images were enhanced with AI tooling.',
    param: 'facialPresence',
    paramType: 'boolean',
    paramDesc: 'Full facial presence was intentionally skipped.',
    defaultValue: 'false',
  },
  {
    description: 'System thinking is present.',
    returns: 'void',
    note: 'System extraction is postponed.',
  },
]

function System() {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="system-component">
      <button
        className="system-notes-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="system-notes-title">Notes on intent</span>
        <span className="system-notes-toggle">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="system-notes-content">
          <pre className="system-notes-code">
            <code>
              {notes.map((block, blockIndex) => (
                <span key={blockIndex}>
                  <span className="system-notes-delimiter">/**</span>
                  {'\n'}
                  <span className="system-notes-delimiter"> * </span>
                  <span className="system-notes-comment">{block.description}</span>
                  {'\n'}
                  {block.param && (
                    <>
                      <span className="system-notes-delimiter"> * </span>
                      <span className="system-notes-directive">@param</span>
                      {' '}
                      <span className="system-notes-code-element">{`{${block.paramType}}`}</span>
                      {' '}
                      <span className="system-notes-code-element">{block.param}</span>
                      {' '}
                      <span className="system-notes-comment">{block.paramDesc}</span>
                      {'\n'}
                    </>
                  )}
                  {block.defaultValue && (
                    <>
                      <span className="system-notes-delimiter"> * </span>
                      <span className="system-notes-directive">@default</span>
                      {' '}
                      <span className="system-notes-code-element">{block.defaultValue}</span>
                      {'\n'}
                    </>
                  )}
                  {block.returns && (
                    <>
                      <span className="system-notes-delimiter"> * </span>
                      <span className="system-notes-directive">@returns</span>
                      {' '}
                      <span className="system-notes-code-element">{`{${block.returns}}`}</span>
                      {' '}
                      <span className="system-notes-comment">{block.note}</span>
                      {'\n'}
                    </>
                  )}
                  {!block.param && !block.returns && block.implementation && (
                    <>
                      <span className="system-notes-delimiter"> * </span>
                      <span className="system-notes-comment">{block.implementation}</span>
                      {'\n'}
                    </>
                  )}
                  {!block.param && !block.returns && !block.implementation && block.note && (
                    <>
                      <span className="system-notes-delimiter"> * </span>
                      <span className="system-notes-comment">{block.note}</span>
                      {'\n'}
                    </>
                  )}
                  <span className="system-notes-delimiter"> */</span>
                  {blockIndex < notes.length - 1 && '\n\n'}
                </span>
              ))}
            </code>
          </pre>
        </div>
      )}
      <div className="system-tools">
        <div className="system-tools-code">
          <span className="system-tools-keyword">const</span>
          {' '}
          <span className="system-tools-variable">tools</span>
          {' '}
          <span className="system-tools-operator">=</span>
          {' '}
          <span className="system-tools-bracket">[</span>
          <div className="system-tools-items">
            {[
              'Adobe Colors',
              'Milanote',
              'Notion',
              'Cursor',
              'Magnific',
              'typescale.com',
              'CSS',
              'React',
            ].map((tool, index) => (
              <div key={index} className="system-tool-item">
                <span className="system-tool-quote">'</span>
                <span className="system-tool-name">{tool}</span>
                <span className="system-tool-quote">'</span>
                {index < 7 && <span className="system-tool-separator">,</span>}
              </div>
            ))}
          </div>
          <span className="system-tools-bracket">]</span>
          <span className="system-tools-semicolon">;</span>
        </div>
      </div>
    </div>
  )
}

export default System

