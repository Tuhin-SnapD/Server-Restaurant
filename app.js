const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const authenticate = require('./authenticate');
const config = require('./config');
const cors = require('cors');

const index = require('./routes/index');
const users = require('./routes/users');
const dishRouter = require('./routes/dishRouter');
const leaderRouter = require('./routes/leaderRouter');
const promoRouter = require('./routes/promoRouter');
const uploadRouter = require('./routes/uploadRouter');
const favouriteRouter = require('./routes/favoriteRouter');
const commentRouter = require('./routes/commentRouter');
const feedbackRouter = require('./routes/feedbackRouter');
const reservationRouter = require('./routes/reservationRouter');
const restaurantRouter = require('./routes/restaurantRouter');

const mongoose = require('mongoose');

const url = config.mongoUrl;

mongoose.set('strictQuery', true);

const connect = mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

connect.then((db) => {
  console.log('Connected to MongoDB server successfully!');
}, (err) => {
  console.error('MongoDB connection error:', err);
});

const app = express();

app.disable('x-powered-by');

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors({ origin: config.allowedOrigins }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  name: 'session-id',
  secret: config.secretKey,
  saveUninitialized: false,
  resave: false,
  store: new FileStore({
    path: './sessions',
    ttl: 86400, // 24 hours
    reapInterval: 3600 // 1 hour
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 86400000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/users', users);

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(config.uploadPath)));

// API routes
app.use('/dishes', dishRouter);
app.use('/leaders', leaderRouter);
app.use('/promotions', promoRouter);
app.use('/imageUpload', uploadRouter);
app.use('/favorites', favouriteRouter);
app.use('/comments', commentRouter);
app.use('/feedback', feedbackRouter);
app.use('/reservations', reservationRouter);
app.use('/restaurant', restaurantRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((item) => item.message)
      .join(', ') || 'Validation failed';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with that value already exists';
  }

  if (status >= 500) {
    console.error(err);
  }

  // Keep the default Express welcome page for browser requests, but always
  // return JSON from the API so clients never receive an HTML error page.
  if (req.method === 'GET' && req.path === '/' && req.accepts('html')) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    return res.status(status).render('error');
  }

  res.status(status).json({ error: message });
});

module.exports = app;
