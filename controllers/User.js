const mongoose = require('mongoose');
const generateCode = require('../libs/generateCode');
const {conflict, tooManyRequests, badRequest, unauthorized} = require('boom');
const moment = require('moment');
const jwt = require('../libs/jwt');
const auth = require('vvdev-auth');
const facebook = require('../libs/facebook');
const {validate} = require('email-validator');

const checkPhoneNumber = (phone) => {
    if (!phone || phone.length !== 13 || phone.slice(0, 4) !== '+380' ) return true;
    return false;
};

const checkRepeatPassword = (password, repeatPassword) => {
    const regex = new RegExp('(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]{8,}');
    if (!password || password !== repeatPassword || !regex.test(password)) throw badRequest('Enter correct password');
};

exports.facebookLogin = async (data) => {
    const {code} = data;
    const tokenObject = await facebook.checkCode(code);
    const res = await facebook.data(tokenObject.access_token);
    if (!res.data || !res.data.user_id) throw unauthorized('Auth error');
    let user = await this.findOne({'fb.id': res.data.user_id});
    if (!user)
        user = await this({fb: {id: res.data.user_id}, confirm: false}).save();
    const token = await jwt.sign({
        _id: user._id,
        createdAt: new Date()
    });
    return {
        token,
        _id: user._id
    };   
};

exports.facebookLoginPhoneConfirm = async (user, data) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const {code, phone} = data;
    const confirmCodeFind = {user: user._id, phone, code};
    const confirmCode = await ConfirmCode.findOne(confirmCodeFind);
    if (!confirmCode) throw unauthorized('Auth error');
    const [token] = await Promise.all([
        jwt.sign({_id: user._id, createdAt: new Date()}),
        ConfirmCode.deleteOne(confirmCodeFind),
        this.update({_id: user._id}, {$set: {phone}})
    ]);
    return {
        token,
        _id: user._id
    };
};

exports.facebookLoginPhoneUpdate = async (user, data) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const {phone} = data;
    const code = generateCode();
    await ConfirmCode({phone, code, user: user._id}).save();
    return {code, message: 'Подтвердите номер телефона'};
};

exports.register = async (data) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const {phone, code, password, repeatPassword} = data;
    if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
    const confirmCodeFind = {phone, code};
    const [user, confirmCode] = await Promise.all([
        this.findOne({phone}),
        ConfirmCode.findOne(confirmCodeFind)
    ]);
    checkRepeatPassword(password, repeatPassword);
    if (user) throw conflict('User already exists');
    if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
    confirmCode.code = null;

    
    const hash = await auth.hashPassword(password);

    const [registerUser] = await Promise.all([
        this({
            phone,
            password: hash
        }).save(),
        confirmCode.deleteOne(confirmCodeFind)
    ]);

    const token = await jwt.sign({
        _id: registerUser._id,
        createdAt: new Date()
    });

    return {
        token,
        _id: registerUser._id
    };
};

exports.checkCode = async (data) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const {phone, code} = data;
    const confirmCode = await ConfirmCode.findOne({phone, code});
    if (!confirmCode) throw unauthorized('Auth error');
    return {message: 'ok'};
};

exports.sendCode = async (data) => {
    const {phone} = data;
    const ConfirmCode = mongoose.model('confirm_code');
    if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
    let confirmCode = await ConfirmCode.findOne({phone});
    if (confirmCode && confirmCode.updatedAt && moment().diff(confirmCode.updatedAt, 'minutes') <= 2) throw tooManyRequests('Try again later');
    if (!confirmCode) confirmCode = new ConfirmCode({phone});
    confirmCode.code = generateCode();
    await confirmCode.save();
    return {
        code: confirmCode.code,
        message: 'Code sent to your phone number'
    };
};

exports.confirmCode = async (data) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const {phone, code, password} = data;
    const confirmCodeFind = {phone, code};
    if (!password) throw badRequest('Enter password');
    const confirmCode = await ConfirmCode.findOne(confirmCodeFind);
    if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
    confirmCode.code = null;
    const user = await this.login({password, phone});
    await confirmCode.deleteOne(confirmCodeFind);
    const token = await jwt.sign({
        _id: user._id,
        createdAt: new Date()
    });
    return {
        token,
        _id: user._id
    };
};

exports.login = async (data) => {
    const {phone, password, firebaseId} = data;
    if (!password) throw badRequest('Enter password');
    if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
    const user = await this.findOne({phone});
    const result = await auth.checkPassword(password, user.password);
    if (!result) throw unauthorized('Auth error');
    if (firebaseId) await this.putFirebaseId(user, firebaseId);
    return {phone, email: user.email, _id: user._id};
};

exports.putFirebaseId = async (user, firebaseId) => {
    return this.updateOne({_id: user._id}, {addToSet: {firebaseIds: firebaseId}});
};

exports.deleteFirebaseId = async (user, firebaseId) => {
    return this.updateOne({_id: user._id}, {pull: {firebaseIds: firebaseId}});
};

exports.resetPassword = async (data) => {
    const ConfirmCode = mongoose.model('confirm_code');
    const {phone, code, password, repeatPassword} = data;
    if (!code) throw badRequest('Enter code');
    checkRepeatPassword(password, repeatPassword);
    const confirmCodeFind = {phone, code};
    const [user, confirmCode] = await Promise.all([
        this.findOne({phone}),
        ConfirmCode.findOne(confirmCodeFind)
    ]);
    if (!confirmCode || !user || !confirmCode.code || confirmCode.code !== code) throw unauthorized('Auth error');
    confirmCode.code = null;
    user.password = await auth.hashPassword(password);
    const [token] = await Promise.all([
        jwt.sign({_id: user._id, createdAt: new Date()}),
        user.save(),
        ConfirmCode.deleteOne(confirmCodeFind)
    ]);
    return {
        token,
        _id: user._id
    };
};

exports.loginAndSendCode = async (data) => {
    const {phone, password} = data;
    await this.login({phone, password});
    return this.sendCode({phone});
};

exports.createProblemRequest = async (userId, description, scooterId) => {
    const request = await mongoose.model('problem_request')({
        user: userId,
        description,
        scooter: scooterId
    }).save();

    return request;
};

exports.updateInfo = async (user, firstName, lastName, middleName, email, birthday) => {
    const data = {};
    const queries = [];
    if ((firstName || firstName === '') && user.firstName !== firstName) data.firstName = firstName;
    if ((lastName || lastName === '') && user.lastName !== lastName) data.lastName = lastName;
    if ((middleName || middleName === '') && user.middleName !== middleName) data.middleName = middleName;
    if ((email || email === '') && user.email !== email) {
        if (email && !validate(email)) throw badRequest('Incorrect email');
        queries.push({email});
        data.email = email;
    }
    if (birthday) data.birthday = birthday;
    await this.updateOne({_id: user._id}, {$set: data});
    return {message: 'ok'};
};