const {Admin, AdminSettings, User} = require('../schemas');
const auth = require('vvdev-auth');
const {unauthorized} = require('boom');
const jwt = require('../libs/jwt');
const fcm = require('../libs/fcm');
const SystemQueue = require('./SystemQueue');

exports.login = async (login, password) => {
    const admin = await Admin.findOne({login});
    if (!admin) throw unauthorized('Auth error');
    const check = await auth.checkPassword(password, admin.password);
    if (!check) throw unauthorized('Auth error');
    const token = await jwt.sign({
        _id: admin._id,
        type: 'admin'
    });
    return {
        token
    };
};

exports.getAdminSettings = async () => {
    const adminSettings = await AdminSettings.findOne();
    if (!adminSettings) return {adminSettings: {}};
    return {adminSettings};
};

exports.putAdminSettings = async (phones) => {
    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
        adminSettings = new AdminSettings({});
    }
    if (phones) adminSettings.phones = phones;
    await adminSettings.save();
    return {message: 'ok'};
};

exports.sendPush = async (text, userType) => {
    const query = {};
    if (userType) query.type = userType;
    const total = await User.countDocuments(query);
    const limit = 50;
    let skip = 0;
    while(skip < total) {
        const users = await User.find(query, {firebaseIds: 1}).skip(skip).limit(limit);
        let firebaseIds = [];
        for (const user of users) {
            firebaseIds.push(...user.firebaseIds);
            if (firebaseIds.length > 10) {
                await SystemQueue.addToSystemQueue('push', null, firebaseIds, text)
            }
        }
        await fcm(firebaseIds, {}, text);
        skip += limit;
    }
    return {message: 'ok'};
};