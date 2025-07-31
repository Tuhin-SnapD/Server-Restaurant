const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/users');
const passport = require('passport');
const authenticate = require('../authenticate');
const cors = require('./cors');

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

/* GET users listing. */
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

router.post('/signup', cors.corsWithOptions, async (req, res, next) => {
  try {
    const user = await User.register(new User({username: req.body.username}), req.body.password);
    
    if (req.body.firstname) user.firstname = req.body.firstname;
    if (req.body.lastname) user.lastname = req.body.lastname;
    
    await user.save();
    
    passport.authenticate('local')(req, res, () => {
      res.status(200).json({success: true, status: 'Registration Successful!'});
    });
  } catch (err) {
    res.status(500).json({err: err.message});
  }
});

router.post('/login', cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      res.status(401).json({success: false, status: 'Login Unsuccessful!', err: info});
      return;
    }
    
    req.logIn(user, (err) => {
      if (err) {
        res.status(401).json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});
        return;
      }

      const token = authenticate.getToken({_id: req.user._id});
      res.status(200).json({success: true, status: 'Login Successful!', token: token});
    }); 
  }) (req, res, next);
});

router.get('/logout', cors.corsWithOptions, (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  } else {
    const err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
    const token = authenticate.getToken({_id: req.user._id});
    res.status(200).json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});

router.get('/checkJWTToken', cors.corsWithOptions, (req, res, next) => {
  passport.authenticate('jwt', {session: false}, (err, user, info) => {
    if (err) return next(err);
    
    if (!user) {
      res.status(401).json({status: 'JWT invalid!', success: false, err: info});
      return;
    }
    
    res.status(200).json({status: 'JWT valid!', success: true, user: user});
  }) (req, res);
});

module.exports = router;
