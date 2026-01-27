# Miketea Machine Integration Backend

Node.js + Express backend for milk tea machine integration with POS system.

## Prerequisites

### Docker & PostgreSQL
The backend requires PostgreSQL database running in Docker. Before starting the backend, ensure Docker is installed and the PostgreSQL container is running.

## Getting Started

### 1. Start PostgreSQL Docker Container

First, start the PostgreSQL container:
```bash
docker start miketea-postgres
```

If the container doesn't exist, create it:
```bash
docker run --name miketea-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=miketea_machine \
  -p 5432:5432 \
  -d postgres:15
```

Verify the container is running:
```bash
docker ps | grep miketea-postgres
```

### 2. Backend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

3. Initialize database:
```bash
npm run db:migrate
npm run db:seed
```

### 3. Start Backend Server

Production mode:
```bash
npm start
```

Development mode with auto-reload:
```bash
npm run dev
```

### Troubleshooting

**Error: `ECONNREFUSED` on port 5432**
- PostgreSQL container is not running
- Solution: Run `docker start miketea-postgres`

**Error: Database connection refused after restarting computer**
- Docker containers don't auto-start after system restart
- Solution: Always run `docker start miketea-postgres` before starting the backend

## API Endpoints

### POS Integration
- `GET /api/pos/flavors` - Get flavor list for POS
- `POST /api/pos/generate-qr` - Generate QR protocol
- `POST /api/pos/generate-qr-image` - Generate QR image

### Flavor Management
- `GET /api/flavors` - Get all flavors
- `POST /api/flavors` - Create flavor
- `PUT /api/flavors/:id` - Update flavor
- `DELETE /api/flavors/:id` - Delete flavor
- `POST /api/flavors/sync/from-product-system` - Sync from product system

### Template Management
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/activate` - Activate template

### QR Protocol
- `POST /api/qr-protocol/generate` - Generate protocol
- `GET /api/qr-protocol/by-serial/:serial` - Get by serial
- `GET /api/qr-protocol/by-billno/:billNo` - Get by bill number

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/health` - System health check

## Database Schema

### flavors
- id (UUID)
- flavor_code (VARCHAR, UNIQUE)
- flavor_name
- group_name
- product_system_id
- created_at
- updated_at

### qr_templates
- id (UUID)
- name
- template_pattern
- description
- is_active
- created_at
- updated_at

### qr_protocols
- id (UUID)
- serial
- bill_no
- barcode
- flavors
- sku
- quantity
- price
- protocol_string
- template_id (FK)
- created_at

### sync_logs
- id (UUID)
- sync_type
- status
- record_count
- error_message
- created_at
