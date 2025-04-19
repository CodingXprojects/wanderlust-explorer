import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './components/landing'
import FlightSearchPage from './pages/FlightSearchPage'
import CreateTrip from './components/ui/create-trip'
import ViewDetails from './components/ui/view-details'

import './App.css'

function App() {
  const [nearbyCoords, setNearbyCoords] = useState(null)

  const handleNearbyClick = (coords) => {
    setNearbyCoords(coords)
    console.log('Nearby coordinates received:', coords)
  }

  return (
    <Routes>
      <Route path="/" element={<Landing onNearbyClick={handleNearbyClick} />} />
      <Route path="/flights" element={<FlightSearchPage />} />
      <Route path="/create-trip" element={<CreateTrip />} />
      <Route path="/view-details" element={<ViewDetails />} />
    </Routes>
  )
}

export default App
