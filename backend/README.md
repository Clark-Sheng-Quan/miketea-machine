# 🔧 Milk Tea Machine Integration - Backend

Node.js + Express backend API for milk tea machine integration with POS system. PostgreSQL database with automated migrations.

---

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended)
- **OR Node.js 18+** with PostgreSQL 15+
- **Port 3000** available (or configure in .env)

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start from project root
cd ..
docker-compose up -d

# Verify backend is running
docker-compose logs -f backend
```

### Option 2: Local Development

#### Step 1: Start PostgreSQL Database

```bash
# Using Docker (database only)
docker run -d \
  --name miketea-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=miketea_machine \
  -p 5432:5432 \
  postgres:15-alpine

# Verify connection
docker exec miketea-postgres psql -U postgres -c "SELECT version();"
```

#### Step 2: Install and Configure Backend

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run db:migrate

# Start backend
npm start
```

Backend will be available at `http://localhost:3000`

#### Step 3: Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-29T..."}
```

---

## 🔌 API Endpoints (16 Total)

### 1. POS Authentication

#### Login
```http
POST /api/service/pos/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "success": true,
  "data": {
    "token": "xxx",
    "user": {...}
  }
}
```

#### Generic Proxy Request
```http
POST /api/service/pos/request
Content-Type: application/json

{
  "token": "xxx",
  "method": "GET",
  "endpoint": "/api/products",
  "data": null
}
```

### 2. Flavor Code Management

#### Save Flavor Codes
```http
POST /api/service/pos/item-codes/save
Content-Type: application/json

{
  "business_id": "67295c445242136caa4511d4",
  "item_codes": [
    {
      "optionId": "option123",
      "optionItemId": "item001",
      "code": "I001"
    }
  ]
}

Response:
{
  "success": true,
  "data": [...]
}
```

#### Get All Flavor Codes
```http
GET /api/service/pos/item-codes/:business_id

Response:
{
  "success": true,
  "data": [
    {
      "business_id": "67295c445242136caa4511d4",
      "option_id": "option123",
      "option_item_id": "item001",
      "code": "I001"
    }
  ]
}
```

#### Get Codes by Option
```http
GET /api/service/pos/item-codes/:business_id/option/:option_id
```

### 3. QR Protocol Management

#### Get QR Formula
```http
GET /api/service/qr-protocol/formula?business_id=67295c445242136caa4511d4

Response:
{
  "success": true,
  "data": {
    "formula": "ORD|#{productCode}|#{optionCodes}",
    "templateId": "template_xxx"
  }
}
```

#### Save QR Formula
```http
POST /api/service/qr-protocol/formula
Content-Type: application/json

{
  "business_id": "67295c445242136caa4511d4",
  "formula": "ORD|#{productCode}|#{optionCodes}"
}

Response:
{
  "success": true,
  "data": {
    "templateId": "template_xxx",
    "formula": "ORD|#{productCode}|#{optionCodes}"
  }
}
```

### 4. Product Code Management

#### Get All Product Codes
```http
GET /api/service/pos/product-codes?business_id=67295c445242136caa4511d4
```

#### Save Product Code
```http
POST /api/service/pos/product-codes
Content-Type: application/json

{
  "business_id": "67295c445242136caa4511d4",
  "product_id": "prod123",
  "code": "P001"
}
```

#### Delete Product Code
```http
DELETE /api/service/pos/product-codes/:product_id?business_id=67295c445242136caa4511d4
```

### 5. Product Code Switch

#### Get Switch Status
```http
GET /api/service/pos/product-code-switch?business_id=67295c445242136caa4511d4

Response:
{
  "success": true,
  "data": {
    "business_id": "67295c445242136caa4511d4",
    "enabled": true
  }
}
```

#### Update Switch Status
```http
POST /api/service/pos/product-code-switch
Content-Type: application/json

{
  "business_id": "67295c445242136caa4511d4",
  "enabled": true
}
```

### 6. Data Synchronization

#### Get Options
```http
GET /api/service/pos/options?token=xxx&business_id=xxx&page_size=50&page_idx=0
```

#### Sync All QR Data
```http
GET /api/service/pos/sync-qr-data?business_id=67295c445242136caa4511d4

Response:
{
  "success": true,
  "data": {
    "formula": "ORD|#{productCode}|#{optionCodes}",
    "switch": true,
    "productCodes": [...],
    "optionCodes": [...]
  }
}
```

---

## 🗄️ Database Schema

All tables are automatically created by migration script on startup.

### option_item_codes
Stores flavor code mappings
```sql
CREATE TABLE option_item_codes (
  business_id VARCHAR(255) NOT NULL,
  option_id VARCHAR(255) NOT NULL,
  option_item_id VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, option_item_id)
);
```

### qr_templates
Stores QR protocol templates
```sql
CREATE TABLE qr_templates (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### product_codes
Stores product codes
```sql
CREATE TABLE product_codes (
  business_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, product_id)
);
```

### product_code_settings
Stores product code switch settings
```sql
CREATE TABLE product_code_settings (
  business_id VARCHAR(255) PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Server Configuration
NODE_ENV=production                    # or development
PORT=3000                             # server port

# Database Configuration
DB_HOST=localhost                     # postgres host
DB_PORT=5432                          # postgres port
DB_NAME=miketea_machine               # database name
DB_USER=postgres                      # database user
DB_PASSWORD=postgres123               # database password

# POS API
POS_API_BASE=https://dev.vend88.com   # external POS API base URL

# Optional: Product System Integration
PRODUCT_SYSTEM_API_URL=http://localhost:8080/api
PRODUCT_SYSTEM_API_KEY=your_api_key

# Sync Settings
FLAVOR_SYNC_ENABLED=true              # enable auto sync
FLAVOR_SYNC_INTERVAL=3600000          # sync interval (ms)
```

---

## 📝 Common Commands

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start server (production)
npm start

# Start with auto-reload (development)
npm run dev

# Run tests
npm test
```

---

## 🐛 Troubleshooting

### Connection Refused on Port 5432
**Problem:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# If not running, start it
docker start miketea-postgres

# Or create new container if doesn't exist
docker run -d --name miketea-postgres \
  -e POSTGRES_DB=miketea_machine \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:15-alpine
```

### Database Connection Error After Restart
**Problem:** Connection works locally but fails after computer restart

**Solution:**
```bash
# Docker containers don't auto-start
# Always run before backend:
docker start miketea-postgres
```

### Migration Script Fails
**Problem:** `Migration failed: ...`

**Solution:**
```bash
# View detailed error
docker-compose logs -f backend | grep -A 5 "Migration failed"

# If database is corrupted, reset
docker-compose down -v
docker-compose up -d
```

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE :::3000`

**Solution:**
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in .env
echo "PORT=3001" >> .env
```

---

## 🔐 Security Recommendations

1. **Change Default Passwords**
   - Never use `postgres123` in production
   - Use strong, random passwords

2. **Environment Variables**
   - Store sensitive data in `.env`
   - Never commit `.env` to git
   - Use `.env.example` for documentation

3. **API Authentication**
   - Implement API key validation for production
   - Use HTTPS for all external communications
   - Enable CORS restrictions

4. **Database Backups**
   - Setup automated PostgreSQL backups
   - Test backup restoration regularly
   - Keep backups in secure location

---

## 📚 Related Documentation

- [Main Project README](../README.md)
- [Frontend Documentation](../frontend/README.md)
- [API Examples](../API_EXAMPLES.md)

---

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs: `docker-compose logs backend`
3. Check database connection: `docker exec miketea-postgres psql -U postgres miketea_machine -c "SELECT 1;"`
4. Verify .env configuration

---

## 📄 License

MIT
