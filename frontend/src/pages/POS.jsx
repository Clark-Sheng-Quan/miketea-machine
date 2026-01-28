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
      const response = await fetch('/orderfile/posorder.json')
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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
      <Card title="POS Order QR Generator">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary"
            icon={<UploadOutlined />}
            onClick={loadPOSOrders}
          >
            Load POS Orders
          </Button>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <Button
              type="link"
              size="small"
              onClick={handleSyncData}
              loading={syncing}
              disabled={syncing}
            >
              Sync Data from API
            </Button>
            {lastSyncTime && (
              <span style={{ marginLeft: '8px' }}>
                (Last synced: {new Date(lastSyncTime).toLocaleString()})
              </span>
            )}
          </div>
        </Space>
      </Card>

      {orderData && (
        <Card title="Configuration">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Select Order:
            </label>
            <Select
              placeholder="Select an order"
              onChange={handleOrderSelect}
              style={{ width: '100%', marginBottom: '16px' }}
              options={orderData.orders.map((order, idx) => ({
                value: idx,
                label: `Order ${idx + 1} - ${order._id} (${order.products.length} items)`
              }))}
            />
          </div>

          {selectedOrder !== null && orderData?.orders[selectedOrder] && (
            <Card 
              title="Order Details" 
              style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}
              size="small"
            >
              <div style={{ marginBottom: '12px' }}>
                <strong>Order ID:</strong> <code>{orderData.orders[selectedOrder]._id}</code>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Products:</strong>
              </div>
              <Collapse 
                items={orderData.orders[selectedOrder].products.map((product, idx) => ({
                  key: idx,
                  label: (
                    <span>
                      {product.name} 
                      <Tag color="blue" style={{ marginLeft: '8px' }}>
                        {countValidOptionItems(product)} items
                      </Tag>
                    </span>
                  ),
                  children: (
                    <div>
                      {getValidOptionGroups(product).map((optGroup, groupIdx) => (
                        <div key={groupIdx} style={{ marginBottom: '12px' }}>
                          <strong>{optGroup.name}:</strong>
                          <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                            {optGroup.option_items?.filter(item => item.qty >= 1).map((item, itemIdx) => (
                              <div key={itemIdx} style={{ padding: '4px 0' }}>
                                <Tag color="green">{item.name}</Tag> 
                                <code style={{ fontSize: '11px', color: '#666' }}>({item._id})</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }))}
              />
            </Card>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              QR Formula:
              {loading && <Tag color="processing" style={{ marginLeft: '8px' }}>Loading...</Tag>}
            </label>
            <input
              type="text"
              value={formula}
              readOnly
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
              placeholder="e.g., ORD|#{orderId}|#{productId}|#{optionItemId}"
            />
          </div>
        </Card>
      )}

      {qrStrings.length > 0 && (
        <Spin spinning={loading}>
          <Card 
            title="QR String"
            extra={
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={handleGenerateQRCodes}
                loading={generatingQRCodes}
                disabled={generatingQRCodes}
              >
                Generate QR Code
              </Button>
            }
            style={{ flex: 1, minHeight: 0 }}
            bodyStyle={{ overflow: 'auto', height: '100%' }}
          >
            <div 
              style={{
                padding: '16px',
                border: '2px solid #d9d9d9',
                borderRadius: '4px',
                backgroundColor: '#fafafa',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '16px' }}>{qrStrings[0]?.productName}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <code style={{ fontSize: '18px', color: '#d4380d', wordBreak: 'break-all', flex: 1 }}>
                  {qrStrings[0]?.qrString}
                </code>
                <Button
                  type="primary"
                  size="large"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(qrStrings[0]?.qrString)
                    message.success('Copied to clipboard')
                  }}
                />
              </div>
            </div>
          </Card>

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
            width={900}
            style={{ maxHeight: '80vh' }}
            bodyStyle={{ maxHeight: '60vh', overflow: 'auto' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {qrCodes.map((qrCode, idx) => (
                <div
                  key={qrCode.key}
                  style={{
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <strong>{qrCode.productName}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      <code>{qrCode.qrString}</code>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <img
                      src={qrCode.dataURL}
                      alt={`QR Code ${idx + 1}`}
                      style={{ maxWidth: '300px', height: 'auto' }}
                    />
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCode.dataURL
                      link.download = `QRCode_${qrCode.productName}_${idx + 1}.png`
                      link.click()
                    }}
                  >
                    Download QR Code
                  </Button>
                </div>
              ))}
            </div>
          </Modal>
        </Spin>
      )}
    </div>
  )
}
