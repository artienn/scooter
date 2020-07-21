const express = require('express');
const router = express.Router();
const Scooter = require('../controllers/Scooter');

const {checkUser, checkUserOrAdmin, checkAdmin} = require('../libs/jwt');

router.get('/', checkUserOrAdmin, async (req, res, next) => {
    try {
        const free = req.user ? true : req.admin ? false : true;
        const {version = null} = req.query;
        const result = await Scooter.listOfFreeScooters(free, version);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', checkUser, async (req, res, next) => {
    try {
        const {lat, lon} = req.body;
        const result = await Scooter.updateScooterCoords(req.user, lat, lon);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/:id/info', checkAdmin, async (req, res, next) => {
    try {
        const {viewed} = req.body;
        const result = await Scooter.updateScooter(req.params.id, viewed);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;