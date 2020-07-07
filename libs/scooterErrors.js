const {sendMessage} = require('./sendSms');
const {AdminSettings} = require('../schemas');
const {lockScooter} = require('./flespi');

exports.scooterGoOutZone = async (scooter) => {
    const settings = await AdminSettings.findOne().lean();
    await lockScooter(scooter.id, true);
    const text = `Device ${scooter.id} go out green zone. Scooter already locked`;
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    return;
};

exports.scooterIncorrectCoords = async (scooter, user) => {
    await lockScooter(scooter.id, true);
    const text = `Coordinates of devise ${scooter.id} and user ${user.id} ${user.phone} incorrect. Scooter already locked`;
    const settings = await AdminSettings.findOne().lean();
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    return;
};

