import React, { useState, useEffect } from 'react'
import { Select, Input, Button, Spin } from 'antd'
import { qrProtocolAPI } from '../services/api.js'
import { POS_BUSINESS_ID } from '../config/constants.js'

export default function QRProtocol() {
  // 模板列表 - 本地数据
  const [templates, setTemplates] = useState([
    {
      id: 'current_in_use',
      name: 'Current in Use',
      formula: 'ORD|#{productCode}|#{optionCodes}'
    },
    {
      id: 'template_1',
      name: 'ORD|#{productCode}|#{optionCode},#{optionCode}',
      formula: 'ORD|#{productCode}|#{optionCode},#{optionCode}'
    },
    {
      id: 'template_2',
      name: '=A01|C02,T04,W02',
      formula: '=#{productCode}|#{optionCodes}'
    },
    {
      id: 'template_3',
      name: 'product | Size | Sugar, Ice | Toppings',
      formula: '#{productCode}|#{Size}|#{SugarLevel},#{IceLevel}|#{Toppings}'
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState('current_in_use')
  const [editingFormula, setEditingFormula] = useState('ORD|#{productCode}|#{optionCode},#{optionCode}')
  const [parameters, setParameters] = useState({})
  const [savedFormula, setSavedFormula] = useState('ORD|#{productCode}|#{optionCode},#{optionCode}')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 页面加载时从数据库获取公式
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

  // 规范化参数名 - 将参数名统一为驼峰命名法（不分大小写匹配）
  const normalizeParamName = (name) => {
    const lowerName = name.toLowerCase()
    
    if (lowerName === 'productcode') {
      return 'productCode'
    } else if (lowerName === 'optioncode' || lowerName === 'optioncodes') {
      return 'optionCodes'
    } else if (lowerName === 'timestamp') {
      return 'timestamp'
    }
    
    return name
  }

  // 自动纠正公式中的参数名大小写 - 只纠正 #{identifier} 格式，不纠正引号格式的选项组名
  const autoCorrectFormula = (formula) => {
    let correctedFormula = formula
    
    // 只匹配标识符格式的参数：#{identifier}
    const paramRegex = /#{([a-zA-Z_][a-zA-Z0-9_]*)}/g
    let match
    
    while ((match = paramRegex.exec(formula)) !== null) {
      const originalParam = match[1]
      const correctedParam = normalizeParamName(originalParam)
      
      if (originalParam !== correctedParam) {
        correctedFormula = correctedFormula.replace(
          new RegExp(`#{${originalParam}}`, 'g'),
          `#{${correctedParam}}`
        )
      }
    }
    
    return correctedFormula
  }

  // 从公式中提取参数 - 支持 #{identifier} 格式
  const extractParameters = (formula) => {
    const params = {}
    
    // 匹配标识符格式的参数：#{identifier}
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

  const handleTemplateChange = (value) => {
    setSelectedTemplate(value)
  }

  const handleLoadTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (template) {
      setEditingFormula(template.formula)
      setParameters(extractParameters(template.formula))
    }
  }

  // const handleTemplateChange = (value) => {
  //   setSelectedTemplate(value)
  // }

  // const handleLoadTemplate = () => {
  //   const template = templates.find(t => t.id === selectedTemplate)
  //   if (template) {
  //     setEditingFormula(template.formula)
  //     setParameters(extractParameters(template.formula))
  //     message.success(`Loaded template: ${template.name}`)
  //   }
  // }

  const handleFormulaEdit = (value) => {
    setEditingFormula(value)
    setParameters(extractParameters(value))
  }

  const handleSaveAndUse = async () => {
    if (!editingFormula.trim()) {
      return
    }
    
    // 自动纠正公式中的参数名
    const correctedFormula = autoCorrectFormula(editingFormula)
    
    try {
      setSaving(true)
      
      // 保存到数据库
      const response = await qrProtocolAPI.saveFormula(POS_BUSINESS_ID, correctedFormula)
      
      if (response.data.success) {
        // 更新编辑框和已保存公式
        setEditingFormula(correctedFormula)
        setSavedFormula(correctedFormula)
        setParameters(extractParameters(correctedFormula))
        
      }
    } catch (error) {
      console.error('Failed to save formula:', error)

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

    // 检查是否所有必需参数都填写了
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

    // 生成最终值
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
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>QR Code Formula</h3>

       
        {/* <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
            Select Template
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              style={{ flex: 1 }}
              options={templates.map(t => ({
                value: t.id,
                label: t.name
              }))}
            />
            <Button
              onClick={handleLoadTemplate}
              style={{ minWidth: '80px' }}
            >
              Load
            </Button>
          </div>
        </div> */}

        {/* Formula Editor */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
            Formula
          </label>
          <Input.TextArea
            value={editingFormula}
            onChange={(e) => handleFormulaEdit(e.target.value)}
            placeholder="Enter formula, e.g., ORD|#{productCode}|#{optionCodes}"
            rows={4}
            style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              padding: '12px'
            }}
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            Use #{'{paramName}'} for parameters. All parameters use camelCase identifiers.
          </div>
        </div>

        {/* Save and Use Button */}
        <Button
          type="primary"
          onClick={handleSaveAndUse}
          loading={saving}
          disabled={saving}
          style={{ marginBottom: '20px' }}
          size="large"
        >
          {saving ? 'Saving...' : 'Save and Use Formula'}
        </Button>


        {/* Parameters Display */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#333' }}>
            Template Parameters
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(parameters).length > 0 ? (
              Object.keys(parameters).map((key) => (
                <div key={key} style={{
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#333',
                  border: '1px solid #e0e0e0'
                }}>
                  #{'{' + key + '}'} - {key}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12px', color: '#999' }}>
                No parameters detected in template
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help & Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Format Guide</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Format Info */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Available Parameters</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{productCode}'}</span> - Switch ON: use configured code | Switch OFF: use raw product ID
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{optionCodes}'}</span> - Auto-fills all selected options, comma-separated (e.g., S1,B2,T3)
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{orderId}'}</span> - Order ID
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{itemId}'}</span> - Item ID (Sequel number)
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{sku}'}</span> - SKU (Stock Keeping Unit)
              </div>
            </div>
          </div>

          {/* Example */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Example: How to Use</h4>
            <div style={{ padding: '12px', background: '#f0f8ff', borderRadius: '6px', fontSize: '12px', color: '#333', lineHeight: '1.8' }}>
              <strong>Example Formulas:</strong><br/>
              <span style={{ fontFamily: 'monospace', color: '#666' }}>
                #{'{orderId}'}|#{'{itemId}'}|#{'{sku}'}
              </span>
              <br/>
              <span style={{ fontFamily: 'monospace', color: '#666' }}>
                #{'{productCode}'}|#{'{optionCodes}'}
              </span>
              <br/>
              <span style={{ fontFamily: 'monospace', color: '#666' }}>
                #{'{sku}'}-#{'{itemId}'}
              </span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
