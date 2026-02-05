import React, { useState, useEffect } from 'react'
import { Select, Input, Button, Spin } from 'antd'
import { qrProtocolAPI } from '../services/api.js'
import { POS_BUSINESS_ID } from '../config/constants.js'

export default function QRProtocol() {
  const [editingFormula, setEditingFormula] = useState('#{productCode}|#{optionCodes}')
  const [savedFormula, setSavedFormula] = useState('')
  const [parameters, setParameters] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Define valid parameters for QR formula
  const VALID_PARAMETERS = [
    {
      key: 'productCode',
      desc: 'Product code - Switch ON: uses configured product code. Switch OFF: uses raw product ID'
    },
    {
      key: 'optionCodes',
      desc: 'Option codes - Auto-populates all selected options, comma-separated (e.g., S1,B2,T3)'
    },
    {
      key: 'orderId',
      desc: 'Order ID - Unique order identifier from POS system'
    },
    {
      key: 'itemId',
      desc: 'Item ID - Sequence number for each item in the order'
    },
    {
      key: 'sku',
      desc: 'Product SKU - Product SKU code'
    }
  ];

  useEffect(() => {
    const loadFormula = async () => {
      try {
        setLoading(true)
        const response = await qrProtocolAPI.getFormula(POS_BUSINESS_ID)
        if (response.data.success) {
          const formula = response.data.data.formula
          setEditingFormula(formula)
          setSavedFormula(formula)
          setParameters(extractParameters(formula))
        }
      } catch (error) {
        console.error('Failed to load formula:', error)
        
      } finally {
        setLoading(false)
      }
    }

    loadFormula()
  }, [])

  /**
   * Extract all parameters from formula
   * @param {string} formula - QR formula string
   * @returns {object} - Object with parameter names as keys
   */
  const extractParameters = (formula) => {
    const params = {}

    const paramRegex = /#{([a-zA-Z_][a-zA-Z0-9_]*)}/g
    let match
    
    while ((match = paramRegex.exec(formula)) !== null) {
      const paramName = match[1]
      if (paramName) {
        params[paramName] = ''
      }
    }
    
    return params
  }

  const handleFormulaEdit = (value) => {
    setEditingFormula(value)
    setParameters(extractParameters(value))
  }

  /**
   * Save formula to backend
   * Backend will handle parameter normalization and validation
   */
  const handleSaveAndUse = async () => {
    if (!editingFormula.trim()) {
      return
    }
    
    try {
      setSaving(true)
      setSaveSuccess(false)
      setSaveError('')
      
      const response = await qrProtocolAPI.saveFormula(POS_BUSINESS_ID, editingFormula)
      
      if (response.data.success) {
        const normalizedFormula = response.data.data.formula
        setEditingFormula(normalizedFormula)
        setSavedFormula(normalizedFormula)
        setParameters(extractParameters(normalizedFormula))

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        // Handle error response from backend
        setSaveError(response.data.message || 'Failed to save formula')
        setTimeout(() => setSaveError(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save formula:', error)
      
      // Handle network or other errors
      const errorMessage = error.response?.data?.message || error.message || 'Network error'
      setSaveError(errorMessage)
      setTimeout(() => setSaveError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleParameterChange = (key, value) => {
    setParameters({
      ...parameters,
      [key]: value
    })
  }

  const handleGenerate = () => {
    if (!editingFormula.trim()) {
      return
    }
    const formula = editingFormula
    const paramRegex = /#{([^}]+)}/g
    let match
    const missingParams = []

    while ((match = paramRegex.exec(formula)) !== null) {
      const param = match[1]
      if (!parameters[param] || parameters[param].trim() === '') {
        missingParams.push(param)
      }
    }

    if (missingParams.length > 0) {
      return
    }

    let result = formula
    Object.entries(parameters).forEach(([key, value]) => {
      result = result.replace(new RegExp(`#{${key}}`, 'g'), value)
    })
  }

  const handleCopy = () => {
    if (generatedValue) {
      navigator.clipboard.writeText(generatedValue)
    }
  }

  const handleReset = () => {
    setParameters(extractParameters(editingFormula))
  }

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Spin tip="Loading formula..." />
        </div>
      ) : (
        <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>QR Format</h3>

        {/* Formula Editor */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
            Formula
          </label>
          <Input.TextArea
            value={editingFormula}
            onChange={(e) => handleFormulaEdit(e.target.value)}
            placeholder="e.g., ORD|#{productCode}|#{optionCodes}"
            rows={6}
            style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              padding: '12px'
            }}
          />
        </div>

        {/* Save and Use Button */}
        <Button
          type={saveSuccess ? 'primary' : saveError ? 'primary' : 'primary'}
          onClick={handleSaveAndUse}
          loading={saving}
          disabled={saving}
          style={{ 
            marginBottom: '20px',
            backgroundColor: saveSuccess ? '#52c41a' : saveError ? '#ff4d4f' : undefined,
            borderColor: saveSuccess ? '#52c41a' : saveError ? '#ff4d4f' : undefined,
            transition: 'all 0.3s ease',
            maxWidth: '100%'
          }}
          size="large"
        >
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : saveError ? `${saveError}` : 'Save and Use Formula'}
        </Button>

        {/* Available Parameters */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#333' }}>
            Available Parameters
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {VALID_PARAMETERS.map((param) => (
              <div key={param.key} style={{
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '11px',
                borderLeft: '3px solid #1890ff',
                lineHeight: '1.4'
              }}>
                <div style={{ fontWeight: '600', fontFamily: 'monospace', display: 'inline' }}>
                  #{'{' + param.key + '}'}
                </div>
                <div style={{ color: '#666', display: 'inline', marginLeft: '6px' }}>
                  {param.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Help & Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>How to Use</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Example Formulas */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>Example Formulas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ padding: '10px', background: '#f0f8ff', borderRadius: '4px', borderLeft: '3px solid #52c41a' }}>
                <div style={{ fontFamily: 'monospace', color: '#666', marginBottom: '4px' }}>
                  ORD|#{'{orderId}'}|#{'{productCode}'}|#{'{optionCodes}'}
                </div>
                <div style={{ color: '#999', fontSize: '11px' }}>
                  ORD|order123|P01|S1,B2,T3
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f0f8ff', borderRadius: '4px', borderLeft: '3px solid #52c41a' }}>
                <div style={{ fontFamily: 'monospace', color: '#666', marginBottom: '4px' }}>
                  =#{'{productCode}'}|#{'{optionCodes}'}
                </div>
                <div style={{ color: '#999', fontSize: '11px' }}>
                  =P01|S1,B2,T3
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f0f8ff', borderRadius: '4px', borderLeft: '3px solid #52c41a' }}>
                <div style={{ fontFamily: 'monospace', color: '#666', marginBottom: '4px' }}>
                  #{'{itemId}'}|#{'{orderId}'}|#{'{productCode}'}|#{'{optionCodes}'}|#{'{sku}'}
                </div>
                <div style={{ color: '#999', fontSize: '11px' }}>
                  item01|order123|P01|S1,B2,T3|sku123
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h4 style={{ margin: '50px 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#333' }}>Guidelines</h4>
            <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
              <li>Use <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '2px' }}>|</code> or <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '2px' }}>,</code> or <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '2px' }}>-</code> as delimiters</li>
              
              <li>All parameters in #{'{}'} will be replaced with actual values at runtime</li>
              <li>Parameter names are not case-sensitive</li>
              <li>Click "Save and Use Formula" to apply changes</li>
            </ul>
          </div>

          {/* Quick Tips */}
          {/* <div style={{ padding: '12px', background: '#fffbe6', borderRadius: '4px', borderLeft: '3px solid #faad14' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>💡 Quick Tips</div>
            <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
              <li>Start simple: use just <code style={{ background: '#f5f5f5', padding: '1px 4px', borderRadius: '2px' }}>#{'{orderId}'}</code> first</li>
              <li>Add delimiters to make QR codes more readable</li>
              <li>Test with the parameters shown in the left panel</li>
            </ul>
          </div> */}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
