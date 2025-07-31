#!/bin/bash

# DigitalOcean VPS Deployment Script
# Run this on your DigitalOcean droplet after creating it

echo "🚀 Setting up Restaurant Backend on DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install MongoDB (if using local MongoDB)
echo "🗄️ Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx (for reverse proxy)
echo "🌐 Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 443
sudo ufw allow 80
sudo ufw --force enable

# Clone your repository
echo "📥 Cloning repository..."
cd /var/www
sudo git clone https://github.com/Tuhin-SnapD/Server-Restaurant.git
sudo chown -R $USER:$USER Server-Restaurant
cd Server-Restaurant

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create environment file
echo "⚙️ Setting up environment..."
cp env.example .env
echo "Please edit .env file with your production values"
echo "Use: nano .env"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p sessions public/images logs backups

# Set up SSL certificates (if you have them)
echo "🔒 Setting up SSL certificates..."
echo "Please place your certificate.pem and private.key files in the root directory"
echo "Then run: chmod 600 private.key"

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/restaurant-backend << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /var/www/Server-Restaurant/certificate.pem;
    ssl_certificate_key /var/www/Server-Restaurant/private.key;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/restaurant-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your production values"
echo "2. Place your SSL certificates in the root directory"
echo "3. Update Nginx configuration with your domain"
echo "4. Restart Nginx: sudo systemctl reload nginx"
echo "5. Check PM2 status: pm2 status"
echo ""
echo "🌐 Your server should be running at:"
echo "   HTTP: http://your-server-ip"
echo "   HTTPS: https://your-domain.com (after SSL setup)" 