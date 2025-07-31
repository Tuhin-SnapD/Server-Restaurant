const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Import the Express app
const app = require('./app');

// SSL Certificate configuration
let httpsOptions = null;
if (config.nodeEnv === 'production' && fs.existsSync(config.sslCertPath) && fs.existsSync(config.sslKeyPath)) {
    httpsOptions = {
        cert: fs.readFileSync(config.sslCertPath),
        key: fs.readFileSync(config.sslKeyPath)
    };
    console.log('SSL certificates loaded successfully');
}

// Create HTTPS server (if certificates are available)
let httpsServer = null;
if (httpsOptions) {
    httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(config.port, () => {
        console.log(`🚀 HTTPS Server running on port ${config.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔒 SSL: Enabled`);
        console.log(`🌐 Server URL: https://localhost:${config.port}`);
    });
}

// Create HTTP server (for redirects or fallback)
const httpServer = http.createServer((req, res) => {
    if (httpsServer) {
        // Redirect HTTP to HTTPS in production
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        res.writeHead(301, { Location: httpsUrl });
        res.end();
    } else {
        // Fallback to HTTP if no SSL certificates
        app(req, res);
    }
});

httpServer.listen(config.httpPort, () => {
    if (httpsServer) {
        console.log(`🔄 HTTP Server running on port ${config.httpPort} (redirecting to HTTPS)`);
    } else {
        console.log(`🚀 HTTP Server running on port ${config.httpPort}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`⚠️  SSL: Disabled (no certificates found)`);
        console.log(`🌐 Server URL: http://localhost:${config.httpPort}`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (httpsServer) httpsServer.close();
    httpServer.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    if (httpsServer) httpsServer.close();
    httpServer.close();
    process.exit(0);
});

module.exports = { httpsServer, httpServer }; 