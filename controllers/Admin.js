const {Admin} = require('../models');
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