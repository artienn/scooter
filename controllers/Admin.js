const {Admin, AdminSettings} = require('../schemas');
const auth = require('vvdev-auth');
const {unauthorized} = require('boom');
const jwt = require('../libs/jwt');

exports.login = async (login, password) => {
    const admin = await Admin.findOne({login});
    if (!admin) throw unauthorized('Auth error');
    const check = await auth.checkPassword(password, admin.password);
    if (!check) throw unauthorized('Auth error');
    const token = await jwt.sign({
        _id: admin._id
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