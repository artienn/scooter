const schedule = require('node-schedule');
const {getDevisesCoords} = require('./libs/flespi');
const {Scooter, Contract} = require('./schemas');
const geoLib = require('./libs/geoLib');
const Zone = require('./controllers/Zone');
const scooterErrors = require('./libs/scooterErrors');

require('./db')();

const getCoordsByScooters = async () => {
    try {
        const scooters = await getDevisesCoords(['all']);
        for (const scooter of scooters) {
            let s = await Scooter.findOne({id: scooter.id});
            if (!s) {
                s = new Scooter({
                    id: scooter.id,
                    free: true
                });
            }
            if (scooter.telemetry) {
                if (scooter.telemetry['battery.level']) {
                    s.battery = scooter.telemetry['battery.level'].value || 0;
                }
                s.coords = {
                    lat: scooter.telemetry['position.latitude'].value || null,
                    lon: scooter.telemetry['position.longitude'].value || null,
                    updatedAt: new Date()
                };
            }
        }
        await checkScooterZone();
    } catch (err) {
        console.error(err);
    }
};

const checkScooterZone = async (scooters) => {
    if (!scooters) scooters = await Scooter.find();
    for (const s of scooters) {
        console.log(s);
        const {result} = await Zone.checkPoint(s.coords.lat, s.coords.lon);
        if (!result) await scooterErrors.scooterGoOutZone(s);
    }
};

const checkDistanceBetweenScooterAndUser = async () => {
    const contracts = await Contract.find({active: true}).populate('user').populate('scooter');
    console.log('SCHEDULE CONTRACTS', contracts);
    for (const contract of contracts) {
        if (contract.user && contract.scooter) {
            const distance = geoLib.checkDistance({
                lat: contract.user.lat,
                lon: contract.user.lon
            }, contract.scooter.coords);
            if (!distance) await scooterErrors.scooterIncorrectCoords(contract.scooter, contract.user);
        } 
    }
};

schedule.scheduleJob('*/5 * * * * *', getCoordsByScooters);
schedule.scheduleJob('*/5 * * * * *', checkDistanceBetweenScooterAndUser);