const {sendMessage} = require('./sendSms');
const {Zone, AdminSettings} = require('../schemas');
const {lockScooter} = require('./flespi');
const {pointInsideZones, checkDistance} = require('./geoLib');

exports.scooterGoOutZone = async (scooter) => {
    const zone = await Zone.findOne().lean();
    const settings = await AdminSettings.findOne().lean();
    for (const z of zone.coordinates) {
        const result = pointInsideZones([scooter.coords.lat, scooter.coords.lon], z);
        console.log('RESULT', result);
        if (!result) {
            await lockScooter(scooter.id, true);
            const text = `Device ${scooter.name} go out green zone. Scooter already locked`;
            if (settings && settings.phones) await sendMessage(settings.phones, text);
        }
    }
    return;
};

exports.scooterIncorrectCoords = async (scooter, user) => {
    await lockScooter(scooter.id, true);
    const text = `Coordinates of devise ${scooter.name} and user ${user.id} ${user.phone} incorrect. Scooter already locked`;
    const settings = await AdminSettings.findOne().lean();
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    return;
};

