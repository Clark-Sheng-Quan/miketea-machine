import React from 'react'
import OptionsManagement from '../pages/OptionsManagement'
import QRProtocol from '../pages/QRProtocol'
import ProductCodeManagement from '../pages/ProductCodeManagement'

/**
 * MilkTea Widget - Content only, no sidebar, no navigation
 * Used for integration into company POS website
 * 
 * Company website is responsible for:
 * - Left sidebar navigation
 * - Top tab switching
 * - User logout and session management
 * 
 * @param {string} activeTab - Current active tab: 'option-code', 'product-code', 'qr-protocol'
 * @returns {JSX.Element} Widget content component
 */
export default function MilkTeaWidget({ activeTab = 'option-code' }) {
  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: 0, 
      background: 'rgb(245, 245, 249)', 
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Content only - No sidebar, no tab navigation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'option-code' && <OptionsManagement />}
        {activeTab === 'product-code' && <ProductCodeManagement />}
        {activeTab === 'qr-protocol' && <QRProtocol />}
      </div>
    </div>
  )
}
