const express = require('express');
const router = express.Router();
const Balance = require('../controllers').Balance;
const {checkUser} = require('../libs/jwt');

router.post('/hold', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.hold(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/hold_completion', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.holdCompletion(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/subscribe', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.subscribe(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/cancel_hold', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.cancelPayment(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/cancel_subscribe', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.cancelSubscribe(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/status', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.status(req.user, req.query);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/callback', async (req, res, next) => {
    try {
        const result = await Balance.callbackPayment(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/bonus_code', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.replenishmentByBonusCode(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;