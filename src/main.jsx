import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SegmentProvider } from './context/SegmentContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import { ManualTimeProvider } from './context/ManualTimeContext.jsx'

createRoot(document.getElementById('root')).render(
    <SegmentProvider>
      <LocationProvider>
          <ManualTimeProvider>
            <App />
          </ManualTimeProvider>
      </LocationProvider>
    </SegmentProvider>
)
