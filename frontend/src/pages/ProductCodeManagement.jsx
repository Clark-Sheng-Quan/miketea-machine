import React, { useState, useEffect } from 'react'
import { Input, Button, Spin, message, Switch } from 'antd'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { posAuthAPI, productCodesAPI } from '../services/api'
import { POS_BUSINESS_ID } from '../config/constants'

export default function ProductCodeManagement() {
  const [products, setProducts] = useState([])
  const [productCodes, setProductCodes] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [savingCode, setSavingCode] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [currentCode, setCurrentCode] = useState('')
  const [token, setToken] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [maxPage, setMaxPage] = useState(0)
  const [pageSize] = useState(20)
  const [switchEnabled, setSwitchEnabled] = useState(false)
  const [loadingSwitch, setLoadingSwitch] = useState(false)

  // Get token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('posToken')
    if (savedToken) {
      setToken(savedToken)
    } else {
      message.error('No authentication token found. Please login again.')
    }
  }, [])

  // Load products and codes on mount
  useEffect(() => {
    if (token) {
      loadSwitchAndProducts()
    }
  }, [token])

  // Load switch status first, then load products if enabled
  const loadSwitchAndProducts = async () => {
    try {
      const response = await productCodesAPI.getSwitch(POS_BUSINESS_ID)
      if (response.data.success && response.data.data) {
        const isEnabled = response.data.data.enabled || false
        setSwitchEnabled(isEnabled)
        
        // Only load products if switch is enabled
        if (isEnabled) {
          await loadProductsAndCodes()
        } else {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Error loading switch:', error)
      setLoading(false)
    }
  }

  // Load switch status (used for toggle)
  const loadSwitch = async () => {
    try {
      const response = await productCodesAPI.getSwitch(POS_BUSINESS_ID)
      if (response.data.success && response.data.data) {
        setSwitchEnabled(response.data.data.enabled || false)
      }
    } catch (error) {
      console.error('Error loading switch:', error)
    }
  }

  // Handle switch toggle
  const handleSwitchChange = async (checked) => {
    try {
      setLoadingSwitch(true)
      const response = await productCodesAPI.setSwitch(POS_BUSINESS_ID, checked)
      if (response.data.success) {
        setSwitchEnabled(checked)
        
        
        // Load products if just enabled
        if (checked) {
          await loadProductsAndCodes()
        }
      }
    } catch (error) {
      console.error('Error updating switch:', error)
      message.error('Failed to update setting')
    } finally {
      setLoadingSwitch(false)
    }
  }

  // Load products with pagination (without loading all codes)
  const loadProductsAndCodes = async (pageIdx = 0) => {
    try {
      setLoading(true)
      setLoadingProducts(true)

      // Search products from POS API with pagination
      const response = await posAuthAPI.searchProducts(token, POS_BUSINESS_ID, pageSize, pageIdx)

      if (response.data.success && response.data.data) {
        const productList = response.data.data?.products || []
        const validProducts = Array.isArray(productList) ? productList : []
        const maxPageNum = response.data.data?.max_page || 0
        
        setProducts(validProducts)
        setCurrentPage(pageIdx)
        setMaxPage(maxPageNum)

        if (validProducts.length === 0) {
          message.info('No products found')
        }
      } else {
        message.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      message.error('Failed to load products: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
      setLoadingProducts(false)
    }
  }

  // Select product and load its code
  const handleSelectProduct = async (product) => {
    setCurrentProduct(product)
    
    // Load the code for this specific product
    try {
      const response = await productCodesAPI.searchByProduct(POS_BUSINESS_ID, product.product_id)
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setCurrentCode(response.data.data[0].code || '')
      } else {
        setCurrentCode('')
      }
    } catch (error) {
      console.error('Error loading product code:', error)
      setCurrentCode('')
    }
  }

  // Save product code
  const handleSaveCode = async () => {
    if (!currentProduct) return

    if (!currentCode.trim()) {
      message.warning('Please enter a product code')
      return
    }

    try {
      setSavingCode(true)
      const response = await productCodesAPI.save(POS_BUSINESS_ID, currentProduct.product_id, currentCode)

      if (response.data.success) {
        setProductCodes(prev => ({
          ...prev,
          [currentProduct.product_id]: currentCode
        }))
      }
    } catch (error) {
      console.error('Error saving product code:', error)
      message.error('Failed to save product code')
    } finally {
      setSavingCode(false)
    }
  }


  // Render loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading products..." />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, height: '100%' }}>
      {/* Top: Switch Section */}
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
              Enable Product Code
            </span>
            <Switch
              checked={switchEnabled}
              onChange={handleSwitchChange}
              loading={loadingSwitch}
              disabled={loadingSwitch}
            />
          </div>
          {!switchEnabled && (
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#666', marginLeft: '12px', padding: '4px 8px', background: '#f5f5f5', borderRadius: '4px' }}>
              Using raw Product ID - Enable to use Product Code
            </span>
          )}
        </div>
        <span style={{ fontSize: '12px', color: '#999' }}>
          {switchEnabled ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, opacity: switchEnabled ? 1 : 0.5, pointerEvents: switchEnabled ? 'auto' : 'none', minHeight: 0 }}>
        {/* Left: Products List */}
        <div style={{ height: '78vh', flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', minHeight: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
              Products
            </div>
          </div>

          <div style={{ height: '78vh',overflowY: 'auto', padding: '12px', minHeight: 0 }}>
            <Spin spinning={loadingProducts}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {products.map((product) => (
                  <div
                    key={product.product_id}
                    onClick={() => handleSelectProduct(product)}
                    style={{
                      padding: '12px',
                      background: currentProduct?.product_id === product.product_id ? '#e6f7ff' : '#f9f9f9',
                      border: currentProduct?.product_id === product.product_id ? '2px solid #1890ff' : '1px solid #e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentProduct?.product_id !== product.product_id) {
                        e.currentTarget.style.background = '#f0f0f0'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentProduct?.product_id !== product.product_id) {
                        e.currentTarget.style.background = '#f9f9f9'
                      }
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      {product.name}
                    </div>
                  </div>
                ))}
              </div>
            </Spin>
          </div>

          {/* Pagination Controls */}
          {maxPage > 0 && (
            <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', background: 'white', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  disabled={currentPage === 0 || loadingProducts}
                  onClick={() => loadProductsAndCodes(0)}
                  size="small"
                  style={{ minWidth: '32px' }}
                >
                  «
                </Button>
                <Button
                  disabled={currentPage === 0 || loadingProducts}
                  onClick={() => loadProductsAndCodes(currentPage - 1)}
                  size="small"
                  style={{ minWidth: '32px' }}
                >
                  ‹
                </Button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, maxPage) }).map((_, idx) => {
                  let pageNum = idx
                  if (currentPage > 2) {
                    pageNum = currentPage - 2 + idx
                  } else if (currentPage > 0 && maxPage > 5) {
                    pageNum = idx
                  }
                  
                  if (pageNum >= maxPage) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      type={currentPage === pageNum ? 'primary' : 'default'}
                      disabled={loadingProducts}
                      onClick={() => loadProductsAndCodes(pageNum)}
                      size="small"
                      style={{ minWidth: '32px' }}
                    >
                      {pageNum + 1}
                    </Button>
                  )
                })}

                <Button
                  disabled={currentPage >= maxPage - 1 || loadingProducts}
                  onClick={() => loadProductsAndCodes(currentPage + 1)}
                  size="small"
                  style={{ minWidth: '32px' }}
                >
                  ›
                </Button>
                <Button
                  disabled={currentPage >= maxPage - 1 || loadingProducts}
                  onClick={() => loadProductsAndCodes(maxPage - 1)}
                  size="small"
                  style={{ minWidth: '32px' }}
                >
                  »
                </Button>

                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                  {currentPage + 1} / {maxPage}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Product Code Editor */}
        <div style={{ height: '78vh', flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', minHeight: 0 }}>
          {currentProduct ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  {currentProduct.name}
                </h3>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveCode}
                  loading={savingCode}
                  size="small"
                >
                  Save
                </Button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
              {/* Product ID */}
              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                  Product ID
                </div>
                <div style={{ fontSize: '14px', color: '#333', fontFamily: 'monospace', fontWeight: '500' }}>
                  {currentProduct.product_id}
                </div>
              </div>

              {/* Product Code */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                  Product Code
                </div>
                <Input
                  placeholder="Enter product code"
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  size="large"
                  style={{ marginBottom: '8px' }}
                />

              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: '#999', flex: 1, minHeight: 0, paddingTop: '60px' }}>
            Select a product from the left to edit product code
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
