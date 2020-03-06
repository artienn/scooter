const schedule = require('node-schedule');
require('./db')();
const Scooter = require('./controllers/Scooter');
const {Zone} = require('./schemas');

const checkScootersCoordinates = async () => {
    const [zones, scooters] = await Promise.all([
        Zone.find(),
        Scooter.getUsedScooters()
    ]);
};


schedule.scheduleJob('*/5 * * * * *', );