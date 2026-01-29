import React, { useState } from 'react'
import { Button, Select, Card, message, Collapse, Tag, Spin, Button as CopyButton, Space, Modal } from 'antd'
import { UploadOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons'
import {
  loadQRFormula,
  generateQRStringsFromOrder,
  countValidOptionItems,
  getValidOptionGroups,
  generateQRCodeDataURL,
  syncQRDataFromAPI,
  getLastSyncTime
} from '../services/qrService.ts'

export default function POS() {
  const [orderData, setOrderData] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formula, setFormula] = useState('#{productCode}|#{optionCodes}')
  const [qrStrings, setQrStrings] = useState([])
  const [loading, setLoading] = useState(false)
  const [qrCodesModalVisible, setQrCodesModalVisible] = useState(false)
  const [qrCodes, setQrCodes] = useState([])
  const [generatingQRCodes, setGeneratingQRCodes] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(getLastSyncTime())
  const [syncing, setSyncing] = useState(false)

  // Handle syncing data from API
  const handleSyncData = async () => {
    try {
      setSyncing(true)
      const success = await syncQRDataFromAPI()
      if (success) {
        setLastSyncTime(getLastSyncTime())
        // Reload formula after sync
        const loadedFormula = await loadQRFormula()
        setFormula(loadedFormula)
        message.success('Data synced successfully from API')
      } else {
        message.error('Failed to sync data from API')
      }
    } catch (error) {
      console.error('Sync error:', error)
      message.error('Error during data sync')
    } finally {
      setSyncing(false)
    }
  }

  // Handle generating QR codes
  const handleGenerateQRCodes = async () => {
    if (qrStrings.length === 0) {
      message.error('No QR strings to generate')
      return
    }

    try {
      setGeneratingQRCodes(true)
      const qrStringValues = qrStrings.map(item => item.qrString)
      const dataURLs = await Promise.all(
        qrStringValues.map(qrString => generateQRCodeDataURL(qrString))
      )
      
      const qrCodesData = qrStrings.map((item, idx) => ({
        key: item.key,
        productName: item.productName,
        qrString: item.qrString,
        dataURL: dataURLs[idx]
      }))
      
      setQrCodes(qrCodesData)
      setQrCodesModalVisible(true)
      message.success('QR codes generated successfully')
    } catch (error) {
      console.error('Failed to generate QR codes:', error)
      message.error('Failed to generate QR codes')
    } finally {
      setGeneratingQRCodes(false)
    }
  }

  // Handle order selection - auto-generate QR strings
  const handleOrderSelect = async (value) => {
    setSelectedOrder(value)
    setQrStrings([]) // Clear previous results
    setLoading(true)
    
    try {
      // Load formula from database
      const loadedFormula = await loadQRFormula()
      setFormula(loadedFormula)
      
      // Generate QR strings
      const order = orderData.orders[value]
      const qrList = await generateQRStringsFromOrder(order, loadedFormula)
      setQrStrings(qrList)
    } catch (error) {
      console.error('Failed to generate QR strings:', error)
      message.error('Failed to generate QR strings')
    } finally {
      setLoading(false)
    }
  }

  const loadPOSOrders = async () => {
    try {
      const response = await fetch('../orderfile/posorder.json')
      const data = await response.json()
      const normalizedData = normalizePOSData(data)
      setOrderData(normalizedData)
      message.success('Loaded POS Orders')
    } catch (error) {
      message.error(`Failed to load POS Orders: ${error.message}`)
      console.error(error)
    }
  }

  // Normalize POS order data to match online order structure
  const normalizePOSData = (posData) => {
    return {
      orders: posData.orderitems.map(item => ({
        _id: posData.id,
        orderId: posData.id,
        order_num: posData.orderNumber || 'N/A',
        products: [
          {
            _id: item.product?.product_id || 'unknown',
            itemId: item.id,
            sku: item.product?.sku || '',
            name: item.product?.name || 'Unknown Product',
            options: item.product?.options?.map(opt => ({
              _id: opt._id,
              name: opt.name,
              option_items: opt.option_items || []
            })) || []
          }
        ]
      }))
    }
  }

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: 'Option Codes',
      dataIndex: 'optionCodes',
      key: 'optionCodes',
      render: (text) => <code style={{ fontSize: '12px' }}>{text}</code>
    },
    {
      title: 'QR String',
      dataIndex: 'qrString',
      key: 'qrString',
      render: (text) => <code style={{ fontSize: '12px', color: '#d4380d' }}>{text}</code>
    }
  ]

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
      {/* Top Control Panel */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Left: Load and Sync */}
        <Card style={{ flex: 0.3 }} title="Operations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button 
              type="primary"
              block
              icon={<UploadOutlined />}
              onClick={loadPOSOrders}
            >
              Load Orders
            </Button>
            <Button
              block
              size="small"
              onClick={handleSyncData}
              loading={syncing}
              disabled={syncing}
            >
              Sync API Data
            </Button>
            {lastSyncTime && (
              <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
                Last: {new Date(lastSyncTime).toLocaleString()}
              </div>
            )}
          </div>
        </Card>

        {/* Right: Order Selection and Details */}
        <Card style={{ flex: 0.7 }} title="Order Selection">
          {orderData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Select
                placeholder="Select an order"
                onChange={handleOrderSelect}
                options={orderData.orders.map((order, idx) => ({
                  value: idx,
                  label: `Order ${idx + 1} - ${order._id.slice(0, 8)}... (${order.products.length} items)`
                }))}
              />
              
              {selectedOrder !== null && orderData?.orders[selectedOrder] && (
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Order:</strong> <code>{orderData.orders[selectedOrder]._id.slice(0, 16)}...</code>
                  </div>
                  <div>
                    <strong>Products:</strong>
                    {orderData.orders[selectedOrder].products.map((p, idx) => (
                      <div key={idx} style={{ marginLeft: '12px', fontSize: '11px', marginTop: '4px' }}>
                        • {p.name} ({countValidOptionItems(p)} options)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#999', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
              Load orders to start
            </div>
          )}
        </Card>
      </div>

      {/* Formula and QR Generation */}
      {orderData && (
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Left: Formula */}
          <Card style={{ flex: 0.4 }} title="QR Formula">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={formula}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed'
                }}
              />
              {loading && <Tag color="processing">Loading Formula...</Tag>}
            </div>
          </Card>

          {/* Right: QR String and Generate Button */}
          <Card 
            style={{ flex: 0.6 }}
            title="QR Code"
            extra={
              qrStrings.length > 0 ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<QrcodeOutlined />}
                  onClick={handleGenerateQRCodes}
                  loading={generatingQRCodes}
                >
                  Generate
                </Button>
              ) : null
            }
          >
            {qrStrings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>
                  {qrStrings[0]?.productName}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <code style={{ 
                    fontSize: '12px', 
                    color: '#d4380d', 
                    wordBreak: 'break-all',
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#fafafa',
                    borderRadius: '4px',
                    maxHeight: '60px',
                    overflow: 'auto'
                  }}>
                    {qrStrings[0]?.qrString}
                  </code>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(qrStrings[0]?.qrString)
                      message.success('Copied')
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ color: '#999', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
                Select an order to generate QR
              </div>
            )}
          </Card>
        </div>
      )}

      {/* QR Codes Modal */}
      <Modal
        title="Generated QR Codes"
        open={qrCodesModalVisible}
        onCancel={() => setQrCodesModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrCodesModalVisible(false)}>
            Close
          </Button>
        ]}
        width={1000}
        style={{ maxHeight: '90vh' }}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {qrCodes.map((qrCode, idx) => (
            <div
              key={qrCode.key}
              style={{
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fafafa',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div>
                <strong style={{ fontSize: '12px' }}>{qrCode.productName}</strong>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
                  {qrCode.qrString}
                </div>
              </div>
              <img
                src={qrCode.dataURL}
                alt={`QR Code ${idx + 1}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <Button
                type="primary"
                size="small"
                block
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = qrCode.dataURL
                  link.download = `QRCode_${qrCode.productName}_${idx + 1}.png`
                  link.click()
                }}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
