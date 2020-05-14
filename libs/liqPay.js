const rpn = require('request-promise-native');
const {liq, baseUri} = require('../config');
const moment = require('moment');
const crypto = require('crypto');
const liqPayUri = 'https://www.liqpay.ua/api/request';
const version = 3,
    currency = 'USD';
    
const server_uri = `${baseUri}/api/balance/callback`;

const template = async (opt) => {
    if (!opt.public_key) opt.public_key = liq.publicKey;
    const data = (new Buffer(JSON.stringify(opt))).toString('base64');
    const sha = crypto.createHash('sha1').update(liq.privateKey + data + liq.privateKey).digest();
    const signature = sha.toString('base64');
    const options = {
        uri: liqPayUri,
        method: 'POST',
        form: {
            data,
            signature
        },
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        json: true
    };
    console.log(options);
    return rpn(options)
        .then(result => {
            return result;
        });
};

//Подписка
exports.subscribe = async (phone, amount, description, order_id, card, card_exp_month, card_exp_year, card_cvv) => {
    const action = 'subscribe',
        subscribe = '1',
        subscribe_periodicity = 'month',
        subscribe_date_start = moment().format('YYYY-MM-DD HH:MM:SS'),
        options = {
            server_uri,
            action,
            version,
            phone,
            amount,
            currency,
            description,
            order_id,
            subscribe,
            subscribe_date_start,
            subscribe_periodicity,
            card,
            card_exp_month,
            card_exp_year,
            card_cvv
        };
    return template(options);
};
//Двухстадийная оплата
exports.hold = async (phone, amount, description, order_id, card, card_exp_month, card_exp_year, card_cvv, card_token) => {
    const action = 'hold',
        currency = 'USD',
        opt = {
            server_uri,
            public_key: liq.publicKey,
            action,
            version,
            phone,
            amount,
            currency,
            description,
            order_id
        };
    if (card_token) {
        opt.card_token = card_token;
    } else {
        opt.card_exp_month = card_exp_month;
        opt.card_exp_year = card_exp_year;
        opt.card_cvv = card_cvv;
        opt.card = card;
    }
    console.log(opt, JSON.stringify(opt));
    return template(opt);
};

exports.holdCompletion = async (order_id) => {
    const action = 'hold_completion',
        options = {
            action,
            version,
            order_id
        };
    console.log(options);
    return template(options);
};

//Отмена платежа
exports.cancelPayment = async (order_id) => {
    const action = 'refund',
        options = {
            server_uri,
            action,
            version,
            order_id
        };
    console.log(options);
    return template(options);
};

exports.cancelSubscribe = async (order_id) => {
    const action = 'unsubscribe',
        options = {
            server_uri,
            action,
            version,
            order_id
        };
    return template(options);
};

exports.status = async (order_id) => {
    const action = 'status',
        options = {
            server_uri,
            action,
            version,
            order_id
        };
    return template(options);
};

exports.callbackPayment = async (data, signature) => {
    const sha = crypto.createHash('sha1').update(liq.privateKey + data + liq.privateKey).digest();
    const base64 = sha.toString('base64');
    if (signature === base64) return true;
    return false;
};