const {BonusCode, UserBonusHistory} = require('../schemas');
const {notFound, badImplementation, badRequest} = require('boom');
const mongoose = require('mongoose');
const liqPay = require('../libs/liqPay');
const {LiqPayOrder, LiqPayOrderResult} = require('../schemas');

exports.replenishmentByBonusCode = async (user, data) => {
    const {bonusCode} = data;
    const bonusCodeObject = await BonusCode.findOne({code: bonusCode});
    if (!bonusCodeObject) throw notFound('Bonus code not found');
    await this.createUserBonusHistory(user, {type: 'bonus_code', amount: bonusCodeObject.amount});
    return {message: 'Ok'};
};

exports.createUserBonusHistory = async (user, data) => {
    const User = mongoose.model('user');
    const {type, amount} = data;
    const [userBonusHistory] = await Promise.all([
        UserBonusHistory({
            type,
            amount,
            user: user._id
        }).save(),
        User.updateOne({_id: user._id}, {$inc: {balance: amount}})
    ]);
    return userBonusHistory;
};

exports.callbackPayment = async (query) => {
    const {data, signature} = query;
    if (!data || !signature) throw badRequest('');
    const check = liqPay.callbackPayment(data, signature);
    if (!check) throw badImplementation('Server error');
    let json = data;
    if (typeof data === 'string')
        json = JSON.parse(data);
    console.log(json);
    return json;
};  

exports.subscribe = async (user, data) => {
    const {amount, description, cardNumber, cardMonth, cardYear, cvv} = data;
    if (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder({description, amount, user: user._id, type: 'subscribe'}).save();
    const result = await liqPay.subscribe(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv);
    const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id}).save();
    console.log(liqPayOrderResult);
    return {status: liqPayOrderResult.status};
};

exports.hold = async (user, data) => {
    const {amount, description, cardNumber, cardMonth, cardYear, cvv} = data;
    if (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder({description, amount, user: user._id, type: 'hold'});
    const result = await liqPay.hold(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv);
    const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id});
    console.log(liqPayOrderResult);
    return {status: liqPayOrderResult.status};
};

exports.status = async (user, data) => {
    const {orderId} = data;
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id});
    if (!liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.status(orderId);
    console.log(result);
    return {status: result.status};
};

exports.cancelPayment = async (user, data) => {
    const {orderId} = data;
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id, type: 'hold'});
    if (!liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.cancelPayment(orderId);
    const liqPayOrderResult = await LiqPayOrderResult(result).save();
    if (result.status === 'success') await liqPayOrder.updateOne({_id: orderId}, {$set: {cancelled: {value: true, ref: liqPayOrderResult._id}}});
    console.log(result);
    return {status: liqPayOrderResult.status};
};

exports.cancelSubscribe = async (user, data) => {
    const {orderId} = data;
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id, type: 'subscribe'});
    if (liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.cancelSubscribe(orderId);
    const liqPayOrderResult = await LiqPayOrderResult(result).save();
    if (result.status === 'success') await liqPayOrder.updateOne({_id: orderId}, {$set: {cancelled: {value: true, ref: liqPayOrderResult._id}}});
    console.log(result);
    return {status: liqPayOrderResult.status};
};