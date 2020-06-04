const schedule = require('node-schedule');
const {getDevises, getDeviseById, getDevisesPlugins, getDevisesCoords} = require('./libs/flespi');
const {Scooter, ScooterCoords} = require('./schemas');
const Zone = require('./controllers/Zone');
const scooterErrors = require('./libs/scooterErrors');

require('./db')();

const getScooters = async () => {
    const scooters = await getDevises();
    console.log(scooters);
};

const getPlugins = async () => {
    const plugins = await getDevisesPlugins();
    console.log(plugins);
};

const getScooterById = async () => {
    const scooter = await getDeviseById(514342);
    console.log(scooter);
};

const getCoordsByScooters = async () => {
    try {
        const scooters = await getDevisesCoords(['all']);
        for (const scooter of scooters) {
            console.log(scooter.telemetry);
            let s = await Scooter.findOne({id: scooter.id});
            if (!s) {
                s = new Scooter({
                    id: scooter.id
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
            const [{result}] = await Promise.all([
                Zone.checkPoint(s.coords.lat, s.coords.lon),
                s.save(),
                // ScooterCoords({
                //     lat: s.coords.lat,
                //     lon: s.coords.lon,
                //     scooterId: scooter.id
                // }).save()
            ]);
            if (!result) await scooterErrors.scooterGoOutZone(s);
        }
    } catch (err) {
        console.error(err);
    }
};

schedule.scheduleJob('*/5 * * * * *', getCoordsByScooters);