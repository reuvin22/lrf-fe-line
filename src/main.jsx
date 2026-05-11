import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SegmentProvider } from './context/SegmentContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import { ManualTimeProvider } from './context/ManualTimeContext.jsx'
import { LiffProvider } from './context/LiffContext.jsx'
import { AttendanceProvider } from './context/AttendanceContext.jsx'
import { TransportationExpensesProvider } from './context/TransportationExpensesContext.jsx'

createRoot(document.getElementById('root')).render(
  <LiffProvider>
    <AttendanceProvider>
      <SegmentProvider>
        <LocationProvider>
          <TransportationExpensesProvider>
            <ManualTimeProvider>
              <App />
            </ManualTimeProvider>
          </TransportationExpensesProvider>
        </LocationProvider>
      </SegmentProvider>
    </AttendanceProvider>
  </LiffProvider>
)
