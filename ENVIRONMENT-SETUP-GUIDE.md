# Environment Setup Guide

## 📝 Quick Reference

### **Current Configuration: LOCAL DEVELOPMENT** ✅

Both `.env` files are currently set up for **local testing**.

---

## 🏠 Local Development (Current)

### Backend `.env`
```env
# LOCAL DEVELOPMENT (Currently Active)
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```env
# LOCAL DEVELOPMENT (Currently Active)
VITE_BACKEND=http://localhost:3000
```

### Testing Locally
1. **Start Backend:**
   ```bash
   cd BE/card-game-server
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd FE
   npm run dev
   ```

3. **Access:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

---

## 🚀 Production Deployment

### When Deploying to Production

#### Step 1: Update Backend `.env`
```bash
cd BE/card-game-server
nano .env  # or open in editor
```

**Comment out LOCAL, uncomment PRODUCTION:**
```env
# LOCAL DEVELOPMENT (Comment out for production)
# NODE_ENV=development
# PORT=3000
# FRONTEND_URL=http://localhost:5173

# PRODUCTION DEPLOYMENT (Currently Active)
NODE_ENV=production
PORT=8443
FRONTEND_URL=https://meme-blood.ddns.net:8443
```

#### Step 2: Update Frontend `.env`
```bash
cd FE
nano .env  # or open in editor
```

**Comment out LOCAL, uncomment PRODUCTION:**
```env
# LOCAL DEVELOPMENT (Comment out for production)
# VITE_BACKEND=http://localhost:3000

# PRODUCTION DEPLOYMENT (Currently Active)
VITE_BACKEND=https://meme-blood.ddns.net:8443
```

#### Step 3: Build & Deploy Frontend
```bash
cd FE
npm run build
# Deploy dist/ folder to your web server
```

#### Step 4: Restart Backend
```bash
cd BE/card-game-server
pm2 restart meme-blood-backend
# Or: npm run start
```

---

## 🔄 Switching Between Environments

### Local → Production

**Backend `.env`:**
```bash
# Comment lines 7-9 (local)
# Uncomment lines 12-14 (production)
```

**Frontend `.env`:**
```bash
# Comment line 7 (local)
# Uncomment line 10 (production)
```

Then:
- Frontend: `npm run build` (rebuild required!)
- Backend: Restart server

### Production → Local

**Backend `.env`:**
```bash
# Uncomment lines 7-9 (local)
# Comment lines 12-14 (production)
```

**Frontend `.env`:**
```bash
# Uncomment line 7 (local)
# Comment line 10 (production)
```

Then:
- Frontend: No rebuild needed for dev mode
- Backend: Restart server

---

## ⚙️ Configuration Summary

| Setting | Local Development | Production |
|---------|-------------------|------------|
| **Backend PORT** | `3000` | `8443` |
| **Backend NODE_ENV** | `development` | `production` |
| **Backend FRONTEND_URL** | `http://localhost:5173` | `https://meme-blood.ddns.net:8443` |
| **Frontend VITE_BACKEND** | `http://localhost:3000` | `https://meme-blood.ddns.net:8443` |

---

## ✅ Verification Checklist

### Local Development
- [ ] Backend `.env`: Lines 7-9 uncommented, lines 12-14 commented
- [ ] Frontend `.env`: Line 7 uncommented, line 10 commented
- [ ] Backend running on `http://localhost:3000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] No CORS errors in browser console
- [ ] Can login successfully
- [ ] Socket.IO connects

### Production Deployment
- [ ] Backend `.env`: Lines 7-9 commented, lines 12-14 uncommented
- [ ] Frontend `.env`: Line 7 commented, line 10 uncommented
- [ ] Frontend rebuilt (`npm run build`)
- [ ] Frontend deployed to web server
- [ ] Backend restarted on port 8443
- [ ] SSL certificate valid for port 8443
- [ ] Can access `https://meme-blood.ddns.net:8443`
- [ ] No CORS errors in browser console
- [ ] Socket.IO connects in production

---

## 🐛 Troubleshooting

### CORS Errors
**Symptom:** `Cross-Origin Request Blocked` or `CORS request did not succeed`

**Cause:** Mismatch between `FRONTEND_URL` (backend) and actual frontend URL

**Solution:**
- Check backend is using correct `FRONTEND_URL`
- Restart backend after changing `.env`

### WebSocket Connection Refused
**Symptom:** `NS_ERROR_WEBSOCKET_CONNECTION_REFUSED`

**Cause:** Port mismatch between frontend and backend

**Solution:**
- Verify `PORT` in backend `.env` matches the port in `VITE_BACKEND` (frontend)
- For local: both use 3000
- For production: both use 8443

### Frontend Shows Old Backend URL
**Symptom:** Frontend still connects to wrong backend after changing `.env`

**Cause:** Frontend needs rebuild when `.env` changes (Vite bakes env vars into build)

**Solution:**
```bash
cd FE
npm run build  # For production
# OR
# Restart dev server for local development
```

---

## 📌 Important Notes

1. **Frontend MUST be rebuilt** after changing `.env` for production deployment
2. **Backend MUST be restarted** after changing `.env`
3. **Keep both files in sync** - if frontend expects 8443, backend must run on 8443
4. **Never commit sensitive data** - `.env` should be in `.gitignore`
5. **Always test locally first** before deploying to production

---

## 🎯 Quick Commands

### Switch to Local (for testing)
```bash
# Backend .env: Uncomment lines 7-9, comment 12-14
# Frontend .env: Uncomment line 7, comment line 10
cd BE/card-game-server && npm run dev
cd FE && npm run dev
```

### Switch to Production (for deployment)
```bash
# Backend .env: Comment lines 7-9, uncomment 12-14
# Frontend .env: Comment line 7, uncomment line 10
cd FE && npm run build
cd BE/card-game-server && pm2 restart meme-blood-backend
```

---

## 📄 Related Documentation

- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Full deployment guide
- [WEBSOCKET-FIX.md](./BE/card-game-server/WEBSOCKET-FIX.md) - WebSocket configuration
- [CHARACTER-ABILITIES-FIX.md](./BE/card-game-server/CHARACTER-ABILITIES-FIX.md) - Game features
