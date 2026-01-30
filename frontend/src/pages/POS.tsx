import React, { useState, ChangeEvent, CSSProperties } from 'react'
import { Button, Select, message, Tag, Modal, Card, SelectProps, Collapse } from 'antd'
import { UploadOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons'
import {
  loadQRFormula,
  generateQRStringsFromOrder,
  countValidOptionItems,
  generateQRCodeDataURL,
  syncQRDataFromAPI,
  getLastSyncTime,
  QRResult
} from '../services/qrService'

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
  const fileInputRef = React.useRef(null)

  const handleSyncData = async () => {
    try {
      setSyncing(true)
      const success = await syncQRDataFromAPI()
      if (success) {
        setLastSyncTime(getLastSyncTime())
        const loadedFormula = await loadQRFormula()
        setFormula(loadedFormula)
        message.success('Data synced successfully')
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

  const handleGenerateQRCodes = async () => {
    if (qrStrings.length === 0) {
      message.error('No QR strings to generate')
      return
    }

    try {
      setGeneratingQRCodes(true)
      const qrStringValues = qrStrings.map((item: QRResult) => item.qrString)
      const dataURLs = await Promise.all(
        qrStringValues.map((qrString: string) => generateQRCodeDataURL(qrString))
      )
      
      const qrCodesData = qrStrings.map((item: QRResult, idx: number) => ({
        ...item,
        dataURL: dataURLs[idx]
      }))
      
      setQrCodes(qrCodesData)
      setQrCodesModalVisible(true)
    } catch (error) {
      console.error('Failed to generate QR codes:', error)
      message.error('Failed to generate QR codes')
    } finally {
      setGeneratingQRCodes(false)
    }
  }

  const handleOrderSelect = async (value: number) => {
    setSelectedOrder(value)
    setQrStrings([])
    setLoading(true)
    
    try {
      const loadedFormula = await loadQRFormula()
      setFormula(loadedFormula)
      
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

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        const normalizedData = normalizePOSData(data)
        setOrderData(normalizedData)
        message.success(`Orders loaded successfully (${normalizedData.orders.length} orders)`)
      } catch (error) {
        message.error(`Failed to parse JSON file: ${error instanceof Error ? error.message : String(error)}`)
        console.error(error)
      }
    }
    reader.onerror = () => {
      message.error('Failed to read file')
    }
    reader.readAsText(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const normalizePOSData = (posData: any) => {
    return {
      orders: posData.orderitems.map((item: any) => ({
        _id: posData.id,
        orderId: posData.id,
        order_num: posData.orderNumber || 'N/A',
        products: [
          {
            _id: item.product?.product_id || 'unknown',
            itemId: item.id,
            sku: item.product?.sku || '',
            name: item.product?.name || 'Unknown Product',
            options: item.product?.options?.map((opt: any) => ({
              _id: opt._id,
              name: opt.name,
              option_items: opt.option_items || []
            })) || []
          }
        ]
      }))
    }
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Top Control Panel */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Left: Load and Sync */}
        <Card style={{ flex: 0.3 }} title="Operations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button 
              type="primary"
              block
              icon={<UploadOutlined />}
              onClick={triggerFileInput}
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
                options={orderData.orders.map((order: any, idx: number) => ({
                  value: idx,
                  label: `Order ${idx + 1} - ${order._id.slice(0, 8)}... (${order.products.length} items)`
                })) as SelectProps['options']}
              />
              
              {selectedOrder !== null && orderData?.orders[selectedOrder] && (
                <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Order:</strong> <code style={{ marginLeft: '8px' }}>{orderData.orders[selectedOrder]._id.slice(0, 16)}...</code>
                  </div>
                  <Collapse
                    items={orderData.orders[selectedOrder].products.map((p: any, idx: number) => ({
                      key: idx.toString(),
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <span>📦 {p.name}</span>
                          <Tag color="blue" style={{ fontSize: '10px' }}>({countValidOptionItems(p)} options)</Tag>
                        </div>
                      ),
                      children: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                          <div><strong>SKU:</strong> {p.sku || 'N/A'}</div>
                          <div><strong>ID:</strong> <code>{p._id}</code></div>
                          {p.options && p.options.length > 0 && (
                            <div>
                              <strong>Valid Options (with qty):</strong>
                              <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                                {p.options
                                  .map((opt: any) => ({
                                    ...opt,
                                    validItems: opt.option_items?.filter((item: any) => item.qty && item.qty > 0) || []
                                  }))
                                  .filter((opt: any) => opt.validItems.length > 0)
                                  .map((opt: any, optIdx: number) => (
                                    <div key={optIdx} style={{ marginBottom: '6px', fontSize: '11px' }}>
                                      <strong>{opt.name}</strong>
                                      <div style={{ marginLeft: '8px', color: '#666' }}>
                                        {opt.validItems.map((item: any, itemIdx: number) => (
                                          <div key={itemIdx}>
                                            • {item.name || item.value || 'N/A'} (qty: {item.qty})
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }))}
                    accordion
                  />
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
                      message.success('Copied!')
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
        ] as React.ReactNode[]}
        width={1000}
        style={{ maxHeight: '90vh' } as CSSProperties}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' } as CSSProperties}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
          {qrCodes.map((qrCode: any, idx: number) => (
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
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '100%' }}>
                <strong style={{ fontSize: '12px' }}>{qrCode.productName}</strong>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
                  {qrCode.qrString}
                </div>
              </div>
              <img
                src={qrCode.dataURL}
                alt={`QR Code ${idx + 1}`}
                style={{ maxWidth: '300px', height: '300px' }}
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
