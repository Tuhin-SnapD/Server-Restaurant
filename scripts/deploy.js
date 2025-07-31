#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

console.log('🚀 Starting Restaurant Backend Deployment...\n');

// Check if we're in production mode
const isProduction = config.nodeEnv === 'production';
console.log(`📊 Environment: ${config.nodeEnv}`);

// Step 1: Install dependencies
console.log('📦 Installing dependencies...');
try {
    execSync('npm install --production', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
}

// Step 2: Check SSL certificates
console.log('🔒 Checking SSL certificates...');
const certExists = fs.existsSync(config.sslCertPath);
const keyExists = fs.existsSync(config.sslKeyPath);

if (certExists && keyExists) {
    console.log('✅ SSL certificates found');
    console.log(`   Certificate: ${config.sslCertPath}`);
    console.log(`   Private Key: ${config.sslKeyPath}\n`);
} else {
    console.log('⚠️  SSL certificates not found');
    console.log('   The server will run in HTTP mode\n');
}

// Step 3: Check database connection
console.log('🗄️  Testing database connection...');
try {
    const mongoose = require('mongoose');
    await mongoose.connect(config.mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('✅ Database connection successful\n');
    await mongoose.disconnect();
} catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('   Please check your MONGO_URL in the environment variables\n');
    process.exit(1);
}

// Step 4: Populate database (optional)
const args = process.argv.slice(2);
if (args.includes('--populate') || args.includes('-p')) {
    console.log('📊 Populating database with initial data...');
    try {
        execSync('npm run populate', { stdio: 'inherit' });
        console.log('✅ Database populated successfully\n');
    } catch (error) {
        console.error('❌ Failed to populate database:', error.message);
        process.exit(1);
    }
}

// Step 5: Create necessary directories
console.log('📁 Creating necessary directories...');
const dirs = [
    './sessions',
    './public/images',
    './logs'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   Created: ${dir}`);
    }
});
console.log('✅ Directories ready\n');

// Step 6: Start the server
console.log('🚀 Starting the server...');
console.log('   Use Ctrl+C to stop the server\n');

try {
    if (isProduction) {
        execSync('node server.js', { stdio: 'inherit' });
    } else {
        execSync('npm run dev', { stdio: 'inherit' });
    }
} catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
} 