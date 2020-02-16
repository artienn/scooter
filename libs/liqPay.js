const rpn = require('request-promise-native');
const sha1 = require('js-sha1');
const hash = require('object-hash');
const {liq, baseUri} = require('../config');
const moment = require('moment');
const liqPayUri = 'https://www.liqpay.ua/api/request';
const version = 3,
    currency = 'USD';
    
const server_uri = `${baseUri}/api/users/balance/callback`;

const template = async (opt) => {
    const data = (new Buffer(JSON.stringify(opt))).toString('base64');
    const sha = sha1(liq.privateKey + data + liq.privateKey);
    const buf = new Buffer(sha);
    const signature = buf.toString('base64');//hash(liq.privateKey + data + liq.privateKey, {algorithm: 'sha1', encoding: 'base64'});
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
exports.hold = async (phone, amount, description, order_id, card, card_exp_month, card_exp_year, card_cvv) => {
    const action = 'hold',
        version = '3',
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
            order_id,
            card,
            card_exp_month,
            card_exp_year,
            card_cvv
        };
    console.log(opt, JSON.stringify(opt));
    return template(opt);
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
    const hash = sha1(liq.privateKey + data + liq.publicKey);
    const buffer = new Buffer(hash);
    const base64 = buffer.toString('base64');
    if (signature === base64) return true;
    return false;
};