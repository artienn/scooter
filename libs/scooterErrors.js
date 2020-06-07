const {sendMessage} = require('./sendSms');
const {AdminSettings} = require('../schemas');
const {blockScooter} = require('./flespi');

exports.scooterGoOutZone = async (scooter) => {
    const settings = await AdminSettings.findOne().lean();
    await blockScooter(scooter.id, 1);
    const text = `Device ${scooter.id} go out green zone. Scooter already locked`;
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    return;
};

exports.scooterIncorrectCoords = async (scooter, user) => {
    await blockScooter(scooter.id, 1);
    const text = `Coordinates of devise ${scooter.id} and user ${user.id} ${user.phone} incorrect. Scooter already locked`;
    const settings = await AdminSettings.findOne().lean();
    if (settings && settings.phones) await sendMessage(settings.phones, text);
    return;
};

