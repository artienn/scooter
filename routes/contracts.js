const express = require('express');
const router = express.Router();
const Contract = require('../controllers/Contract');

const {checkUser} = require('../libs/jwt');

router.post('/', checkUser, async (req, res, next) => {
    try {
        const result = await Contract.createContract();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;