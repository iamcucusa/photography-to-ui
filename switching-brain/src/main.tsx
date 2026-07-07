import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { HeroProto } from './proto/HeroProto'
import '@tokens/fonts.css'
import '@tokens/dist/tokens.css'
import './styles/base.css'
import './styles/viz-tokens.css'
import './styles/app.css'

// Isolated hero prototype at #proto — the shipped app is untouched on every
// other route. Temporary; remove with the src/proto folder.
const isProto = window.location.hash.startsWith('#proto')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isProto ? <HeroProto /> : <App />}</React.StrictMode>,
)
