const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/users');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const FacebookTokenStrategy = require('passport-facebook-token');
const config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    async (jwt_payload, done) => {
        try {
            const user = await User.findOne({ _id: jwt_payload._id })
                .select('username firstname lastname admin');
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err, false);
        }
    }));

const getRequestToken = (req) =>
    req.body.token || req.query.token || req.headers['x-access-token'] ||
    req.headers['authorization']?.replace('Bearer ', '');

const attachUser = async (req, res, next, token) => {
    try {
        const decoded = jwt.verify(token, config.secretKey);
        const user = await User.findById(decoded._id)
            .select('username firstname lastname admin');
        if (!user) {
            const err = new Error('You are not authenticated!');
            err.status = 401;
            return next(err);
        }
        req.decoded = decoded;
        req.user = user;
        next();
    } catch (err) {
        const authError = new Error('You are not authenticated!');
        authError.status = 401;
        next(authError);
    }
};

exports.verifyUser = function (req, res, next) {
    const token = getRequestToken(req);
    if (!token) {
        const err = new Error('No token provided!');
        err.status = 403;
        return next(err);
    }
    attachUser(req, res, next, token);
};

// Allows both anonymous and authenticated requests while attaching req.user
// when a valid token is supplied.
exports.verifyUserOptional = function (req, res, next) {
    const token = getRequestToken(req);
    if (!token) {
        return next();
    }
    attachUser(req, res, next, token);
};

exports.verifyAdmin = function (req, res, next) {
    if (req.user && req.user.admin) {
        next();
    } else {
        const err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);
    }
};

exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({facebookId: profile.id});
        
        if (user) {
            return done(null, user);
        } else {
            user = new User({ 
                username: profile.displayName,
                facebookId: profile.id,
                firstname: profile.name.givenName,
                lastname: profile.name.familyName
            });
            
            const savedUser = await user.save();
            return done(null, savedUser);
        }
    } catch (err) {
        return done(err, false);
    }
}));