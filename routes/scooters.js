const express = require('express');
const router = express.Router();
const Scooter = require('../controllers/Scooter');

const {checkUser} = require('../libs/jwt');

router.get('/', checkUser, async (req, res, next) => {
    try {
        const result = await Scooter.listOfFreeScooters();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;