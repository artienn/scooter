const {sendMessage} = require('./sendSms');
const {Zone, AdminSettings, GoOutZoneOfScooter} = require('../schemas');
const {lockScooter} = require('./flespi');
const {pointInsideZones, checkDistance} = require('./geoLib');
const Admin = require('../controllers/Admin');

const getAdminPhonesAndSendMessage = async (text) => {
    const [settings] = await Promise.all([
        AdminSettings.findOne().lean(),
        Admin.createAdminNotice(text)
    ]);
    // if (settings && settings.phones) return sendMessage(settings.phones, text);
    return;
};
exports.scooterGoOutZone = async (scooter) => {
    const zones = await Zone.find().lean();
    for (const zone of zones) {
        const result = await pointInsideZones([scooter.coords.lat, scooter.coords.lon], zone.coordinates);
        if (result) return true;
    }
    return false;
};

exports.blockScooterWarning = async (_id, scooterId, scooterName, userPhone) => {
    const [goOutZone] = await Promise.all([
        GoOutZoneOfScooter.findOne({scooter: _id}),
        // lockScooter(scooterId, true)
    ]);
    const text = `Самокат ${scooterName} покинув зелену зону. Поверніться до зеленої зони.`;
    await getAdminPhonesAndSendMessage(text);
    console.error('USERPHONE', userPhone, goOutZone ? goOutZone.scooter : null);
    if (userPhone && !goOutZone) {
        await sendMessage([userPhone], text);
    }
    if (!goOutZone) await GoOutZoneOfScooter({scooter: _id}).save();
    return;
};

exports.scooterIncorrectCoords = async (scooter, user) => {
    await lockScooter(scooter.id, true);
    const text = `Coordinates of devise ${scooter.name} and user ${user.id} ${user.phone} incorrect. Scooter already locked`;
    // await getAdminPhonesAndSendMessage(text);
    return;
};

exports.scooterUpdateCoordsWithoutContract = async (scooter, send) => {
    await lockScooter(scooter.id, true);
    const text = `Coordinates of devise ${scooter.name} update without contract. HE IS BEING STOLEN!!!`;
    // if (!send) await getAdminPhonesAndSendMessage(text);
    return;
};  

exports.scooterWithoutCoords = async (scooter) => {
    const text = `Coordinates of devise ${scooter.name} is undefined! Check it!!!`;
    // await getAdminPhonesAndSendMessage(text);
    return;
};

