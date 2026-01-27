import React, { useState } from 'react'
import { Button, Select, Card, Table, Space, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

export default function POS() {
  const [orderData, setOrderData] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formula, setFormula] = useState('ORD|#{orderId}|#{productId}|#{optionItemId}')
  const [qrStrings, setQrStrings] = useState([])
  const [orderType, setOrderType] = useState(null)

  // Load JSON file from orderfile folder
  const loadOrderFile = async (fileName) => {
    try {
      const response = await fetch(`/orderfile/${fileName}`)
      const data = await response.json()
      
      if (fileName === 'onlineorder.json') {
        setOrderType('online')
        setOrderData(data)
      } else if (fileName === 'posorder.json') {
        setOrderType('pos')
        // Convert POS format to normalized structure
        const normalizedData = normalizePOSData(data)
        setOrderData(normalizedData)
      }
      
      message.success(`Loaded ${fileName}`)
    } catch (error) {
      message.error(`Failed to load ${fileName}: ${error.message}`)
      console.error(error)
    }
  }

  // Normalize POS order data to match online order structure
  const normalizePOSData = (posData) => {
    return {
      orders: posData.orderitems.map(item => ({
        _id: posData.id,
        order_num: posData.orderNumber || 'N/A',
        products: [
          {
            _id: item.product?._id || 'unknown',
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

  // Extract QR data from order
  const generateQRStrings = () => {
    if (!selectedOrder || !orderData) {
      message.warning('Please select an order first')
      return
    }

    const qrList = []
    const order = orderData.orders[selectedOrder]

    // Iterate through products in the order
    order.products.forEach(product => {
      const productId = product._id

      // If order type is online, options are flat array with name and qty
      if (orderType === 'online') {
        product.option?.forEach(opt => {
          // Find matching option item ID from database or use name
          const qrString = formula
            .replace('#{orderId}', order._id)
            .replace('#{productId}', productId)
            .replace('#{optionItemId}', opt.name) // Use option name as ID for now
          
          qrList.push({
            key: `${order._id}-${productId}-${opt.name}`,
            orderId: order._id,
            productId: productId,
            productName: product.name,
            optionName: opt.name,
            optionItemId: opt.name,
            qrString: qrString
          })
        })
      }
      // If order type is POS, options have nested option_items
      else if (orderType === 'pos') {
        product.options?.forEach(optionGroup => {
          optionGroup.option_items?.forEach(item => {
            const qrString = formula
              .replace('#{orderId}', order._id)
              .replace('#{productId}', productId)
              .replace('#{optionItemId}', item._id)
            
            qrList.push({
              key: `${order._id}-${productId}-${item._id}`,
              orderId: order._id,
              productId: productId,
              productName: product.name,
              optionName: optionGroup.name,
              optionItemId: item._id,
              optionItemName: item.name,
              qrString: qrString
            })
          })
        })
      }
    })

    setQrStrings(qrList)
    message.success(`Generated ${qrList.length} QR strings`)
  }

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 200
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: 'Option Group',
      dataIndex: 'optionName',
      key: 'optionName'
    },
    {
      title: 'Option Item',
      dataIndex: 'optionItemName',
      key: 'optionItemName',
      render: (text, record) => record.optionItemName || record.optionItemId
    },
    {
      title: 'QR String',
      dataIndex: 'qrString',
      key: 'qrString',
      render: (text) => <code style={{ fontSize: '11px' }}>{text}</code>
    }
  ]

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
      <Card title="POS Order QR Generator">
        <Space>
          <Button 
            icon={<UploadOutlined />}
            onClick={() => loadOrderFile('onlineorder.json')}
          >
            Load Online Orders
          </Button>
          <Button 
            icon={<UploadOutlined />}
            onClick={() => loadOrderFile('posorder.json')}
          >
            Load POS Orders
          </Button>
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
              onChange={(value) => setSelectedOrder(value)}
              style={{ width: '100%', marginBottom: '16px' }}
              options={orderData.orders.map((order, idx) => ({
                value: idx,
                label: `Order ${idx + 1} - ${order._id} (${order.products.length} items)`
              }))}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              QR Formula:
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="e.g., ORD|#{orderId}|#{productId}|#{optionItemId}"
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Available variables: #{'{orderId}'}, #{'{productId}'}, #{'{optionItemId}'}
            </div>
          </div>

          <Button 
            type="primary" 
            onClick={generateQRStrings}
            style={{ marginTop: '16px' }}
          >
            Generate QR Strings
          </Button>
        </Card>
      )}

      {qrStrings.length > 0 && (
        <Card 
          title={`Generated QR Strings (${qrStrings.length})`}
          style={{ flex: 1, minHeight: 0 }}
          bodyStyle={{ overflow: 'auto', height: '100%' }}
        >
          <Table
            columns={columns}
            dataSource={qrStrings}
            pagination={{ pageSize: 20 }}
            size="small"
            scroll={{ x: true }}
          />
        </Card>
      )}
    </div>
  )
}
