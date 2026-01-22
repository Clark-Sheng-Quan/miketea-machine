import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Spin } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { posAuthAPI } from '../services/api'

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleLogin = async (values) => {
    try {
      setLoading(true)
      const response = await posAuthAPI.login(values.email, values.password)
      
      // Save token to localStorage
      const token = response.data.data?.token || response.data.data?.access_token
      if (token) {
        localStorage.setItem('posToken', token)
        localStorage.setItem('posEmail', values.email)
        message.success('Login successful!')
        
        // Call parent callback
        onLoginSuccess && onLoginSuccess(token)
      } else {
        message.error('No token received from server')
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1>🍵 Miketea</h1>
          <p>Integration System Login</p>
        </div>

        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your email"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
          POS System Integration
        </p>
      </Card>
    </div>
  )
}
