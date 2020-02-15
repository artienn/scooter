const LiqPay = require('liqpay');
const rpn = require('request-promise-native');
const sha1 = require('js-sha1');
const {liq, baseUri} = require('../config');
const liqpay = new LiqPay(liq.publicKey, liq.privateKey);
const moment = require('moment');
const liqPayUri = 'https://www.liqpay.ua/api/request';
const version = 3,
    currency = 'USD';
const result_url = '';
const server_uri = `${baseUri}/api/users/balance/callback`;

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
    liqpay.api('request', options, result => {
        console.log( result );
        return result;
    });
};
//Двухстадийная оплата
exports.hold = async (phone, amount, description, order_id, card, card_exp_month, card_exp_year, card_cvv) => {
    const action = 'hold',
        version = '3',
        currency = 'USD',
        opt = {
            server_uri,
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

    const data = (new Buffer(JSON.stringify(opt))).toString('base64');
    const hash = sha1(liq.privateKey + JSON.stringify(opt) + liq.publicKey);
    const buffer = new Buffer(hash);
    const signature = buffer.toString('base64');
    const options = {
        uri: liqPayUri + `?data=${data}&signature=${signature}`,
        method: 'POST',
        json: true
    };
    console.log(options);
    return rpn(options)
        .then(result => {
            return result;
        });
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
    liqpay.api('request', options, result => {
        console.log( result );
        return result;
    });
};

exports.cancelSubscribe = async (order_id) => {
    const action = 'unsubscribe',
        options = {
            server_uri,
            action,
            version,
            order_id
        };
    liqpay.api('request', options, result => {
        console.log( result );
        return result;
    });
};

exports.status = async (order_id) => {
    const action = 'status',
        options = {
            server_uri,
            action,
            version,
            order_id
        };
    liqpay.api('request', options, result => {
        console.log(result);
        return result;
    });
};

exports.callbackPayment = async (data, signature) => {
    const hash = sha1(liq.privateKey + data + liq.publicKey);
    const buffer = new Buffer(hash);
    const base64 = buffer.toString('base64');
    if (signature === base64) return true;
    return false;
};