const express = require('express');
const router = express.Router();
const Zone = require('../controllers/Zone');

const {checkUser, checkAdmin, checkUserOrAdmin} = require('../libs/jwt');

router.get('/', checkUserOrAdmin, async (req, res, next) => {
    try {
        const result = await Zone.getZones();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/', checkAdmin, async (req, res, next) => {
    try {
        const {zonesData} = req.body;
        const result = await Zone.updateZonePoints(zonesData);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/parse_zone', checkAdmin, async (req, res, next) => {
    try {
        const {fileName} = req.body;
        const result = await Zone.getDataAboutZoneFromKml(fileName);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;