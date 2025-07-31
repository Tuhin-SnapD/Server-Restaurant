require('dotenv').config();

module.exports = {
    'secretKey': process.env.SECRET_KEY || '12345-67890-09876-54321',
    'jwtSecret': process.env.JWT_SECRET || 'jwt-secret-key',
    'mongoUrl': process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/conFusion',
    'port': process.env.PORT || 8000,
    'nodeEnv': process.env.NODE_ENV || 'development',
    'uploadPath': process.env.UPLOAD_PATH || './public/images',
    'maxFileSize': process.env.MAX_FILE_SIZE || 5242880,
    'sessionSecret': process.env.SESSION_SECRET || 'session-secret-key',
    'sessionTtl': process.env.SESSION_TTL || 86400,
    'allowedOrigins': process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:8000'],
    'facebook': {
        clientId: process.env.FACEBOOK_CLIENT_ID || '478025973852330',
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'f29ff973f484d5e3a9082593b2f83f06'
    }
};

