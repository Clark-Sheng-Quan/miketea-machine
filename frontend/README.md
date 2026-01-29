# 🌐 Milk Tea Admin Dashboard - Frontend

React 18 + Vite admin dashboard for managing milk tea machine integration with POS system.

---

## 📋 Prerequisites

- **Node.js 18+**
- **npm** or **yarn**
- **Backend API running** on http://localhost:3000 (or configured URL)
- frontend-1  |   ➜  Local:   http://localhost:3001/
- frontend-1  |   ➜  Network: http://172.18.0.3:3001/
---

## 🚀 Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Open browser to http://localhost:3001
```

### Production Build

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview

# Output: dist/ folder with static files
```

---

## 📁 Project Structure

```
frontend/src/
├── pages/
│   ├── Login.jsx                 # POS system login page
│   ├── OptionsManagement.jsx     # Manage flavor codes and options
│   ├── ProductCodeManagement.jsx # Manage product codes
│   ├── QRProtocol.jsx            # QR protocol generation and management
│   └── POS.jsx                   # POS page
│
├── components/
│   ├── MilkTeaLayout.jsx         # Main layout with tabs
│   └── MilkTeaLayout.css         # Layout styles
│
├── services/
│   ├── api.js                    # Centralized API client
│   └── qrService.ts              # QR code generation utilities
│
├── config/
│   └── constants.js              # Configuration constants
│
├── styles/
│   ├── ProductCodeManagement.css # Component-specific styles
│   └── index.css                 # Global styles
│
├── App.jsx                       # Root component
├── main.jsx                      # React entry point
└── index.css                     # Global styles
```

---

## 🎨 Features

### 1. Login Page
- POS system authentication
- Email and password login
- Token storage in localStorage
- Error handling and user feedback

### 2. Options Management
- View all flavor options from POS system
- Pagination support
- Expand options to view flavor items
- Save flavor codes to database
- Auto-generated code suggestions (I001, S001, T001, etc.)

### 3. Product Code Management
- Create and manage product codes
- Edit existing product codes
- Delete product codes
- Export/import functionality
- Switch to enable/disable product code feature

### 4. QR Protocol
- Edit QR protocol formula with placeholders
- Preview generated QR codes
- Save and load formulas
- Support for custom placeholders:
  - `#{productCode}` - Product code
  - `#{optionCodes}` - Flavor codes (comma-separated)
  - Custom parameters

### 5. Main Layout
- Tab-based navigation
- Responsive sidebar
- User profile display
- Logout functionality

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in frontend directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3000/api

# Optional: Backend URL for development
VITE_API_URL=http://localhost:3000

# Optional: Environment
VITE_ENV=development
```

### API Client Configuration

File: `src/services/api.js`

```javascript
const API_BASE_URL = 'http://localhost:3000/api';

// Auto-configures based on environment:
// Development: http://localhost:3000/api
// Production: https://your-domain.com/api
```

---

## 📝 Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Build optimized production bundle
npm run preview          # Preview built app locally

# Code Quality
npm run lint             # Run ESLint (if configured)
npm run format           # Format code with Prettier (if configured)

# Utilities
npm run analyze          # Analyze bundle size (if configured)
```

---

## 🔌 API Integration

### Available API Services

All API calls use the centralized API client: `src/services/api.js`

```javascript
// POS Authentication
posAuthAPI.login(email, password)
posAuthAPI.getOptions(token, businessId, pageSize, pageIdx)
posAuthAPI.searchProducts(token, businessId, pageSize, pageIdx)

// Flavor Codes
itemCodesAPI.save(businessId, itemCodes)
itemCodesAPI.getAll(businessId)
itemCodesAPI.getByOption(businessId, optionId)

// QR Protocol
qrProtocolAPI.getFormula(businessId)
qrProtocolAPI.saveFormula(businessId, formula)

// Product Codes
productCodesAPI.getAll(businessId)
productCodesAPI.save(businessId, productId, code)
productCodesAPI.delete(businessId, productId)
productCodesAPI.getSwitch(businessId)
productCodesAPI.setSwitch(businessId, enabled)
```

### Making API Calls

```javascript
import { posAuthAPI, itemCodesAPI } from '../services/api'

// In your component:
try {
  const response = await posAuthAPI.login('user@example.com', 'password')
  const token = response.data.data.token
  localStorage.setItem('posToken', token)
} catch (error) {
  console.error('Login failed:', error)
}
```

---

## 🎯 Page Workflows

### Login Flow
```
1. User enters email and password
2. Click "Login" button
3. Sends request to /api/service/pos/login
4. On success: Save token to localStorage
5. Redirect to main dashboard
6. On error: Show error message
```

### Options Management Flow
```
1. Page loads → Fetch options from POS
2. Display paginated options list
3. User clicks option to expand
4. Fetch flavor codes from database
5. User can view/edit codes
6. Click save → Save to database
```

### QR Protocol Flow
```
1. Page loads → Fetch current QR formula
2. Display formula editor
3. User edits formula with placeholders
4. Preview QR code generation
5. Save formula to database
6. Formula used for all QR generation
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates optimized static files in `dist/` folder.

### Deploy Options

#### Option 1: Static File Hosting
```bash
# Copy dist/ folder to your web server
# Serve with Nginx, Apache, or any static file server
cp -r dist/* /var/www/html/
```

#### Option 2: Docker Container
```bash
# Uses Dockerfile for multi-stage build
# Frontend is served by Nginx in container
docker build -t milktea-frontend .
docker run -p 3001:80 milktea-frontend
```

#### Option 3: Integrate into Existing React App
```bash
# Copy src/ folder contents to your project
# Import pages and components as needed
# Ensure API configuration matches your backend
```

---

## 🔐 Security Best Practices

1. **Token Storage**
   - Stored in localStorage (accessible from JavaScript)
   - For sensitive apps, consider httpOnly cookies

2. **API Communication**
   - Use HTTPS in production
   - Validate all user inputs
   - Implement CORS properly

3. **Environment Variables**
   - Keep backend URL in environment variables
   - Never hardcode API endpoints
   - Use `.env.example` for documentation

4. **Error Handling**
   - Display user-friendly error messages
   - Log detailed errors for debugging
   - Handle 401 errors (token expiration)

---

## 🐛 Troubleshooting

### Cannot Connect to Backend
**Problem:** `ERR_CONNECTION_REFUSED`

**Solution:**
```bash
# Check backend is running
curl http://localhost:3000/health

# Check API URL in .env
REACT_APP_API_URL=http://localhost:3000/api

# If backend on different machine, update URL
REACT_APP_API_URL=http://your-backend-url.com/api
```

### CORS Errors
**Problem:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
- Backend CORS configuration is needed
- Contact backend developer to add frontend URL to CORS whitelist
- In development, may need to use proxy

### Build Fails
**Problem:** `npm run build` fails with errors

**Solution:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build

# Check console for detailed errors
```

### Hot Reload Not Working
**Problem:** Changes to code don't reflect in browser

**Solution:**
```bash
# Restart dev server
npm run dev

# Clear browser cache (Ctrl+Shift+Delete)

# Check if file is being saved properly
```

---

## 📚 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | React renderer |
| react-router-dom | ^6.20.1 | Client routing |
| axios | ^1.6.2 | HTTP client |
| antd | ^5.11.5 | UI components |
| qrcode | ^1.5.4 | QR code generation |
| chart.js | ^4.4.1 | Data visualization |
| vite | ^5.0.8 | Build tool |

---

## 🎨 Styling

- **Framework:** Ant Design (antd)
- **CSS:** Component-specific CSS files
- **Responsive:** Mobile and desktop friendly
- **Theme:** Dark/Light mode support ready

### Custom Styling

Edit component CSS files:
- `src/components/MilkTeaLayout.css` - Main layout
- `src/pages/*.css` - Page-specific styles
- `src/styles/*.css` - Global styles

---

## 🆘 Support

For issues:
1. Check backend is running: `curl http://localhost:3000/health`
2. Verify API URL in `.env`
3. Check browser console for errors
4. Review network tab in DevTools
5. Check backend logs for API errors

---

## 📄 License

MIT
