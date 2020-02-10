const express = require('express');
const router = express.Router();
const User = require('../schemas').User;

router.post('/register', async (req, res, next) => {
    try {
        const result = await User.register(req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const result = await User.login(req.body);
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

module.exports = router;