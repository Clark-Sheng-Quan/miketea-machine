import React, { useState, useEffect } from 'react'
import { Spin, message, Button } from 'antd'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { posAuthAPI, itemCodesAPI } from '../services/api'
import { POS_BUSINESS_ID } from '../config/constants'

export default function OptionsManagement() {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedOptionId, setExpandedOptionId] = useState(null)
  const [itemCodes, setItemCodes] = useState({}) // { 'itemId': 'code' }

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

  const handleSave = async () => {
    try {
      // Convert itemCodes state to array format for API
      const itemCodesArray = currentOption.option_items.map(item => ({
        optionId: currentOption._id,
        optionItemId: item._id,
        code: itemCodes[item._id] || ''
      }));

      // Filter out empty codes
      const validCodes = itemCodesArray.filter(item => item.code.trim() !== '');

      if (validCodes.length === 0) {
        message.warning('No codes to save');
        return;
      }

      const response = await itemCodesAPI.save(POS_BUSINESS_ID, validCodes);
      
      if (response.data.success) {
        message.success(`Saved ${validCodes.length} item codes`);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save item codes');
      console.error(error);
    }
  }

  const currentOption = expandedOptionId ? options.find(opt => opt._id === expandedOptionId) : null

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Left: Options List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white' }}>
            {options.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No options found
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option._id}
                  onClick={() => setExpandedOptionId(expandedOptionId === option._id ? null : option._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: expandedOptionId === option._id ? '#f5f7fa' : 'white',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = expandedOptionId === option._id ? '#f5f7fa' : '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = expandedOptionId === option._id ? '#f5f7fa' : 'white'}
                >
                  <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>
                    {option.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {option.option_items?.length || 0} items
                  </span>
                  <span style={{ fontSize: '16px', color: '#666' }}>
                    {expandedOptionId === option._id ? '▼' : '▶'}
                  </span>
                </div>
              ))
            )}
          </div>
        </Spin>
      </div>

      {/* Right: Items Detail Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', minHeight: 0 }}>
        {currentOption ? (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {currentOption.name} Items
              </h3>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                size="small"
              >
                Save
              </Button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {currentOption.option_items && currentOption.option_items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentOption.option_items.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '12px',
                        background: '#f5f5f5',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          ID: {item._id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#666', fontWeight: '500', whiteSpace: 'nowrap' }}>
                          Code:
                        </label>
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={itemCodes[item._id] || ''}
                          onChange={(e) => setItemCodes({
                            ...itemCodes,
                            [item._id]: e.target.value
                          })}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid #d0d0d0',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '120px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
                  No items in this option
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: '#999', minHeight: 0, paddingTop: '60px' }}>
            Select an option from the left to edit item codes
          </div>
        )}
      </div>
    </div>
  )
}
