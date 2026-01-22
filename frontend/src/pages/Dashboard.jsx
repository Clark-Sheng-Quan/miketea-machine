import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Button, Spin, message } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { adminAPI, flavorAPI } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsRes, healthRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getHealth()
      ])
      setStats(statsRes.data.data)
      setHealth(healthRes.data)
    } catch (error) {
      message.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      message.loading('Syncing flavors...')
      const res = await flavorAPI.sync()
      message.success(`Synced ${res.data.data.synced} flavors`)
      loadDashboard()
    } catch (error) {
      message.error('Sync failed')
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }} />
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>System Overview</h2>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={handleSync}
          >
            Sync Flavors
          </Button>
        </div>
      </Card>

      <Row gutter={24}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Flavors"
              value={stats?.totalFlavors || 0}
              prefix="🍵"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="QR Templates"
              value={stats?.totalTemplates || 0}
              prefix="📋"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Generated Protocols"
              value={stats?.totalProtocols || 0}
              prefix="📱"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="System Status"
              value={health?.status || 'Unknown'}
              prefix={health?.status === 'healthy' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      {stats?.recentProtocols && stats.recentProtocols.length > 0 && (
        <Card style={{ marginTop: 24 }}>
          <h3>Recent QR Protocols</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Serial</th>
                <th>Bill No</th>
                <th>SKU</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProtocols.map(p => (
                <tr key={p.id}>
                  <td>{p.serial}</td>
                  <td>{p.bill_no}</td>
                  <td>{p.sku}</td>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
