/* eslint-disable require-atomic-updates */
const jwt = require('jsonwebtoken');
const jwtKey = require('../config').keys.jwt;
const {User} = require('../schemas');
const {unauthorized} = require('boom');

exports.sign = async (body) => {
    return new Promise((res, rej) => {
        jwt.sign(body, jwtKey, (err, token) => {
            if (err) {
                console.error(err);
                rej(err);
            }
            res(token);
        });
    });
};

const checkUser = (req, _res, next) => {
    let jwtToken = req.headers['x-access-token'];
    if (!jwtToken) return next(unauthorized('Ошибка авторизации'));
    jwt.verify(jwtToken, jwtKey, async (error, data) => {
        if(error)  return next(unauthorized('Ошибка авторизации'));
        req.authData = data;
        // if (!data.date || moment().diff(moment(data.date), 'minutes') > 1560) 
        //     return next(unauthorized('Ошибка авторизации'));
        const user = await User.findById(req.authData._id, {password: 0, __v: 0}).lean();
        req.user = user;
        if (!req.user) return next(unauthorized('Ошибка авторизации'));
        next();
    });
};

exports.checkUser = checkUser;