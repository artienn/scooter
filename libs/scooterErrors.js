const {sendMessage} = require('./sendSms');
const {Zone, AdminSettings, GoOutZoneOfScooter} = require('../schemas');
const {lockScooter} = require('./flespi');
const {pointInsideZones, checkDistance} = require('./geoLib');

exports.scooterGoOutZone = async (scooter) => {
    const zones = await Zone.find().lean();
    for (const zone of zones) {
        const result = await pointInsideZones([scooter.coords.lat, scooter.coords.lon], zone.coordinates);
        if (!result) return false;
    }
    return true;
};

exports.blockScooterWarning = async (_id, scooterId, scooterName, userPhone) => {
    const [settings, goOutZone] = await Promise.all([
        AdminSettings.findOne().lean(), 
        GoOutZoneOfScooter.findOne({scooter: _id}),
        // lockScooter(scooterId, true)
    ]);
    const text = `Самокат ${scooterName} вийшов із зеленої зони.  Самокат заблокований. Поверніться до зеленої зони і зателефонуйте в службу підтримки.  Ми його розблокуємо.`;
    if (settings && settings.phones && !goOutZone) await sendMessage(settings.phones, text);
    if (userPhone && !goOutZone) {
        await sendMessage([userPhone], text);
    }
    if (!goOutZone) await GoOutZoneOfScooter({scooter: _id}).save();
    return;
};

exports.scooterIncorrectCoords = async (scooter, user) => {
    await lockScooter(scooter.id, true);
    const text = `Coordinates of devise ${scooter.name} and user ${user.id} ${user.phone} incorrect. Scooter already locked`;
    const settings = await AdminSettings.findOne().lean();
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    return;
};

