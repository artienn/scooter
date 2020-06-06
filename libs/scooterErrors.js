const {sendMessage} = require('./sendSms');
const {AdminSettings} = require('../schemas');

exports.scooterGoOutZone = async (scooter) => {
    const settings = await AdminSettings.findOne().lean();
    const text = `Девайс ${scooter.id} покинул зеленую зону`;
    if (settings && settings.phones) await sendMessage(settings.phones, text);
};
