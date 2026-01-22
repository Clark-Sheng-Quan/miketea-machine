# Miketea Machine Integration Backend

Node.js + Express backend for milk tea machine integration with POS system.

## Setup

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

4. Start server:
```bash
npm start
```

Development mode with auto-reload:
```bash
npm run dev
```

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
