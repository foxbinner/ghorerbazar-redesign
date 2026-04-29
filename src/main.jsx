import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// HeadlessUI v2 applies `overflow: hidden` as an inline style on <html> when
// any Dialog opens. Our CSS `overflow-y: scroll !important` prevents the
// scrollbar from disappearing (CSS !important beats inline styles).
//
// However, HUI still runs its scrollbar-width compensation and adds
// `padding-right` to <html> — because the scrollbar never disappeared, that
// padding is now wrong and causes a leftward content shift. This observer
// strips it the moment HUI adds it.
;(function neutraliseHUIScrollPadding() {
  let busy = false
  new MutationObserver(() => {
    if (busy) return
    const { style } = document.documentElement
    if (style.paddingRight && style.paddingRight !== '0px') {
      busy = true
      style.paddingRight = ''
      busy = false
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
