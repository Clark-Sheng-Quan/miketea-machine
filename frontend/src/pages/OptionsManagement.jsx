import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Spin, message, Drawer, List } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { posAuthAPI } from '../services/api'
import { POS_BUSINESS_ID } from '../config/constants'

export default function OptionsManagement() {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

  const loadOptions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('posToken')
      if (!token) {
        message.error('Token not found. Please login again.')
        return
      }

      const response = await posAuthAPI.getOptions(token, POS_BUSINESS_ID)
      const optionsData = response.data.data?.option || response.data.data || [];
      
      setOptions(optionsData);
      message.success(`Loaded ${optionsData.length} options`);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load options')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOptions()
  }, [])

  const columns = [
    {
      title: 'Option Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => {
            setSelectedOption(record);
            setDrawerVisible(true);
          }}
        >
          View Items
        </Button>
      )
    }
  ]

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={loadOptions}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={options.map(opt => ({ ...opt, key: opt._id }))}
          pagination={{ pageSize: 20 }}
        />
      </Spin>

      {/* Item List Drawer */}
      <Drawer
        title={selectedOption?.name}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedOption?.option_items && selectedOption.option_items.length > 0 ? (
          <List
            dataSource={selectedOption.option_items}
            renderItem={(item) => (
              <List.Item key={item._id}>
                {item.name}
              </List.Item>
            )}
          />
        ) : (
          <p>No items found</p>
        )}
      </Drawer>
    </Card>
  )
}
