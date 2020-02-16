const { Router } = require('express');
const router = Router();

router.use('/users', require('./users'));
router.use('/balance', require('./balance'));

module.exports = router;
