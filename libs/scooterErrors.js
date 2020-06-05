const {sendMessage} = require('./sendSms');
const {adminPhones} = require('../config');

exports.scooterGoOutZone = async (scooter) => {
    const text = `Девайс ${scooter.id} покинул зеленую зону`;
    await sendMessage(adminPhones, text);
};