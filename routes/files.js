const express = require('express');
const router = express.Router();
const upload = require('../libs/upload');
const { badRequest } = require('boom');
const {File} = require('../schemas');


const {checkUser, checkUserOrAdmin} = require('../libs/jwt');

router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file || !req.file.filename) throw badRequest('Отсутствует файл');
    // await File({name: req.file.filename, user: req.user ? req.user._id : req.admin._id}).save();
    return res.send({ file: req.file.filename });
});

module.exports = router;