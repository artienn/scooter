const mongoose = require('mongoose');
const generateCode = require('../libs/generateCode');
const {conflict, tooManyRequests, badRequest, unauthorized} = require('boom');
const moment = require('moment');
const jwt = require('../libs/jwt');

const checkPhoneNumber = (phone) => {
    if (!phone || phone.length !== 13 || phone.slice(0, 4) !== '+380' ) return true;
    return false;
};

class User {
    static async register (data) {
        const ConfirmCode = mongoose.model('confirm_code');
        const {phone, code, email} = data;
        if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
        const [user, confirmCode] = await Promise.all([
            this.findOne({phone}),
            ConfirmCode.findOne({phone})
        ]);
        
        if (user) throw conflict('User already exists');
        if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
        confirmCode.code = null;
        const [registerUser] = await Promise.all([
            this({phone, email}).save(),
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
            code: confirmCode.code
        };
    }

    static async login(data) {
        const ConfirmCode = mongoose.model('confirm_code');
        const {phone, code} = data;
        if (checkPhoneNumber(phone)) throw badRequest('Enter correct phone number');
        const [user, confirmCode] = await Promise.all([
            this.findOne({phone}),
            ConfirmCode.findOne({phone})
        ]);
        if (!confirmCode || confirmCode.code === null || confirmCode.code !== code) throw unauthorized('Auth error');
        confirmCode.code = null;
        if (!user) return {registerRequire: true, message: 'Register require'};
        const [token] = await Promise.all([
            jwt.sign({_id: user._id}),
            confirmCode.save()
        ]);
        return {
            token,
            _id: user._id,
            registerRequire: false
        };
    }
}

module.exports = User;