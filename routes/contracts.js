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

router.get('/statuses', checkAdmin, async (_req, res, next) => {
    try {
        const result = enumStatuses.slice();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/pause', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToPause(req.user, req.body.contractId);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/normal', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToNormal(req.user, req.body.contractId);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/stop', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToStop(req.user, req.body.contractId);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/exit', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.updateStatusOfContractToExit(req.user, req.body.contractId, req.body.cableImg, req.body.closedLockImg);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/sum', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.checkSumOfContract(req.user, req.query.contract_id);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;