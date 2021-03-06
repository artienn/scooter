/* eslint-disable require-atomic-updates */
const jwt = require('jsonwebtoken');
const jwtKey = require('../config').keys.jwt;
const {User} = require('../schemas');
const {unauthorized, notAcceptable} = require('boom');
const mongoose = require('mongoose');

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
    try {
        let jwtToken = req.headers['x-access-token'];
        if (!jwtToken) return next(unauthorized('Ошибка авторизации'));
        jwt.verify(jwtToken, jwtKey, async (error, data) => {
            if(error)  return next(unauthorized('Ошибка авторизации'));
            req.authData = data;
            // if (!data.date || moment().diff(moment(data.date), 'minutes') > 1560) 
            //     return next(unauthorized('Ошибка авторизации'));
            let user = null;
            try {
                user = await mongoose.model('user').findById(req.authData._id, {password: 0, __v: 0}).lean();
            } catch (err) {
                return next(err);
            }
            req.user = user;
            if (!req.user) return next(unauthorized('Ошибка авторизации'));
            if (!user.phone) return next(notAcceptable('Необходимо подтвердить номер телефона'));
            next();
        });
    } catch (err) {
        next(err);
    }
};

const checkUserWithoutPhone = (req, res, next) => {
    try {
        let jwtToken = req.headers['x-access-token'];
        if (!jwtToken) return next(unauthorized('Ошибка авторизации'));
        jwt.verify(jwtToken, jwtKey, async (error, data) => {
            if(error)  return next(unauthorized('Ошибка авторизации'));
            req.authData = data;
            let user = null;
            try {
                user = await mongoose.model('user').findById(req.authData._id, {password: 0, __v: 0}).lean();
            } catch (err) {
                return next(err);
            }
            req.user = user;
            if (!req.user) return next(unauthorized('Ошибка авторизации'));
            next();
        });
    } catch (err) {
        next(err);
    }
};

exports.checkUser = checkUser;

exports.checkUserWithoutPhone = checkUserWithoutPhone;