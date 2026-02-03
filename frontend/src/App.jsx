import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Layout from './components/Layout'

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

  return <Layout />
}

export default App
