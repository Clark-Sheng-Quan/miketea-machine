# Deployment Commands

```bash
# 1. Enter the downloaded project
cd miketea-machine/backend
```

```bash
# 2. Edit the environment file
nano .env
```

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb:27017
MONGODB_DATABASE=miketea_machine
POS_API_BASE=https://dev.vend88.com
CORS_ORIGIN=http://SERVER_IP_OR_DOMAIN
LOG_LEVEL=info
LOG_DIR=/var/log/miketea-machine
```

```bash
# 3. Start MongoDB and backend
docker compose up -d --build
```

```bash
# 4. Check services
docker compose ps
```

```bash
# 5. Check backend logs
docker compose logs -f backend
```

```bash
# 6. Test the backend
curl http://127.0.0.1:3000/health
```

```bash
# 7. Test the QR API
curl "http://SERVER_IP:3000/tea_machine/sync-qr-data?business_id=BUSINESS_ID" \
  -H "Authorization: Bearer VALID_POS_TOKEN"
```

```bash
# Update and restart after a new GitHub version
cd miketea-machine
git pull
cd backend
docker compose up -d --build
```

```bash
# Restart without rebuilding
docker compose restart
```

```bash
# Stop all services
docker compose down
```

```bash
# Stop all services and delete MongoDB data
# Do not run this unless the database should be deleted
docker compose down -v
```
