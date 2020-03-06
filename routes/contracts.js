const express = require('express');
const router = express.Router();
const Contract = require('../controllers/Contract');

const {checkUser} = require('../libs/jwt');

router.post('/', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.createContract(req.user, req.body);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/sum', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.checkSumOfContract(req.user);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;