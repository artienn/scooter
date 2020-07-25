const rpn = require('request-promise-native');
const {liq, baseUri} = require('../config');
const moment = require('moment');
const crypto = require('crypto');
const liqPayUri = 'https://www.liqpay.ua/api/request';
const version = 3,
    currency = 'UAH';
    
const server_url = `${baseUri}/api/balance/callback`;

const template = (opt) => {
    opt.server_url = server_url;
    opt.public_key = liq.publicKey;
    const data = (new Buffer(JSON.stringify(opt))).toString('base64');
    const sha = crypto.createHash('sha1').update(liq.privateKey + data + liq.privateKey).digest();
    const signature = sha.toString('base64');
    return {data, signature};
};


exports.pay = (phone, amount, description, order_id, result_url, card_token) => {
    const opt = {
        server_url,
        public_key: liq.publicKey,
        result_url,
        action: 'pay',
        version,
        phone,
        amount,
        currency,
        description,
        order_id
    };
    if (card_token) opt.card_token;
    return template(opt);
};

//Подписка
exports.subscribe = async (phone, amount, description, order_id, card, card_exp_month, card_exp_year, card_cvv, card_token) => {
    const action = 'subscribe',
        subscribe = '1',
        subscribe_periodicity = 'month',
        subscribe_date_start = moment().format('YYYY-MM-DD HH:MM:SS'),
        opt = {
            server_url,
            action,
            version,
            phone,
            amount,
            currency,
            description,
            order_id,
            subscribe,
            subscribe_date_start,
            subscribe_periodicity
        };
    if (card_token) {
        opt.card_token = card_token;
    } else {
        opt.card_exp_month = card_exp_month;
        opt.card_exp_year = card_exp_year;
        opt.card_cvv = card_cvv;
        opt.card = card;
    }
    return template(opt);
};
//Двухстадийная оплата
exports.hold = (phone, amount, description, order_id, card, card_exp_month, card_exp_year, card_cvv, card_token) => {
    const action = 'hold',
        currency = 'USD',
        opt = {
            server_url,
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
    return template(opt);
};

exports.holdCompletion = async (order_id) => {
    const action = 'hold_completion',
        options = {
            action,
            version,
            order_id
        };
    return template(options);
};

//Отмена платежа
exports.cancelPayment = (order_id) => {
    const action = 'refund',
        options = {
            server_url,
            action,
            version,
            order_id
        };
    return template(options);
};

exports.cancelSubscribe = async (order_id) => {
    const action = 'unsubscribe',
        options = {
            server_url,
            action,
            version,
            order_id
        };
    return template(options);
};

exports.status = async (order_id) => {
    const action = 'status',
        options = {
            server_url,
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