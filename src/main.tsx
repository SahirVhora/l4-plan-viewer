import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domAnimation } from 'framer-motion'
import './index.css'
import App from './App.tsx'

// domAnimation covers the animate/exit/transition features the app uses and
// keeps the full framer-motion feature bundle out of the main chunk.
// `strict` fails fast if a component reintroduces the heavy `motion` import.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </StrictMode>,
)
