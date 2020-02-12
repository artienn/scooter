const express = require('express');
const router = express.Router();
const User = require('../schemas').User;
const Balance = require('../controllers').Balance;
const {checkUser} = require('../libs/jwt');
const passport = require('passport');
require('../libs/facebookAuth');

router.get('/login/facebook', passport.authenticate('facebook', { scope : 'email' }));

router.get('/login/facebook/callback', 
    passport.initialize(), 
    passport.serializeUser(function(user, done) {
        done(null, user);
    }),
    passport.authenticate('facebook', {
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