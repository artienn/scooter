const { Router } = require('express');
const router = Router();

router.use('/users', require('./users'));
router.use('/balance', require('./balance'));
router.use('/scooters', require('./scooters'));
router.use('/contracts', require('./contracts'));

module.exports = router;
