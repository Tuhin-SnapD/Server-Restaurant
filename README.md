# Restaurant Backend Server

A modern restaurant management server with authentication and API endpoints built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- MongoDB (local or Atlas)
- SSL certificates (for production HTTPS)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd Server-Restaurant
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start development server:**
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Server Configuration
NODE_ENV=production
PORT=443
HTTP_PORT=80

# Database Configuration
MONGO_URL=mongodb://your-mongodb-connection-string

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-key-here

# SSL Certificate Paths
SSL_CERT_PATH=./certificate.pem
SSL_KEY_PATH=./private.key

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### SSL Certificates

For HTTPS in production, place your certificates:
- `certificate.pem` - Your SSL certificate
- `private.key` - Your private key

## 🗄️ Database Management

### Initial Setup

Populate the database with sample data:
```bash
npm run populate
```

### Database Operations

```bash
# Backup database
npm run db:backup

# Restore from backup
npm run db:restore ./backups/backup-2024-01-01.json

# Clear database
npm run db:clear

# View database statistics
npm run db:stats

# Run database migrations
npm run db:migrate
```

### Manual Database Management

```bash
# Backup specific collection
node scripts/db-manager.js backup dishes

# Clear specific collection
node scripts/db-manager.js clear users

# View all commands
node scripts/db-manager.js
```

## 🚀 Deployment

### Production Deployment

1. **Prepare your environment:**
```bash
# Set production environment
export NODE_ENV=production

# Install production dependencies
npm install --production
```

2. **Deploy with automatic setup:**
```bash
# Deploy with database population
npm run deploy:with-data

# Deploy without database population
npm run deploy:prod
```

3. **Manual deployment:**
```bash
# Start production server
npm run server:prod

# Or use the original start command
npm start
```

### Deployment Scripts

The deployment script (`scripts/deploy.js`) automatically:
- ✅ Installs dependencies
- ✅ Checks SSL certificates
- ✅ Tests database connection
- ✅ Creates necessary directories
- ✅ Optionally populates database
- ✅ Starts the server

### SSL/HTTPS Setup

The server automatically detects SSL certificates and:
- Runs HTTPS on port 443 (or your configured port)
- Redirects HTTP to HTTPS
- Falls back to HTTP if no certificates found

## 📁 Project Structure

```
Server-Restaurant/
├── app.js                 # Express app configuration
├── server.js             # Production server with HTTPS
├── config.js             # Configuration management
├── populateDb.js         # Database population script
├── db.json              # Sample data
├── scripts/
│   ├── deploy.js        # Deployment automation
│   └── db-manager.js    # Database management
├── models/              # MongoDB models
├── routes/              # API routes
├── public/              # Static files
├── sessions/            # Session storage
└── backups/             # Database backups
```

## 🔌 API Endpoints

### Authentication
- `POST /users/signup` - User registration
- `POST /users/login` - User login
- `GET /users/logout` - User logout

### Dishes
- `GET /dishes` - Get all dishes
- `GET /dishes/:id` - Get specific dish
- `POST /dishes` - Create new dish (admin)
- `PUT /dishes/:id` - Update dish (admin)
- `DELETE /dishes/:id` - Delete dish (admin)

### Leaders
- `GET /leaders` - Get all leaders
- `GET /leaders/:id` - Get specific leader
- `POST /leaders` - Create new leader (admin)
- `PUT /leaders/:id` - Update leader (admin)
- `DELETE /leaders/:id` - Delete leader (admin)

### Promotions
- `GET /promotions` - Get all promotions
- `GET /promotions/:id` - Get specific promotion
- `POST /promotions` - Create new promotion (admin)
- `PUT /promotions/:id` - Update promotion (admin)
- `DELETE /promotions/:id` - Delete promotion (admin)

### Comments & Feedback
- `GET /comments` - Get all comments
- `POST /comments` - Add comment
- `GET /feedback` - Get all feedback
- `POST /feedback` - Submit feedback

### Favorites
- `GET /favorites` - Get user favorites
- `POST /favorites/:dishId` - Add to favorites
- `DELETE /favorites/:dishId` - Remove from favorites

### File Upload
- `POST /imageUpload` - Upload images

## 🔒 Security Features

- JWT authentication
- Session management
- CORS protection
- Input validation
- XSS protection
- CSRF protection
- Secure headers

## 📊 Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:8000/
```

### Database Monitoring
```bash
# Check database statistics
npm run db:stats

# Monitor database size
node scripts/db-manager.js stats
```

### Backup Strategy
```bash
# Daily backup (add to cron)
0 2 * * * cd /path/to/server && npm run db:backup

# Manual backup before updates
npm run db:backup
```

## 🛠️ Troubleshooting

### Common Issues

1. **SSL Certificate Errors:**
   - Ensure certificate files exist and are readable
   - Check file permissions (600 for private key)
   - Verify certificate format (PEM)

2. **Database Connection Issues:**
   - Check MONGO_URL in environment variables
   - Ensure MongoDB is running
   - Verify network connectivity

3. **Port Already in Use:**
   - Check if another process is using the port
   - Change PORT in environment variables
   - Kill existing processes: `lsof -ti:8000 | xargs kill`

### Logs
- Application logs: Check console output
- Session logs: `./sessions/`
- Database logs: MongoDB logs

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository
