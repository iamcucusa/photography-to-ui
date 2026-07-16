import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@tokens/fonts.css'
import '@tokens/dist/tokens.css'
import '@tokens/dist/tokens.light.css'
import './styles/base.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
