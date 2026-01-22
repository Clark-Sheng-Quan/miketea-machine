# Miketea Admin Dashboard

React + Vite admin dashboard for managing milk tea machine integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Features

- **Dashboard**: Overview of system statistics
- **Flavor Management**: Create, edit, delete flavors and sync from Product System
- **Template Management**: Manage QR protocol templates
- **QR Protocol**: Generate and search QR protocols

## Pages

### Dashboard
- System statistics
- Recent protocols
- Flavor sync button

### Flavor Management
- List all flavors
- Create new flavor
- Edit flavor details
- Delete flavor
- Sync from Product System

### Template Management
- List all templates
- Create new template with custom pattern
- Edit template
- Delete template
- Activate/deactivate templates

### QR Protocol
- Generate QR codes from order data
- Search existing protocols
- View protocol details and generated QR images

## API Integration

All API calls are made through the centralized `services/api.js` file which handles:
- Flavor operations
- Template operations
- QR protocol generation
- POS integration
- Admin functions
