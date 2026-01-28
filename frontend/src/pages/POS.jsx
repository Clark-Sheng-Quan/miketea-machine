import React, { useState } from 'react'
import { Button, Select, Card, message, Collapse, Tag, Spin, Button as CopyButton, Space } from 'antd'
import { UploadOutlined, CopyOutlined } from '@ant-design/icons'
import {
  loadQRFormula,
  generateQRStringsFromOrder,
  countValidOptionItems,
  getValidOptionGroups
} from '../services/qrService'

export default function POS() {
  const [orderData, setOrderData] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formula, setFormula] = useState('#{productCode}|#{optionCodes}')
  const [qrStrings, setQrStrings] = useState([])
  const [loading, setLoading] = useState(false)

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
        <Button 
          type="primary"
          icon={<UploadOutlined />}
          onClick={loadPOSOrders}
        >
          Load POS Orders
        </Button>
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
        </Spin>
      )}
    </div>
  )
}
