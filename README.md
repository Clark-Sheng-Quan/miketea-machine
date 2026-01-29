# 🍵 Milk Tea Machine Integration Module

A complete milk tea machine integration module for POS system synchronization. Includes backend API service, web management dashboard, and automated database migration.

**✨ One Command Launch:** `docker-compose up -d`

---

## 📊 Project Overview

| Component | Technology | Port |
|-----------|-----------|------|
| Backend API | Node.js + Express | 3000 |
| Frontend App | React + Vite | 3001 |
| Database | PostgreSQL | 5432 |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- OR: Node.js 18+, PostgreSQL 15+

### With Docker (Recommended)

```bash
# Start all services with one command
docker-compose up -d

# View container status
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Access the application:**
- 🌐 Frontend: http://localhost:3001
- 🔧 Backend API: http://localhost:3000/health
- 🗄️ Database: localhost:5432

### Local Development (Without Docker)

#### 1. Start Database
```bash
# Requires PostgreSQL installed locally
createdb miketea_machine

# OR use Docker for database only
docker run -d \
  -e POSTGRES_DB=miketea_machine \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  --name miketea-postgres \
  postgres:15-alpine
```

#### 2. Start Backend
```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

#### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
miketea-machine/
├── backend/
│   ├── src/
│   │   ├── config/database.js       # Database configuration
│   │   ├── models/                  # Data models
│   │   │   ├── OptionItemCode.js    # Flavor code model
│   │   │   ├── Template.js          # QR template model
│   │   │   ├── ProductCode.js       # Product code model
│   │   │   └── ProductCodeSwitch.js # Product code switch
│   │   ├── routes/
│   │   │   └── posServiceRoutes.js  # 16 API endpoints
│   │   └── index.js                 # Application entry
│   ├── migrations/
│   │   └── runMigrations.js         # Database migration script
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── OptionsManagement.jsx
│   │   │   ├── ProductCodeManagement.jsx
│   │   │   └── QRProtocol.jsx
│   │   ├── services/api.js          # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml               # Docker compose configuration
└── README.md
```

---

## 🎯 Core Features

### Flavor Code Management
- Create and edit flavor codes (I001, S001, T001, etc.)
- Fetch flavor list from POS system
- Persistent codes that remain unchanged even if flavor names change

### QR Protocol Generation
- Custom QR protocol formula editor
- Generate QR code images
- Support for placeholders: `#{productCode}`, `#{optionCodes}`, etc.

### Product Code Management
- Manage product codes
- Enable/disable product code switch
- Full CRUD operations

### Automated Database Migration
- Automatically creates tables and indexes on startup
- No manual SQL scripts required
- Version control friendly

---

## 🔌 API Endpoints (16 Total)

### POS Authentication (2)
- `POST /api/service/pos/login` - POS system login
- `POST /api/service/pos/request` - Generic proxy request

### Flavor Codes (3)
- `POST /api/service/pos/item-codes/save` - Save flavor codes
- `GET /api/service/pos/item-codes/:business_id` - Get all codes
- `GET /api/service/pos/item-codes/:business_id/option/:option_id` - Get codes by option

### QR Protocol (2)
- `GET /api/service/qr-protocol/formula` - Get QR formula
- `POST /api/service/qr-protocol/formula` - Save QR formula

### Product Codes (3)
- `GET /api/service/pos/product-codes` - Get product codes
- `POST /api/service/pos/product-codes` - Save product code
- `DELETE /api/service/pos/product-codes/:product_id` - Delete product code

### Product Code Switch (2)
- `GET /api/service/pos/product-code-switch` - Get switch status
- `POST /api/service/pos/product-code-switch` - Update switch status

### Data Sync (2)
- `GET /api/service/pos/options` - Get options list
- `GET /api/service/pos/sync-qr-data` - Sync all QR data

See [Backend API Documentation](backend/README.md) for details.

---

## 🗄️ Database Tables

Automatically created tables:

| Table Name | Purpose |
|-----------|---------|
| `option_item_codes` | Flavor code storage |
| `qr_templates` | QR protocol templates |
| `product_codes` | Product code storage |
| `product_code_settings` | Product code switch status |

---

## 🔧 Configuration

### Environment Variables (backend/.env)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=miketea_machine
DB_USER=postgres
DB_PASSWORD=postgres123

# POS API
POS_API_BASE=https://dev.vend88.com

# Frontend Configuration (frontend/.env)
REACT_APP_API_URL=http://localhost:3000/api
```

---

## 📝 Common Commands

```bash
# Start
docker-compose up -d

# Stop (preserve data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild and restart
docker-compose up -d --build

# Enter container
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres miketea_machine
```

---

## 🚀 Production Deployment

### Option 1: Integrate into Existing POS Website
- Copy frontend code to existing project
- Add milk tea module to routing

### Option 2: Independent Deployment
- Deploy backend to server
- Configure Nginx reverse proxy
- Build frontend as static files

### Option 3: Container Deployment
- Launch with Docker Compose on server
- Configure HTTPS and domain
- Setup database backups

---

## 🐛 Troubleshooting

### Container won't start
```bash
# View error logs
docker-compose logs backend

# Check if ports are in use
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

### Database connection failed
```bash
# Check container status
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Migration script failed
```bash
# View full error
docker-compose logs -f backend | grep -i migration

# Delete old container and restart
docker-compose down -v
docker-compose up -d
```

---

## 📚 Documentation

- [Backend Development Guide](backend/README.md)
- [Frontend Development Guide](frontend/README.md)

---

## 💡 Development Recommendations

1. **Local Development**: Use `docker-compose up -d` for dependencies, run frontend/backend with `npm run dev` separately
2. **Production Deployment**: Use complete Docker Compose configuration
3. **Database Backups**: Regularly backup PostgreSQL data
4. **API Testing**: Use Postman or Insomnia to test APIs
5. **Logging**: Enable Docker log persistence

---

## 📄 License

MIT
