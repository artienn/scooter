const express = require('express');
const router = express.Router();
const Admin = require('../controllers/Admin');

router.post('/login', async (req, res, next) => {
    try {
        const {login, password} = req.body;
        const result = await Admin.login(login, password);
        res.send(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;