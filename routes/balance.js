const express = require('express');
const router = express.Router();
const Balance = require('../controllers').Balance;
const {checkUser, checkAdmin} = require('../libs/jwt');

router.get('/cards', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.getUserCards(req.user);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/promocodes', checkAdmin, async (req, res, next) => {
    try {
        const result = await Balance.getPromocodes();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/promocodes/:code', checkAdmin, async (req, res, next) => {
    try {
        const {active, contractStatus, salePercent} = req.body;
        const result = await Balance.putPromocode(req.params.code, active, contractStatus, salePercent);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/tariffs', checkUser, async (req, res, next) => {
    try {
        const {userType} = req.query;
        const result = await Balance.getTariffs(req.user, userType);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/tariffs/:type', checkAdmin, async (req, res, next) => {
    try {
        const {name, price, maxTime, userType} = req.body;
        const result = await Balance.updateTariff(req.params.type, name, price, maxTime, userType);
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
        const {amount, description, cardNumberLastSymbols, result_url, cardId, type} = req.body;
        const result = await Balance.pay(req.user, type, amount, description, cardNumberLastSymbols, result_url, cardId);
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

router.get('/cancellation_last_hold', checkUser, async (req, res, next) => {
    try {
        const result = await Balance.getLastHold(req.user);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/cancel', checkUser, async (req, res, next) => {
    try {
        const {orderId} = req.body;
        const result = await Balance.cancelPay(req.user, orderId);
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
        const result = await Balance.callbackPayment(req.body);
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