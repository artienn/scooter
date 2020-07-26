const {Admin, AdminSettings, User, AdminNotice} = require('../schemas');
const auth = require('vvdev-auth');
const {unauthorized} = require('boom');
const jwt = require('../libs/jwt');
const fcm = require('../libs/fcm');
const SystemQueue = require('./SystemQueue');
const admin = require('firebase-admin');
const pagination = require('../libs/pagination');

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

exports.getAdminSettings = async (admin) => {
    const select = {workTime: 1};
    if (admin) select.phones = 1;
    const adminSettings = await AdminSettings.findOne({}, select);
    if (!adminSettings) return {adminSettings: {}};
    return {adminSettings};
};

exports.putAdminSettings = async (phones, workTime) => {
    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
        adminSettings = new AdminSettings({});
    }
    if (phones) adminSettings.phones = phones;
    if (workTime) adminSettings.workTime = workTime;
    await adminSettings.save();
    return {message: 'ok'};
};

exports.sendPush = async (text, userType) => {
    const query = {};
    if (userType) query.type = userType;
    const total = await User.countDocuments(query);
    const limit = 100;
    let skip = 0;
    while(skip < total) {
        const users = await User.find(query, {firebaseIds: 1}).skip(skip).limit(limit);
        let firebaseIds = [];
        for (const user of users) {
            firebaseIds.push(...user.firebaseIds);
        }
        await fcm(firebaseIds, {}, text);
        skip += limit;
    }
    return {message: 'ok'};
};

exports.createAdminNotice = async (text) => {
    return AdminNotice({text, viewed: false}).save();
};

exports.getAdminNotice = async (viewed, limit, page) => {
    limit = limit ? parseInt(limit) : 20;
    page = page ? parseInt(page) : 1;
    if (!limit || limit < 1) limit = 20;
    if (!page || page < 1) page = 1;
    const query = {};
    if (viewed === false || viewed === true) query.viewed = viewed;
    const [adminNotices, count] = await Promise.all([
        AdminNotice.find(query).limit(limit).skip(limit * (page - 1)).sort({createdAt: -1}),
        AdminNotice.countDocuments(query)
    ]);
    return {
        adminNotices, 
        pagination: pagination(limit, page, count)
    };
};

exports.updateAdminNotice = async (_id, viewed) => {
    await AdminNotice.updateOne({_id}, {$set: {viewed}});
    return {message: 'ok'};
};