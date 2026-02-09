import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OptionsManagement from './pages/OptionsCode'
import ProductCodeManagement from './pages/ProductCode'
import QRProtocol from './pages/QRProtocol'

function App() {
  useEffect(() => {
    // Get token and business_id from URL query parameters
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    const businessIdParam = params.get('business_id')
    
    // Store in localStorage if provided in URL
    if (tokenParam) {
      localStorage.setItem('posToken', tokenParam)
    }
    if (businessIdParam) {
      localStorage.setItem('selectedBusinessId', businessIdParam)
      localStorage.setItem('POS_BUSINESS_ID', businessIdParam)
    }
  }, [])

  return (
    <BrowserRouter basename="">
      <Routes>
        <Route path="/options" element={<OptionsManagement />} />
        <Route path="/products" element={<ProductCodeManagement />} />
        <Route path="/qr" element={<QRProtocol />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
