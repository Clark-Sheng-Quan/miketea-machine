# API Integration Examples

## 1. POS System Integration

### Get Available Flavors
```bash
curl -X GET http://localhost:3000/api/pos/flavors
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "flavor_code": "I001",
      "flavor_name": "Ice",
      "group_name": "Temperature"
    },
    {
      "flavor_code": "S001",
      "flavor_name": "Normal Sugar",
      "group_name": "Sugar"
    }
  ],
  "timestamp": "2024-01-22T10:00:00Z",
  "version": "1.0"
}
```

### Generate QR Protocol
```bash
curl -X POST http://localhost:3000/api/pos/generate-qr \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "TEA001",
    "billNo": "20240122001",
    "barcode": "1234567890123",
    "flavors": ["I001", "S001", "O001"],
    "sku": "TEAL001",
    "quantity": 2,
    "price": 10.99
  }'
```

Response:
```json
{
  "success": true,
  "protocol": "TEA001|20240122001|1234567890123|I001,S001,O001|TEAL001",
  "qrData": {
    "id": "uuid...",
    "serial": "TEA001",
    "bill_no": "20240122001",
    "protocol_string": "TEA001|20240122001|1234567890123|I001,S001,O001|TEAL001",
    "created_at": "2024-01-22T10:00:00Z"
  },
  "timestamp": "2024-01-22T10:00:00Z"
}
```

### Generate QR Image
```bash
curl -X POST http://localhost:3000/api/pos/generate-qr-image \
  -H "Content-Type: application/json" \
  -d '{
    "protocol_string": "TEA001|20240122001|1234567890123|I001,S001,O001|TEAL001"
  }'
```

Response:
```json
{
  "success": true,
  "qrImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAAD4...",
  "timestamp": "2024-01-22T10:00:00Z"
}
```

## 2. Admin Dashboard API

### Get Dashboard Statistics
```bash
curl -X GET http://localhost:3000/api/admin/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalFlavors": 10,
    "totalTemplates": 2,
    "totalProtocols": 150,
    "recentProtocols": [
      {
        "id": "uuid...",
        "serial": "TEA001",
        "bill_no": "20240122001",
        "protocol_string": "...",
        "created_at": "2024-01-22T10:00:00Z"
      }
    ]
  }
}
```

### Manage Flavors

#### List All Flavors
```bash
curl -X GET http://localhost:3000/api/flavors
```

#### Create Flavor
```bash
curl -X POST http://localhost:3000/api/flavors \
  -H "Content-Type: application/json" \
  -d '{
    "flavor_code": "I003",
    "flavor_name": "Iced",
    "group_name": "Temperature"
  }'
```

#### Update Flavor
```bash
curl -X PUT http://localhost:3000/api/flavors/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "flavor_name": "Very Iced",
    "group_name": "Temperature"
  }'
```

#### Delete Flavor
```bash
curl -X DELETE http://localhost:3000/api/flavors/{id}
```

#### Sync from Product System
```bash
curl -X POST http://localhost:3000/api/flavors/sync/from-product-system
```

### Manage Templates

#### List All Templates
```bash
curl -X GET http://localhost:3000/api/templates
```

#### Create Template
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Protocol",
    "template_pattern": "{serial}|{billNo}|{barcode}|{flavors}|{sku}|{quantity}|{price}",
    "description": "Template with quantity and price",
    "is_active": false
  }'
```

#### Activate Template
```bash
curl -X POST http://localhost:3000/api/templates/{id}/activate
```

## 3. QR Protocol Management

### Generate Protocol
```bash
curl -X POST http://localhost:3000/api/qr-protocol/generate \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "TEA002",
    "billNo": "20240122002",
    "barcode": "9876543210123",
    "flavors": ["S002", "T001"],
    "sku": "TEAL002"
  }'
```

### Search Protocols
```bash
curl -X GET "http://localhost:3000/api/qr-protocol/search?serial=TEA&billNo=20240122"
```

### Get Protocol by Serial
```bash
curl -X GET http://localhost:3000/api/qr-protocol/by-serial/TEA001
```

## Integration with POS System

Your POS system should:

1. **On Order Creation:**
   - Call `/api/pos/flavors` to get available flavor codes
   - Present flavors to customer
   - Store selected flavor codes

2. **On Order Complete:**
   - Call `/api/pos/generate-qr` with order details
   - Get the protocol string and QR data
   - Call `/api/pos/generate-qr-image` to get QR image
   - Print QR code on receipt

Example POS integration flow:
```javascript
// 1. Get flavors
const flavors = await fetch('/api/pos/flavors').then(r => r.json());

// 2. Show flavors to customer
displayFlavorOptions(flavors.data);

// 3. After order is confirmed
const qrResult = await fetch('/api/pos/generate-qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serial: order.serial,
    billNo: order.billNo,
    barcode: order.barcode,
    flavors: selectedFlavors, // ["I001", "S001"]
    sku: order.sku
  })
});

// 4. Generate and print QR image
const protocolString = qrResult.protocol;
const imageResult = await fetch('/api/pos/generate-qr-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ protocol_string: protocolString })
});

// 5. Print QR code
printQRCode(imageResult.qrImage);
```

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message description",
  "missing": ["field1", "field2"]
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error
