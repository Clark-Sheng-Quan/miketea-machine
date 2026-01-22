docker run -d \
  -e POSTGRES_DB=miketea_machine \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  --name miketea-postgres \
  postgres:15-alpine
  
# Milk Tea Machine Integration Module

完整的奶茶机器集成模块，包括后端集成服务器和Web管理后台，用于POS系统联动。

## 项目结构

```
miketea-machine/
├── backend/                 # Node.js + Express 后端
│   ├── src/
│   │   ├── config/         # 数据库配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   ├── routes/         # API路由
│   │   └── index.js        # 应用入口
│   ├── migrations/         # 数据库迁移
│   ├── package.json
│   └── .env.example
├── frontend/               # React + Vite 管理后台
│   ├── src/
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## 功能模块

### 1. 后端模块

#### 口味同步模块 (Flavor Synchronization)
- 从产品系统获取所有产品
- 自动提取选项和选项项（口味）
- 去重和合并口味组
- 维护统一的口味数据库
- 定时自动同步

#### 口味代码管理 (Flavor Code Management)
- 生成稳定的口味代码 (I001, S001, T001等)
- 即使名称更改也保持代码不变
- 提供POS端口味代码列表
- 后端编辑口味名称和代码

#### 模板管理 (Template Management)
- 存储和更新QR协议模板
- 支持占位符: {serial}, {billNo}, {barcode}, {flavors}, {sku}, {quantity}, {price}
- 验证模板结构
- 为QR生成引擎提供模板

#### QR协议生成 (QR Protocol Generation)
- 接收POS订单数据
- 替换模板占位符
- 格式化口味代码
- 返回最终的QR协议字符串

#### POS集成 (POS Integration)
- 提供POS端口味代码列表
- 提供QR生成端点
- 向POS隐藏协议逻辑
- 保证向后兼容性

### 2. 前端模块

#### 仪表板 (Dashboard)
- 系统统计信息
- 最近生成的协议
- 一键同步口味

#### 口味管理 (Flavor Management)
- 查看所有口味
- 创建新口味
- 编辑口味信息
- 删除口味
- 从产品系统同步

#### 模板管理 (Template Management)
- 查看所有模板
- 创建自定义模板
- 编辑模板
- 删除模板
- 激活/停用模板

#### QR协议 (QR Protocol)
- 生成QR码
- 搜索历史协议
- 查看协议详情

## 快速开始

### 前提条件
- Node.js 16+
- PostgreSQL 12+

### 安装步骤

#### 1. 后端安装

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 配置数据库
npm run db:migrate
npm run db:seed
npm start
```

后端将运行在 `http://localhost:3000`

#### 2. 前端安装

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 `http://localhost:3001`

## API文档

### POS集成端点

#### 获取口味列表
```
GET /api/pos/flavors

Response:
{
  "success": true,
  "data": [
    {
      "flavor_code": "I001",
      "flavor_name": "Ice",
      "group_name": "Temperature"
    },
    ...
  ]
}
```

#### 生成QR协议
```
POST /api/pos/generate-qr

Request:
{
  "serial": "TEA001",
  "billNo": "20240101001",
  "barcode": "1234567890",
  "flavors": ["I001", "S001", "O001"],
  "sku": "TEAL001",
  "quantity": 1,
  "price": 5.99
}

Response:
{
  "success": true,
  "protocol": "{serial}|{billNo}|{barcode}|I001,S001,O001|TEAL001",
  "qrData": {...}
}
```

#### 生成QR图像
```
POST /api/pos/generate-qr-image

Request:
{
  "protocol_string": "{protocol_string}"
}

Response:
{
  "success": true,
  "qrImage": "data:image/png;base64,..."
}
```

### 管理端点

#### 获取统计信息
```
GET /api/admin/stats

Response:
{
  "success": true,
  "data": {
    "totalFlavors": 10,
    "totalTemplates": 2,
    "totalProtocols": 100,
    "recentProtocols": [...]
  }
}
```

#### 系统健康检查
```
GET /api/admin/health

Response:
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```

## 数据库Schema

### flavors表
```sql
CREATE TABLE flavors (
  id UUID PRIMARY KEY,
  flavor_code VARCHAR(20) UNIQUE,
  flavor_name VARCHAR(255),
  group_name VARCHAR(100),
  product_system_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### qr_templates表
```sql
CREATE TABLE qr_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  template_pattern TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### qr_protocols表
```sql
CREATE TABLE qr_protocols (
  id UUID PRIMARY KEY,
  serial VARCHAR(255),
  bill_no VARCHAR(255),
  barcode VARCHAR(255),
  flavors TEXT,
  sku VARCHAR(255),
  quantity INTEGER,
  price DECIMAL(10, 2),
  protocol_string TEXT,
  template_id UUID,
  created_at TIMESTAMP
);
```

## 环境变量配置

参见 `backend/.env.example`

关键配置:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL连接
- `PRODUCT_SYSTEM_API_URL`: 产品系统API地址
- `PRODUCT_SYSTEM_API_KEY`: 产品系统API密钥
- `FLAVOR_SYNC_INTERVAL`: 口味同步间隔（毫秒）
- `FLAVOR_SYNC_ENABLED`: 是否启用自动同步

## 开发建议

1. **口味同步**: 首次运行后端时，会自动同步产品系统中的口味
2. **模板管理**: 至少创建一个活跃模板才能生成QR协议
3. **API密钥**: 生产环境中请修改.env文件中的敏感信息
4. **数据库备份**: 定期备份PostgreSQL数据库

## 未来扩展

- 机器状态监控
- 错误报告系统
- 自动分配集成
- 实时订单跟踪
- 通知和告警系统

## License

MIT
