const mongoose = require('mongoose');
const generateCode = require('../libs/generateCode');
const {conflict, tooManyRequests, badRequest, unauthorized} = require('boom');
const moment = require('moment');
const jwt = require('../libs/jwt');
const auth = require('vvdev-auth');

const checkPhoneNumber = (phone) => {
    if (!phone || phone.length !== 13 || phone.slice(0, 4) !== '+380' ) return true;
    return false;
};

class User {
    static async register (data) {
        const ConfirmCode = mongoose.model('confirm_code');
        const {phone, code, email, password, repeatPassword} = data;
        if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
        const [user, confirmCode] = await Promise.all([
            this.findOne({phone}),
            ConfirmCode.findOne({phone})
        ]);
        
        if (user) throw conflict('User already exists');
        if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
        confirmCode.code = null;

        const regex = new RegExp('(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]{8,}');
        if (!password || password !== repeatPassword || !regex.test(password)) throw badRequest('Enter correct password');
        const hash = await auth.hashPassword(password);

        const [registerUser] = await Promise.all([
            this({
                phone,
                password: hash
            }).save(),
            confirmCode.save()
        ]);

        const token = await jwt.sign({
            _id: registerUser._id,
            createdAt: new Date()
        });

        return {
            token,
            _id: registerUser._id
        };
    }

    static async sendCode(data) {
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
    }

    static async confirmCode(data) {
        const ConfirmCode = mongoose.model('confirm_code');
        const {phone, code, password} = data;
        if (!password) throw badRequest('Enter password');
        const confirmCode = await ConfirmCode.findOne({phone});
        if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
        confirmCode.code = null;
        const user = await this.login({password, phone});
        await confirmCode.save();
        const token = await jwt.sign({
            _id: user._id,
            createdAt: new Date()
        });
        return {
            token,
            _id: user._id
        };
    }

    static async login(data) {
        const {phone, password} = data;
        if (!password) throw badRequest('Enter password');
        if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
        const user = await this.findOne({phone});
        const result = await auth.checkPassword(password, user.password);
        if (!result) throw unauthorized('Auth error');
        return {phone, email: user.email, _id: user._id};
    }

    static async loginAndSendCode (data) {
        const {phone, password} = data;
        await this.login({phone, password});
        return this.sendCode({phone});
    }
}

module.exports = User;