# 🚀 Deployment Guide

This guide will help you deploy your Restaurant Backend Server to production with SSL certificates and proper database management.

## 📋 Pre-Deployment Checklist

### 1. SSL Certificates
- [ ] Place `certificate.pem` in the root directory
- [ ] Place `private.key` in the root directory
- [ ] Set proper permissions: `chmod 600 private.key`
- [ ] Verify certificate format (PEM)

### 2. Environment Setup
- [ ] Copy `env.example` to `.env`
- [ ] Configure all environment variables
- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB connection string
- [ ] Set secure secret keys

### 3. Database Preparation
- [ ] Ensure MongoDB is running and accessible
- [ ] Test database connection
- [ ] Decide if you want to populate with sample data

### 4. Server Requirements
- [ ] Node.js >= 14.0.0 installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Sufficient disk space
- [ ] Proper firewall configuration

## 🚀 Deployment Methods

### Method 1: Automated Deployment (Recommended)

```bash
# 1. Clone and setup
git clone <your-repo>
cd Server-Restaurant

# 2. Configure environment
cp env.example .env
# Edit .env with your production values

# 3. Deploy with database population
npm run deploy:with-data

# 4. Or deploy without database population
npm run deploy:prod
```

### Method 2: PM2 Deployment

```bash
# 1. Install dependencies
npm install --production

# 2. Start with PM2
pm2 start ecosystem.config.js --env production

# 3. Save PM2 configuration
pm2 save

# 4. Setup PM2 startup script
pm2 startup
```

### Method 3: Manual Deployment

```bash
# 1. Install dependencies
npm install --production

# 2. Create necessary directories
mkdir -p sessions public/images logs backups

# 3. Set permissions
chmod 600 private.key
chmod 644 certificate.pem

# 4. Start the server
NODE_ENV=production node server.js
```

## 🔧 Configuration Details

### Environment Variables (.env)

```env
# Server Configuration
NODE_ENV=production
PORT=443
HTTP_PORT=80

# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/restaurant?retryWrites=true&w=majority

# Security
SECRET_KEY=your-very-long-and-secure-secret-key-here
JWT_SECRET=your-jwt-secret-key-here

# SSL Certificate Paths
SSL_CERT_PATH=./certificate.pem
SSL_KEY_PATH=./private.key

# File Upload Configuration
UPLOAD_PATH=./public/images
MAX_FILE_SIZE=5242880

# Session Configuration
SESSION_SECRET=your-session-secret-key
SESSION_TTL=86400

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### MongoDB Connection Strings

#### Local MongoDB
```
MONGO_URL=mongodb://127.0.0.1:27017/conFusion
```

#### MongoDB Atlas
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/restaurant?retryWrites=true&w=majority
```

#### MongoDB with Authentication
```
MONGO_URL=mongodb://username:password@localhost:27017/conFusion?authSource=admin
```

## 🗄️ Database Management

### Initial Setup

```bash
# Populate with sample data
npm run populate

# Or use the deployment script
npm run deploy:with-data
```

### Backup and Restore

```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore ./backups/backup-2024-01-01.json

# View database statistics
npm run db:stats
```

### Scheduled Backups

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/Server-Restaurant && npm run db:backup

# Weekly backup on Sunday at 3 AM
0 3 * * 0 cd /path/to/Server-Restaurant && npm run db:backup
```

## 🔒 SSL Certificate Setup

### Certificate File Requirements

1. **Certificate file** (`certificate.pem`):
   - Must be in PEM format
   - Should include the full certificate chain
   - File permissions: 644

2. **Private key file** (`private.key`):
   - Must be in PEM format
   - Should be the private key matching the certificate
   - File permissions: 600 (restrictive)

### Certificate Verification

```bash
# Check certificate validity
openssl x509 -in certificate.pem -text -noout

# Check private key
openssl rsa -in private.key -check

# Verify certificate and key match
openssl x509 -noout -modulus -in certificate.pem | openssl md5
openssl rsa -noout -modulus -in private.key | openssl md5
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Check server status
curl -k https://your-domain.com/

# Check database connection
npm run db:stats

# Check PM2 status (if using PM2)
pm2 status
pm2 logs restaurant-server
```

### Log Management

```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/err.log

# View PM2 logs
pm2 logs restaurant-server --lines 100
```

### Performance Monitoring

```bash
# Monitor memory usage
pm2 monit

# Check system resources
htop
df -h
free -h
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. SSL Certificate Errors
```bash
# Check certificate files exist
ls -la certificate.pem private.key

# Check permissions
ls -la private.key
# Should show: -rw------- (600)

# Test certificate
openssl s_client -connect localhost:443 -servername your-domain.com
```

#### 2. Database Connection Issues
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err.message))
  .finally(() => process.exit());
"
```

#### 3. Port Already in Use
```bash
# Find process using port
lsof -i :443
lsof -i :80

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=8443
```

#### 4. Permission Issues
```bash
# Fix file permissions
chmod 600 private.key
chmod 644 certificate.pem
chmod 755 public/images
chmod 755 sessions
```

### Emergency Procedures

#### Server Won't Start
```bash
# Check logs
tail -f logs/err.log

# Start in debug mode
NODE_ENV=development DEBUG=* node server.js

# Check environment variables
node -e "console.log(require('./config'))"
```

#### Database Issues
```bash
# Backup current data
npm run db:backup

# Clear database
npm run db:clear

# Restore from backup
npm run db:restore ./backups/latest-backup.json
```

#### SSL Issues
```bash
# Disable SSL temporarily
NODE_ENV=development node server.js

# Check certificate validity
openssl x509 -in certificate.pem -checkend 0 -noout
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# 1. Backup current data
npm run db:backup

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install --production

# 4. Run migrations
npm run db:migrate

# 5. Restart application
pm2 restart restaurant-server
# or
NODE_ENV=production node server.js
```

### Regular Maintenance Tasks

```bash
# Daily
npm run db:backup

# Weekly
npm run db:stats
pm2 monit

# Monthly
npm audit fix
npm update
```

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test database connectivity
5. Check SSL certificate validity

For additional help, create an issue in the repository with:
- Error messages
- Environment details
- Steps to reproduce
- Log files (if applicable) 