import './App.css'
import LoginPage from './components/loginPage'
import IntroPage from './components/introPage'
import HomeLandingPage from './components/HomeLandingPage'
import Arena from './components/Arena'
import { Routes, Route } from 'react-router'

function App() {
  return (
    <>
      <Routes>
        <Route index element={<IntroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Landings" element={<HomeLandingPage />} />
        <Route path="/arena" element={<Arena />} />
      </Routes>
    </>
  )
}

export default App
