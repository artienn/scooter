const express = require('express');
const router = express.Router();
const Contract = require('../controllers/Contract');
const {enumStatuses} = require('../config');
const {checkUser, checkAdmin} = require('../libs/jwt');

router.post('/', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.createContract(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/active', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.getUserActiveContracts(req.user);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.getUserContracts(req.user);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.getUserContractById(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/statuses', checkAdmin, async (_req, res, next) => {
    try {
        const result = enumStatuses.slice();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/pause', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToPause(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/normal', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToNormal(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/stop', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToStop(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/exit', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToExit(req.user, req.params.id, req.body.cableImg, req.body.closedLockImg);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/:id/sum', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.checkSumAndPeriodOfContractByUser(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;