import React, { useState } from 'react'
import './MilkTeaLayout.css'
import OptionsManagement from '../pages/OptionsManagement'
import QRProtocol from '../pages/QRProtocol'

export default function MilkTeaLayout() {
  const [activeTab, setActiveTab] = useState('flavor-code')

  const handleLogout = () => {
    localStorage.removeItem('posToken')
    localStorage.removeItem('posEmail')
    window.location.reload()
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1 1 0%' }}>
        <div className="hide-scroll" style={{ overflowY: 'auto', maxHeight: '100%', position: 'relative', scrollbarWidth: 'none' }}>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ flex: '1 1 0%' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex' }}>
                {/* Left Sidebar */}
                <div id="Portal_RightTab_333" className="Styling_ManagemntTab" style={{ height: '100%', zIndex: 11, background: 'rgb(245, 245, 249)', paddingTop: '23px' }}>
                  <div className="hide-scroll" style={{ overflowY: 'auto', maxHeight: '100%', position: 'relative', scrollbarWidth: 'none' }}>
                    <div style={{ padding: '15px', background: 'rgb(42, 36, 56)', marginBottom: '17px', borderRadius: '0px', boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 6px' }}>
                      <div style={{ width: '100%', color: 'white', fontSize: '15px', fontWeight: '650', padding: '0px', margin: '0px' }}>
                        MilkTea Module
                      </div>
                    </div>

                    <div style={{ padding: '0 15px' }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', marginBottom: '10px', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px' }}>
                        {localStorage.getItem('posEmail')}
                      </div>
                      <button onClick={handleLogout} className="logout-btn" style={{
                        width: '100%',
                        padding: '10px',
                        marginTop: '12px',
                        background: 'rgba(255, 59, 48, 0.2)',
                        color: '#ff3b30',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Container */}
                <div id="RightContainerBackend" className="Styling_RightManagement" style={{ overflow: 'hidden', background: 'rgb(245, 245, 249)', flex: '1 1 0%', width: 'auto' }}>
                  <div className="hide-scroll" style={{ overflowY: 'auto', maxHeight: '100%', position: 'relative', scrollbarWidth: 'none' }}>
                    {/* Management Container - with padding */}
                    <div id="managementContainer_32" className="Styling_managentContainer" style={{ marginBottom: '10vh', gap: '20px', padding: '20px' }}>
                      {/* Navigation - inside managementContainer_32 with sticky */}
                      <div style={{ width: '100%', position: 'sticky', top: 0, zIndex: 5 }}>
                        <div className="Styling_NavigationContainer" style={{ minHeight: '50px', display: 'flex', alignItems: 'center', background: 'white', borderBottom: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px' }}>
                          <div style={{ display: 'flex', minHeight: '60px', gap: 0, paddingRight: '30px' }}>
                            {['Flavor Code', 'QR Protocol'].map((tab, idx) => (
                              <div
                                key={idx}
                                className={`Styling_item_Container ${idx === 0 ? (activeTab === 'flavor-code' ? 'active' : '') : (activeTab === 'qr-protocol' ? 'active' : '')}`}
                                onClick={() => setActiveTab(idx === 0 ? 'flavor-code' : 'qr-protocol')}
                                style={{
                                  fontSize: '15px',
                                  background: 'white',
                                  border: '0.1px solid rgba(0, 0, 0, 0.1)',
                                  padding: '12px 20px',
                                  cursor: 'pointer',
                                  borderBottom: activeTab === (idx === 0 ? 'flavor-code' : 'qr-protocol') ? '3px solid #007aff' : 'none',
                                  transition: 'all 0.2s',
                                  color: activeTab === (idx === 0 ? 'flavor-code' : 'qr-protocol') ? '#000' : '#888',
                                  fontWeight: activeTab === (idx === 0 ? 'flavor-code' : 'qr-protocol') ? '600' : '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {tab}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Content - inside managementContainer_32 */}
                      <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        {activeTab === 'flavor-code' && <OptionsManagement />}
                        {activeTab === 'qr-protocol' && <QRProtocol />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
