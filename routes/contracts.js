const express = require('express');
const router = express.Router();
const Contract = require('../controllers/Contract');
const {enumStatuses} = require('../config');
const {checkUser, checkAdmin, checkUserOrAdmin} = require('../libs/jwt');

router.post('/', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.createContract(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/active', checkUserOrAdmin, async (req, res, next) => {
    try {
        const {active = 'true'} = req.query;
        const result = await Contract.getUserActiveContracts(req.user, active === 'false' ? false : true);
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

router.get('/statuses', checkAdmin, async (_req, res, next) => {
    try {
        const result = enumStatuses.slice();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', checkUserOrAdmin, async (req, res, next) => {
    try {
        const result = await Contract.getUserContractById(req.user || req.admin, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/pause', checkUserOrAdmin, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToPause(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/normal', checkUserOrAdmin, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToNormal(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/stop', checkUserOrAdmin, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToStop(req.user, req.params.id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/exit', checkUserOrAdmin, async (req, res, next) => {
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