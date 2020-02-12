const express = require('express');
const router = express.Router();
const User = require('../schemas').User;
const Balance = require('../controllers').Balance;
const {checkUser} = require('../libs/jwt');
const passport = require('passport');

const {facebook} = require('../config');
const FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: facebook.appID,
    clientSecret: facebook.appSecret,
    callbackURL: facebook.callbackUrl
},
function(access_token, refresh_token, profile, done) {
    // asynchronous
    process.nextTick(function() {
       
        // find the user in the database based on their facebook id
        User.findOne({ 'id' : profile.id }, function(err, user) {
   
            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
                return done(err);
   
            // if the user is found, then log them in
            if (user) {
                return done(null, user); // user found, return that user
            } else {
                // if there is no user found with that facebook id, create them
                var newUser = new User();
    
                // set all of the facebook information in our user model
                newUser.fb.id    = profile.id; // set the users facebook id                 
                newUser.fb.access_token = access_token; // we will save the token that facebook provides to the user                    
                newUser.fb.firstName  = profile.name.givenName;
                newUser.fb.lastName = profile.name.familyName; // look at the passport user profile to see how names are returned
                //newUser.fb.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                // save our user to the database
                newUser.save(function(err) {
                    if (err)
                        throw err;

                    // if successful, return the new user
                    return done(null, newUser);
                });
            } 
        });
    });
}));

router.get('/login/facebook', passport.authenticate('facebook', { scope : 'email' }));

router.get('/login/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/',
    failureRedirect : '/login'
}), async (req, res, next) => {
    console.log(req.query);
    res.send({message: 'ok'});
});

router.post('/register', async (req, res, next) => {
    try {
        const result = await User.register(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/check_code', async (req, res, next) => {
    try {
        const result = await User.checkCode(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const result = await User.loginAndSendCode(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/confirm_login', async (req, res, next) => {
    try {
        const result = await User.confirmCode(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/confirm_code', async (req, res, next) => {
    try {
        const result = await User.sendCode(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/reset_password', async (req, res, next) => {
    try {
        const result = await User.resetPassword(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/balance/bonus_code', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.replenishmentByBonusCode(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/info', checkUser, async (req, res, next) => {
    try {
        res.send({user: req.user});
    } catch (err) {
        next(err);
    }
});

module.exports = router;