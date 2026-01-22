import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import { flavorAPI } from '../services/api'

export default function FlavorManagement() {
  const [flavors, setFlavors] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const loadFlavors = async () => {
    try {
      setLoading(true)
      const res = await flavorAPI.getAll()
      setFlavors(res.data.data)
    } catch (error) {
      message.error('Failed to load flavors')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      if (editingId) {
        await flavorAPI.update(editingId, values)
        message.success('Flavor updated')
      } else {
        await flavorAPI.create(values)
        message.success('Flavor created')
      }
      setIsModalVisible(false)
      form.resetFields()
      setEditingId(null)
      loadFlavors()
    } catch (error) {
      message.error(error.response?.data?.error || 'Operation failed')
    }
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      flavor_code: record.flavor_code,
      flavor_name: record.flavor_name,
      group_name: record.group_name
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await flavorAPI.delete(id)
      message.success('Flavor deleted')
      loadFlavors()
    } catch (error) {
      message.error('Delete failed')
    }
  }

  const handleSync = async () => {
    try {
      message.loading('Syncing from Product System...')
      const res = await flavorAPI.sync()
      message.success(`Synced ${res.data.data.synced} flavors`)
      loadFlavors()
    } catch (error) {
      message.error('Sync failed')
    }
  }

  useEffect(() => {
    loadFlavors()
  }, [])

  const columns = [
    {
      title: 'Flavor Code',
      dataIndex: 'flavor_code',
      key: 'flavor_code',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Flavor Name',
      dataIndex: 'flavor_name',
      key: 'flavor_name'
    },
    {
      title: 'Group',
      dataIndex: 'group_name',
      key: 'group_name'
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: 'Delete Flavor',
              content: 'Are you sure?',
              okText: 'Yes',
              cancelText: 'No',
              onOk: () => handleDelete(record.id)
            })
          }} />
        </Space>
      )
    }
  ]

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingId(null)
          form.resetFields()
          setIsModalVisible(true)
        }}>
          Add Flavor
        </Button>
        <Button icon={<SyncOutlined />} onClick={handleSync}>
          Sync from Product System
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={flavors.map(f => ({ ...f, key: f.id }))}
          pagination={{ pageSize: 20 }}
        />
      </Spin>

      <Modal
        title={editingId ? 'Edit Flavor' : 'Add Flavor'}
        visible={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setEditingId(null)
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Flavor Code"
            name="flavor_code"
            rules={[{ required: !editingId, message: 'Required' }]}
          >
            <Input disabled={!!editingId} placeholder="e.g., I001" />
          </Form.Item>
          <Form.Item
            label="Flavor Name"
            name="flavor_name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Ice" />
          </Form.Item>
          <Form.Item
            label="Group Name"
            name="group_name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select placeholder="Select group">
              <Select.Option value="Temperature">Temperature</Select.Option>
              <Select.Option value="Sugar">Sugar</Select.Option>
              <Select.Option value="Toppings">Toppings</Select.Option>
              <Select.Option value="Flavor">Flavor</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
