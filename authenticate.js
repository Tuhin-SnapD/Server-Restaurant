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
            console.log("JWT payload: ", jwt_payload);
            const user = await User.findOne({ _id: jwt_payload._id });
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (err) {
            return done(err, false);
        }
    }));

exports.verifyUser = function (req, res, next) {
    const token = req.body.token || req.query.token || req.headers['x-access-token'] || 
                  req.headers['authorization']?.replace('Bearer ', '');
    
    if (token) {
        jwt.verify(token, config.secretKey, function (err, decoded) {
            if (err) {
                const err = new Error('You are not authenticated!');
                err.status = 401;
                return next(err);
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        const err = new Error('No token provided!');
        err.status = 403;
        return next(err);
    }
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