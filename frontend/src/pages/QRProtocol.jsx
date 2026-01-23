import React, { useState } from 'react'
import { Select, Input, Button, message } from 'antd'

export default function QRProtocol() {
  // 模板列表 - 本地数据
  const [templates, setTemplates] = useState([
    {
      id: 'current_in_use',
      name: 'Current in Use',
      formula: 'ORD|#{productCode}|#{flavorCodes}'
    },
    {
      id: 'template_1',
      name: 'ORD|#{productCode}|#{flavorCode1},{#flavorCode2}',
      formula: 'ORD|#{productCode}|#{flavorCodes}'
    },
    {
      id: 'template_2',
      name: '=A01|C02,T04,W02',
      formula: '=#{productCode}|#{flavorCodes}'
    },
    {
      id: 'template_3',
      name: 'product | Size | Sugar, Ice | Toppings',
      formula: '#{productCode}|#{"-YourSizeGroupName"}|#{"-YourSugarGroupName"},#{"-YourIceGroupName"}|#{"-YourToppingsGroupName"}'
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState('current_in_use')
  const [editingFormula, setEditingFormula] = useState(templates[0].formula)
  const [parameters, setParameters] = useState({})
  const [savedFormula, setSavedFormula] = useState(templates[0].formula)

  // 规范化参数名 - 将参数名统一为驼峰命名法（不分大小写匹配）
  const normalizeParamName = (name) => {
    const lowerName = name.toLowerCase()
    
    if (lowerName === 'productcode') {
      return 'productCode'
    } else if (lowerName === 'flavorcode' || lowerName === 'flavorcodes') {
      return 'flavorCodes'
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

  // 从公式中提取参数 - 支持三种格式：#{paramName} 或 #{"Param Name"} 或 #{'Param Name'}
  const extractParameters = (formula) => {
    const params = {}
    
    // 三种独立的格式：
    // 1. #{identifier} - 标识符（字母数字下划线）
    // 2. #{"any text"} - 双引号包围的文本
    // 3. #{'any text'} - 单引号包围的文本
    const paramRegex = /#{([a-zA-Z_][a-zA-Z0-9_]*)}|#{"([^"]+)"}|#{'([^']+)'}/g
    let match
    
    while ((match = paramRegex.exec(formula)) !== null) {
      // match[1] 是标识符格式的参数
      // match[2] 是双引号格式的参数
      // match[3] 是单引号格式的参数
      const paramName = match[1] || match[2] || match[3]
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
      message.success(`Loaded template: ${template.name}`)
    }
  }

  const handleFormulaEdit = (value) => {
    setEditingFormula(value)
    setParameters(extractParameters(value))
  }

  const handleSaveAndUse = () => {
    if (!editingFormula.trim()) {
      message.error('Please enter a formula')
      return
    }
    
    // 自动纠正公式中的参数名
    const correctedFormula = autoCorrectFormula(editingFormula)
    
    // 更新 "Current in Use" 模板
    const updatedTemplates = templates.map(t => 
      t.id === 'current_in_use' 
        ? { ...t, formula: correctedFormula }
        : t
    )
    setTemplates(updatedTemplates)
    
    // 更新编辑框和已保存公式
    setEditingFormula(correctedFormula)
    setSavedFormula(correctedFormula)
    setParameters(extractParameters(correctedFormula))
    
    if (correctedFormula !== editingFormula) {
      message.success('Formula auto-corrected and saved to "Current in Use"!')
    } else {
      message.success('Formula saved to "Current in Use"!')
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
      message.error('Please enter a formula')
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
      message.error(`Please fill in: ${missingParams.join(', ')}`)
      return
    }

    // 生成最终值
    let result = formula
    Object.entries(parameters).forEach(([key, value]) => {
      result = result.replace(new RegExp(`#{${key}}`, 'g'), value)
    })

    message.success('Generated successfully!')
  }

  const handleCopy = () => {
    if (generatedValue) {
      navigator.clipboard.writeText(generatedValue)
      message.success('Copied to clipboard!')
    }
  }

  const handleReset = () => {
    setParameters(extractParameters(editingFormula))
  }

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      {/* Template Designer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white', padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>QR Code Template Designer</h3>

        {/* Template Selection */}
        <div style={{ marginBottom: '20px' }}>
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
        </div>

        {/* Formula Editor */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
            Formula (editable)
          </label>
          <Input.TextArea
            value={editingFormula}
            onChange={(e) => handleFormulaEdit(e.target.value)}
            placeholder="Enter formula, e.g., ORD|#{barcode}|#{flavorCodes}"
            rows={4}
            style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              padding: '12px'
            }}
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            Use #{'{paramName}'} or #{"{'param name}'"} for parameters. Supports both unquoted and quoted option group names.
          </div>
        </div>

        {/* Save and Use Button */}
        <Button
          type="primary"
          onClick={handleSaveAndUse}
          style={{ marginBottom: '20px' }}
          size="large"
        >
          Save and Use Formula
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
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Parameter Formats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{productCode}'}</span> - Fixed system parameter (auto-corrects case)
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <span style={{ fontWeight: '600' }}>#{'{optionName}'}</span> - Identifier parameters (auto-corrects case)
              </div>
              <div style={{ padding: '8px', background: '#fff3cd', borderRadius: '4px', borderLeft: '3px solid #ffc107' }}>
                <span style={{ fontWeight: '600' }}>#{'"Size"'}</span> - Placeholder for your option group name<br/>
                <span style={{ fontSize: '11px', color: '#666' }}>Replace with your actual option group name, e.g. #{'"CupSize"'}</span>
              </div>
            </div>
          </div>

          {/* Separator Info */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Common Use Cases</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontFamily: 'monospace' }}>
                <strong>Pospal:</strong> =#{'{productCode}'}|#{'{flavorCode1}'},#{'{flavorCode2}'}
              </div>
              <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontFamily: 'monospace' }}>
                <strong>Milk Tea Machine:</strong> #{'{productCode}'}|#{'"Size"'}|#{'"sugar level"'},#{'"Ice level"'}|#{'"Toppings"'}
              </div>
            </div>
          </div>

          {/* Example */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>Example: How to Use</h4>
            <div style={{ padding: '12px', background: '#f0f8ff', borderRadius: '6px', fontSize: '12px', color: '#333', lineHeight: '1.8' }}>
              <strong>Original Template:</strong><br/>
              <span style={{ fontFamily: 'monospace', color: '#666' }}>
                #{'{productCode}'}|#{'"Size"'}|#{'"Sugar level"'},#{'"Ice level"'}|#{'"Toppings"'}
              </span>
              <br/><br/>
              
              <strong>Your System Option Groups:</strong><br/>
              Size → <span style={{ fontFamily: 'monospace', background: '#e8f4f8', padding: '2px 6px' }}>"CupSize"</span><br/>
              Sugar level → <span style={{ fontFamily: 'monospace', background: '#e8f4f8', padding: '2px 6px' }}>"甜度"</span><br/>
              Ice level → <span style={{ fontFamily: 'monospace', background: '#e8f4f8', padding: '2px 6px' }}>"冰度"</span><br/>
              Toppings → <span style={{ fontFamily: 'monospace', background: '#e8f4f8', padding: '2px 6px' }}>"配料"</span><br/>
              <br/>
              
              <strong>Modified Template (paste your group names):</strong><br/>
              <span style={{ fontFamily: 'monospace', color: '#666' }}>
                #{'{productCode}'}|#{'"CupSize"'}|#{'"甜度"'},#{'"冰度"'}|#{'"配料"'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
