import { useState, useEffect } from 'react'
import Login from './pages/Login'
import MilkTeaLayout from './components/MilkTeaLayout'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('posToken')
    if (savedToken) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return <MilkTeaLayout />
}

export default App
