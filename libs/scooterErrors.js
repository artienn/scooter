const {sendMessage} = require('./sendSms');
const {Zone, AdminSettings} = require('../schemas');
const {lockScooter} = require('./flespi');
const {pointInsideZones, checkDistance} = require('./geoLib');

exports.scooterGoOutZone = async (scooter) => {
    const zones = await Zone.find().lean();
    for (const zone of zones) {
        const result = await pointInsideZones([scooter.coords.lat, scooter.coords.lon], zone.coordinates);
        console.log('RESULT', result);
        if (!result) return false;
    }
    return true;
};

exports.blockScooterWarning = async (scooterId, scooterName, userPhone) => {
    const [settings] = await Promise.all([
        AdminSettings.findOne().lean(), 
        lockScooter(scooterId, true)
    ]);
    const text = `Device ${scooterName} go out green zone. Scooter already locked`;
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    if (userPhone) {
        await sendMessage([userPhone], text);
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

