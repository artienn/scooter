const express = require('express');
const router = express.Router();
const Admin = require('../controllers/Admin');
const {checkAdmin} = require('../libs/jwt');

router.post('/login', async (req, res, next) => {
    try {
        const {login, password} = req.body;
        const result = await Admin.login(login, password);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/settings', checkAdmin, async (req, res, next) => {
    try {
        const result = await Admin.getAdminSettings();
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/settings', checkAdmin, async (req, res, next) => {
    try {
        const {phones} = req.body;
        const result = await Admin.putAdminSettings(phones);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;