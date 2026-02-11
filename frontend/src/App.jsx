import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OptionsManagement from './pages/OptionsCode'
import ProductCodeManagement from './pages/ProductCode'
import QRProtocol from './pages/QRProtocol'

function App() {
  useEffect(() => {
    // Get business_id and token from URL query parameters
    const params = new URLSearchParams(window.location.search)
    const businessIdParam = params.get('business_id')
    const tokenParam = params.get('token')
    
    // Store business_id in localStorage if provided in URL
    if (businessIdParam) {
      localStorage.setItem('selectedBusinessId', businessIdParam)
      localStorage.setItem('POS_BUSINESS_ID', businessIdParam)
    }
    
    // Store token in localStorage if provided in URL
    if (tokenParam) {
      localStorage.setItem('posToken', tokenParam)
    }
  }, [])

  return (
    <BrowserRouter basename="/tea-machine">
      <Routes>
        <Route path="/options" element={<OptionsManagement />} />
        <Route path="/products" element={<ProductCodeManagement />} />
        <Route path="/qr" element={<QRProtocol />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
