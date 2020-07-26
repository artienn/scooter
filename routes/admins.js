const express = require('express');
const router = express.Router();
const Admin = require('../controllers/Admin');
const {checkAdmin, checkAdminWithoutError} = require('../libs/jwt');

router.post('/login', async (req, res, next) => {
    try {
        const {login, password} = req.body;
        const result = await Admin.login(login, password);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/settings', checkAdminWithoutError, async (req, res, next) => {
    try {
        const result = await Admin.getAdminSettings(req.admin);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/settings', checkAdmin, async (req, res, next) => {
    try {
        const {phones, workTime} = req.body;
        const result = await Admin.putAdminSettings(phones, workTime);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.post('/push_notifications', checkAdmin, async (req, res, next) => {
    try {
        const {text, userType} = req.body;
        const result = await Admin.sendPush(text, userType);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.get('/notices', checkAdmin, async (req, res, next) => {
    try {
        const {viewed, page, limit} = req.query;
        const result = await Admin.getAdminNotice(viewed === 'true' ? true : viewed === 'false' ? false : null, limit, page);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

router.put('/notices/:id', checkAdmin, async (req, res, next) => {
    try {
        const {viewed} = req.body;
        const result = await Admin.updateAdminNotice(req.params.id, viewed);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;