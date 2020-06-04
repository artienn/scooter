const {sendMessage} = require('./sendSms');

exports.scooterGoOutZone = async (scooter) => {
    await sendMessage();
};