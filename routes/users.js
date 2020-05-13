const express = require('express');
const router = express.Router();
const User = require('../schemas').User;
const {checkUser, checkUserWithoutPhone} = require('../libs/jwt');
const passport = require('passport');
require('../libs/facebookAuth');

router.get('/login/facebook', passport.authenticate('facebook', { scope : 'email' }));

router.get('/login/facebook/callback', async (req, res, next) => {
    try {
        const result = await User.facebookLogin(req.query);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/register', async (req, res, next) => {
    try {
        const result = await User.register(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/login/facebook/phone', checkUserWithoutPhone, async (req, res, next) => {
    try {
        const result = await User.facebookLoginPhoneUpdate(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/login/facebook/phone_confirm', checkUserWithoutPhone, async (req, res, next) => {
    try {
        const result = await User.facebookLoginPhoneConfirm(req.user, req.body);
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

router.post('/problem_request', async (req, res, next) => {
    try {
        const {description, scooterId} = req.body;
        const result = await User.createProblemRequest(req.user._id, description, scooterId);
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

router.post('/code', async (req, res, next) => {
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

router.get('/info', checkUser, async (req, res, next) => {
    try {
        const fields = ['fb', '_id', 'phone', 'balance'];
        const result = {};
        for (const f of fields)
            result[f] = req.user[f];
        res.send({user: {...req.user, ...result}});
    } catch (err) {
        next(err);
    }
});

router.put('/info', checkUser, async (req, res, next) => {
    try {
        const {firstName, lastName, middleName, email, birthday} = req.body;
        const result = await User.updateInfo(req.user, firstName, lastName, middleName, email, birthday);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;