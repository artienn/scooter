const express = require('express');
const router = express.Router();
const Balance = require('../controllers').Balance;
const {checkUser, checkAdmin} = require('../libs/jwt');

router.post('/cards', checkUser, async (req, res, next) => {
    try {
        const {amount, description, cardNumber, cardMonth, cardYear, cvv} = req.body;
        const result = await Balance.createUserCard(req.user, amount, description, cardNumber, cardMonth, cardYear, cvv);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/cards', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.getUserCards(req.user);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/tariffs', checkAdmin, async (_req, res, next) => {
    try {
        const result = await Balance.getTariffs();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/tariffs/:type', checkAdmin, async (req, res, next) => {
    try {
        const {name, price, maxTime} = req.body;
        const result = await Balance.updateTariff(req.params.type, name, price, maxTime);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.delete('/cards/:cardId', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.deleteCard(req.user, req.params.cardId);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/pay', checkUser, async (req, res, next) => {
    try {
        const {amount, description, cardNumberLastSymbols, result_url} = req.body;
        const result = await Balance.pay(req.user, amount, description, cardNumberLastSymbols, result_url);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

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

router.put('/cancel_hold', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.cancelHold(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/cancel_pay', checkUser, async (req, res, next) => {
    try {
        const {orderId} = req.body;
        const result = await Balance.cancelPay(req.user, orderId);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/cancel_subscribe', checkUser, async (req, res, next) => {
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
        console.log('CALLBACK');
        const result = await Balance.callbackPayment(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/bonus_code', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.replenishmentByBonusCode(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;