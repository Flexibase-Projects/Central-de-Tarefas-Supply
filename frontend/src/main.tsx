import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './theme/ThemeProvider'
import App from './App.tsx'
import './index.css'

/* Acelera a animação de borda ao passar o mouse — mantém posição (playbackRate) */
function setupBorderHoverSpeed() {
  const selector = '.MuiCard-root'
  const speed = 12

  document.body.addEventListener('mouseover', (e: MouseEvent) => {
    const el = (e.target as Element)?.closest?.(selector)
    if (el instanceof HTMLElement) {
      el.getAnimations().forEach((a) => { a.playbackRate = speed })
    }
  })

  document.body.addEventListener('mouseout', (e: MouseEvent) => {
    const related = (e.relatedTarget as Node) || null
    const el = (e.target as Element)?.closest?.(selector)
    if (!el || !related || !el.contains(related)) {
      el?.getAnimations?.()?.forEach?.((a) => { a.playbackRate = 1 })
    }
  })
}

setupBorderHoverSpeed()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
