import React, { useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, message, Space, Spin, Image } from 'antd'
import { SearchOutlined, QrcodeOutlined } from '@ant-design/icons'
import { qrProtocolAPI } from '../services/api'

export default function QRProtocol() {
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false)
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false)
  const [qrImage, setQrImage] = useState(null)
  const [searchForm] = Form.useForm()
  const [generateForm] = Form.useForm()

  const handleSearch = async (values) => {
    try {
      setLoading(true)
      const res = await qrProtocolAPI.search(values)
      setProtocols(res.data.data)
      message.success(`Found ${res.data.data.length} protocols`)
      setIsSearchModalVisible(false)
    } catch (error) {
      message.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQR = async (values) => {
    try {
      setLoading(true)
      const flavors = values.flavors.split(',').map(f => f.trim())
      
      // Generate protocol
      const protocolRes = await qrProtocolAPI.generate({
        ...values,
        flavors
      })

      // Generate QR image
      const imageRes = await qrProtocolAPI.generateImage({
        protocol_string: protocolRes.data.protocol
      })

      setQrImage({
        protocol: protocolRes.data.protocol,
        image: imageRes.data.qrImage,
        data: protocolRes.data.qrData
      })

      message.success('QR code generated successfully')
    } catch (error) {
      message.error(error.response?.data?.error || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Serial',
      dataIndex: 'serial',
      key: 'serial'
    },
    {
      title: 'Bill No',
      dataIndex: 'bill_no',
      key: 'bill_no'
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku'
    },
    {
      title: 'Flavors',
      dataIndex: 'flavors',
      key: 'flavors'
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol_string',
      key: 'protocol_string',
      render: (text) => <code style={{ fontSize: '11px' }}>{text}</code>
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString()
    }
  ]

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button icon={<SearchOutlined />} onClick={() => setIsSearchModalVisible(true)}>
          Search Protocols
        </Button>
        <Button type="primary" icon={<QrcodeOutlined />} onClick={() => {
          generateForm.resetFields()
          setQrImage(null)
          setIsGenerateModalVisible(true)
        }}>
          Generate QR Code
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={protocols.map(p => ({ ...p, key: p.id }))}
          pagination={{ pageSize: 20 }}
        />
      </Spin>

      {/* Search Modal */}
      <Modal
        title="Search QR Protocols"
        visible={isSearchModalVisible}
        onOk={() => searchForm.submit()}
        onCancel={() => setIsSearchModalVisible(false)}
      >
        <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
          <Form.Item label="Serial" name="serial">
            <Input placeholder="Search by serial" />
          </Form.Item>
          <Form.Item label="Bill No" name="billNo">
            <Input placeholder="Search by bill number" />
          </Form.Item>
          <Form.Item label="Barcode" name="barcode">
            <Input placeholder="Search by barcode" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Generate QR Modal */}
      <Modal
        title="Generate QR Code"
        visible={isGenerateModalVisible}
        onOk={() => generateForm.submit()}
        onCancel={() => setIsGenerateModalVisible(false)}
        width={700}
      >
        {qrImage ? (
          <div style={{ textAlign: 'center' }}>
            <h3>Generated QR Code</h3>
            <Image src={qrImage.image} width={300} />
            <p style={{ marginTop: 16 }}>
              <strong>Protocol:</strong> <code>{qrImage.protocol}</code>
            </p>
            <Button onClick={() => setQrImage(null)}>Generate Another</Button>
          </div>
        ) : (
          <Form form={generateForm} layout="vertical" onFinish={handleGenerateQR}>
            <Form.Item
              label="Serial"
              name="serial"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., TEA001" />
            </Form.Item>
            <Form.Item
              label="Bill No"
              name="billNo"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., 20240101001" />
            </Form.Item>
            <Form.Item
              label="Barcode"
              name="barcode"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., 1234567890" />
            </Form.Item>
            <Form.Item
              label="Flavors (comma-separated)"
              name="flavors"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., I001, S001, O001" />
            </Form.Item>
            <Form.Item
              label="SKU"
              name="sku"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="e.g., TEAL001" />
            </Form.Item>
            <Form.Item label="Quantity" name="quantity">
              <Input type="number" placeholder="1" />
            </Form.Item>
            <Form.Item label="Price" name="price">
              <Input type="number" placeholder="0.00" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  )
}
