import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Switch, message, Space, Spin, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { templateAPI } from '../services/api'

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const res = await templateAPI.getAll()
      setTemplates(res.data.data)
    } catch (error) {
      message.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      if (editingId) {
        await templateAPI.update(editingId, values)
        message.success('Template updated')
      } else {
        await templateAPI.create(values)
        message.success('Template created')
      }
      setIsModalVisible(false)
      form.resetFields()
      setEditingId(null)
      loadTemplates()
    } catch (error) {
      message.error(error.response?.data?.error || 'Operation failed')
    }
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      template_pattern: record.template_pattern,
      description: record.description,
      is_active: record.is_active
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await templateAPI.delete(id)
      message.success('Template deleted')
      loadTemplates()
    } catch (error) {
      message.error('Delete failed')
    }
  }

  const handleActivate = async (id) => {
    try {
      await templateAPI.activate(id)
      message.success('Template activated')
      loadTemplates()
    } catch (error) {
      message.error('Activation failed')
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Template Pattern',
      dataIndex: 'template_pattern',
      key: 'template_pattern',
      render: (text) => <code style={{ fontSize: '12px' }}>{text}</code>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => active ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!record.is_active && (
            <Button type="default" size="small" icon={<CheckOutlined />} onClick={() => handleActivate(record.id)}>
              Activate
            </Button>
          )}
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: 'Delete Template',
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
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingId(null)
          form.resetFields()
          setIsModalVisible(true)
        }}>
          Add Template
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={templates.map(t => ({ ...t, key: t.id }))}
          pagination={{ pageSize: 20 }}
        />
      </Spin>

      <Modal
        title={editingId ? 'Edit Template' : 'Add Template'}
        visible={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setEditingId(null)
        }}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Template Name"
            name="name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Default Protocol" />
          </Form.Item>
          <Form.Item
            label="Template Pattern"
            name="template_pattern"
            rules={[{ required: true, message: 'Required' }]}
            help="Use placeholders: {serial}, {billNo}, {barcode}, {flavors}, {sku}, {quantity}, {price}"
          >
            <Input.TextArea rows={3} placeholder="{serial}|{billNo}|{barcode}|{flavors}|{sku}" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={2} placeholder="Template description" />
          </Form.Item>
          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
