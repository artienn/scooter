const mongoose = require('mongoose');
const generateCode = require('../libs/generateCode');
const {tooManyRequests, badRequest, unauthorized, notFound} = require('boom');
const moment = require('moment');
const {UserCoords, User} = require('../schemas');
const jwt = require('../libs/jwt');
// const auth = require('vvdev-auth');
// const facebook = require('../libs/facebook');
const {validate} = require('email-validator');
const {sendMessage} = require('../libs/sendSms');
const pagination = require('../libs/pagination');

const checkPhoneNumber = (phone) => {
    if (!phone || phone.length !== 13 || phone.slice(0, 4) !== '+380' ) return true;
    return false;
};

// const checkRepeatPassword = (password, repeatPassword) => {
//     const regex = new RegExp('(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]{8,}');
//     if (!password || password !== repeatPassword || !regex.test(password)) throw badRequest('Enter correct password');
// };

// exports.facebookLogin = async (data) => {
//     const {code} = data;
//     const tokenObject = await facebook.checkCode(code);
//     const res = await facebook.data(tokenObject.access_token);
//     if (!res.data || !res.data.user_id) throw unauthorized('Auth error');
//     let user = await User.findOne({'fb.id': res.data.user_id});
//     if (!user)
//         user = await User({fb: {id: res.data.user_id}, confirm: false}).save();
//     const token = await jwt.sign({
//         _id: user._id,
//         createdAt: new Date()
//     });
//     return {
//         token,
//         _id: user._id
//     };   
// };

exports.getUserList = async (page, limit, phone, name, type) => {
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 20;
    if (page < 1 || limit < 1) throw badRequest('Incorrect pagination data');
    const skip = limit * (page - 1);
    const query = {};
    if (phone) {
        query.phone = new RegExp(phone, 'gi');
    }
    if (name) {
        query.$or = [{
            firstName: new RegExp(name, 'gi')
        }, {
            lastName: new RegExp(name, 'gi')
        }, {
            middleName: new RegExp(name, 'gi')
        }];
    }
    if (type) {
        query.type = type;
    }
    const [total, users] = await Promise.all([
        User.countDocuments(query),
        User.find(query).limit(limit).skip(skip).lean()
    ]);
    return {
        users,
        pagination: pagination(limit, page, total)
    };
};

exports.getUserById = async (_id) => {
    const user = await User.findById(_id).lean();
    if (!user) throw notFound('User not found');
    return {user};
};

exports.updateUserCoords = async (user, lat, lon) => {
    if (!lat || !lon) throw badRequest('Enter coords');
    lat = parseFloat(lat);
    lon = parseFloat(lon);
    await Promise.all([
        UserCoords({
            user: user._id,
            lat,
            lon
        }).save(),
        User.updateOne({_id: user._id}, {$set: {
            lat,
            lon
        }})
    ]);
    return {message: 'ok'};
};

// exports.facebookLoginPhoneConfirm = async (user, data) => {
//     const ConfirmCode = mongoose.model('confirm_code');
//     const {code, phone} = data;
//     const confirmCodeFind = {user: user._id, phone, code};
//     const confirmCode = await ConfirmCode.findOne(confirmCodeFind);
//     if (!confirmCode) throw unauthorized('Auth error');
//     const [token] = await Promise.all([
//         jwt.sign({_id: user._id, createdAt: new Date()}),
//         ConfirmCode.deleteOne(confirmCodeFind),
//         User.updateOne({_id: user._id}, {$set: {phone}})
//     ]);
//     return {
//         token,
//         _id: user._id
//     };
// };

// exports.facebookLoginPhoneUpdate = async (user, data) => {
//     const ConfirmCode = mongoose.model('confirm_code');
//     const {phone} = data;
//     const code = generateCode();
//     await ConfirmCode({phone, code, user: user._id}).save();
//     await sendMessage([phone], `Код подтверждения: ${code}`);
//     return {code, message: 'Подтвердите номер телефона'};
// };

exports.checkCode = async (phone, code) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const confirmCode = await ConfirmCode.findOne({phone, code});
    if (!confirmCode) throw unauthorized('Auth error');
    return {message: 'ok'};
};

exports.sendCode = async (phone) => {
    const ConfirmCode = mongoose.model('confirm_code');
    if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
    let confirmCode = await ConfirmCode.findOne({phone});
    if (confirmCode && confirmCode.updatedAt && moment().diff(confirmCode.updatedAt, 'seconds') <= 10) throw tooManyRequests('Try again later');
    if (!confirmCode) confirmCode = new ConfirmCode({phone});
    confirmCode.code = generateCode();
    await confirmCode.save();
    await sendMessage([phone], `Код подтверждения: ${confirmCode.code}`);
    return {
        code: confirmCode.code,
        message: 'Code sent to your phone number'
    };
};

exports.confirmCode = async (phone, code) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const confirmCodeFind = {phone, code};
    const confirmCode = await ConfirmCode.findOne(confirmCodeFind);
    if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
    confirmCode.code = null;
    let user = await User.findOne({phone});
    if (!user) {
        user = await User({
            phone,
            type: 'normal'
        }).save();
    }
    await confirmCode.deleteOne(confirmCodeFind);
    const token = await jwt.sign({
        _id: user._id,
        createdAt: new Date()
    });
    return {
        token,
        _id: user._id,
        type: user.type
    };
};

exports.putFirebaseId = async (user, firebaseId) => {
    return User.updateOne({_id: user._id}, {addToSet: {firebaseIds: firebaseId}});
};

exports.deleteFirebaseId = async (user, firebaseId) => {
    return User.updateOne({_id: user._id}, {pull: {firebaseIds: firebaseId}});
};

// exports.resetPassword = async (data) => {
//     const ConfirmCode = mongoose.model('confirm_code');
//     const {phone, code, password, repeatPassword} = data;
//     if (!code) throw badRequest('Enter code');
//     checkRepeatPassword(password, repeatPassword);
//     const confirmCodeFind = {phone, code};
//     const [user, confirmCode] = await Promise.all([
//         User.findOne({phone}),
//         ConfirmCode.findOne(confirmCodeFind)
//     ]);
//     if (!confirmCode || !user || !confirmCode.code || confirmCode.code !== code) throw unauthorized('Auth error');
//     confirmCode.code = null;
//     user.password = await auth.hashPassword(password);
//     const [token] = await Promise.all([
//         jwt.sign({_id: user._id, createdAt: new Date()}),
//         user.save(),
//         ConfirmCode.deleteOne(confirmCodeFind)
//     ]);
//     return {
//         token,
//         _id: user._id
//     };
// };

exports.loginAndSendCode = async (data) => {
    const {phone, password} = data;
    await exports.login({phone, password});
    return exports.sendCode({phone});
};

exports.createProblemRequest = async (userId, description, scooterId) => {
    const request = await mongoose.model('problem_request')({
        user: userId,
        description,
        scooter: scooterId
    }).save();

    return request;
};

exports.updateInfo = async (userId, user, firstName, lastName, middleName, email, birthday) => {
    const data = {};
    const queries = [];
    if (userId) {
        user = await exports.getUserById(userId);
    }
    if ((firstName || firstName === '') && user.firstName !== firstName) data.firstName = firstName;
    if ((lastName || lastName === '') && user.lastName !== lastName) data.lastName = lastName;
    if ((middleName || middleName === '') && user.middleName !== middleName) data.middleName = middleName;
    if ((email || email === '') && user.email !== email) {
        if (email && !validate(email)) throw badRequest('Incorrect email');
        queries.push({email});
        data.email = email;
    }
    if (birthday) data.birthday = birthday;
    await User.updateOne({_id: user._id}, {$set: data});
    return {message: 'ok'};
};