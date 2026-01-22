# Miketea Machine Integration Module

## Quick Start Guide

### Using Docker (Recommended)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 3000
- Frontend on port 3001

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Configuration

### Backend Environment (.env)

```
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=miketea_machine
DB_USER=postgres
DB_PASSWORD=your_password

# Product System API
PRODUCT_SYSTEM_API_URL=http://localhost:8080/api
PRODUCT_SYSTEM_API_KEY=your_api_key

# Sync Settings
FLAVOR_SYNC_ENABLED=true
FLAVOR_SYNC_INTERVAL=3600000
```

## API Endpoints

### For POS System

- `GET /api/pos/flavors` - Get all available flavors
- `POST /api/pos/generate-qr` - Generate QR protocol from order
- `POST /api/pos/generate-qr-image` - Generate QR image

### For Admin Dashboard

- `GET /api/flavors` - List all flavors
- `POST /api/flavors` - Create flavor
- `PUT /api/flavors/:id` - Update flavor
- `DELETE /api/flavors/:id` - Delete flavor
- `POST /api/flavors/sync/from-product-system` - Sync from product system

- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/activate` - Activate template

- `POST /api/qr-protocol/generate` - Generate QR protocol
- `GET /api/qr-protocol/by-serial/:serial` - Get protocol by serial
- `GET /api/qr-protocol/by-billno/:billNo` - Get protocols by bill no
- `GET /api/qr-protocol/search` - Search protocols

- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/health` - Check system health

## Default Sample Data

After running migrations, the system includes:
- Default QR template
- Sample flavors:
  - I001: Ice
  - I002: No Ice
  - S001: Normal Sugar
  - S002: Less Sugar
  - S003: No Sugar
  - T001: Hot
  - O001: Pearl
  - O002: Pudding

## Database

PostgreSQL 12+ required.

Tables:
- `flavors` - Available flavors
- `qr_templates` - QR protocol templates
- `qr_protocols` - Generated QR protocols
- `sync_logs` - Sync operation logs

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify database exists and is accessible

### Sync from Product System Failed
- Check `PRODUCT_SYSTEM_API_URL` and `PRODUCT_SYSTEM_API_KEY`
- Ensure Product System API is accessible
- Review logs for specific error

### QR Generation Failed
- Ensure at least one active template exists
- Check that order data includes required fields
- Verify flavor codes are valid

## Production Deployment

1. Update .env with production values
2. Run database migrations: `npm run db:migrate`
3. Build frontend: `npm run build`
4. Use Docker for containerized deployment
5. Set up reverse proxy (nginx) for both services
6. Configure SSL/TLS certificates

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:3001`
- Frontend is configured to proxy API requests to backend
