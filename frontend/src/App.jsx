import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { AppstoreOutlined, LogoutOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import OptionsManagement from './pages/OptionsManagement'

const { Header, Sider, Content, Footer } = Layout

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('posToken')
    if (savedToken) {
      setIsLoggedIn(true)
      setToken(savedToken)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('posToken')
    localStorage.removeItem('posEmail')
    setIsLoggedIn(false)
    setToken(null)
  }

  const handleLoginSuccess = (newToken) => {
    setToken(newToken)
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={200} theme="dark">
          <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
            <h2>Miketea</h2>
          </div>
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['options']}>
            <Menu.Item key="options" icon={<AppstoreOutlined />}>
              <Link to="/options">Options Management</Link>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0 }}>Milk Tea Machine Integration</h1>
            <span style={{ fontSize: 12, color: '#666' }}>
              Logged in as: {localStorage.getItem('posEmail')}
            </span>
          </Header>
          <Content style={{ margin: '24px' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/options" />} />
              <Route path="/options" element={<OptionsManagement />} />
              <Route path="*" element={<Navigate to="/options" />} />
            </Routes>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Miketea Machine Integration System ©2024
          </Footer>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App
