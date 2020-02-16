const {BonusCode, UserBonusHistory} = require('../schemas');
const {notFound, badImplementation, badRequest, paymentRequired} = require('boom');
const mongoose = require('mongoose');
const liqPay = require('../libs/liqPay');


exports.replenishmentByBonusCode = async (user, data) => {
    const {bonusCode} = data;
    const bonusCodeObject = await BonusCode.findOne({code: bonusCode, active: true});
    if (!bonusCodeObject) throw notFound('Bonus code not found');
    await this.createUserBonusHistory(user, {type: 'bonus_code', amount: bonusCodeObject.amount});
    await BonusCode.updateOne({code: bonusCode}, {$set: {active: false}});
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
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const {amount, description, cardNumber, cardMonth, cardYear, cvv} = data;
    if (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv) throw badRequest('Enter correct data');
    const liqPayOrder = await mongoose.model('liq_pay_order')({description, amount, user: user._id, type: 'subscribe'}).save();
    const result = await liqPay.subscribe(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv);
    const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id}).save();
    console.log(liqPayOrderResult);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.hold = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {amount, description, cardNumber, cardMonth, cardYear, cvv} = data;
    if (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder({description, amount, user: user._id, type: 'hold'}).save();
    const result = await liqPay.hold(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv);
    const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id}).save();
    console.log(liqPayOrderResult);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.holdCompletion = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {orderId} = data;
    const liqPayOrderResult = await LiqPayOrderResult.findOne({order_id: orderId});
    console.log(liqPayOrderResult);
    if (!liqPayOrderResult) throw notFound('Order not found');
    if (liqPayOrderResult.status !== 'hold_wait') throw badRequest('Action is not the hold');
    await LiqPayOrder({user: user._id, type: 'hold_completion'});
    const result = await liqPay.holdCompletion(orderId);
    await LiqPayOrderResult(result).save();
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.status = async (user, data) => {
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {orderId} = data;
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id});
    if (!liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.status(orderId);
    console.log(result);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.cancelHold = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {orderId} = data;
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id, type: 'hold'});
    if (!liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.cancelPayment(orderId);
    const liqPayOrderResult = await LiqPayOrderResult(result).save();
    if (result.status === 'success') await liqPayOrder.updateOne({_id: orderId}, {$set: {cancelled: {value: true, ref: liqPayOrderResult._id}}}).save();
    console.log(result);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.cancelSubscribe = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {orderId} = data;
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id, type: 'subscribe'});
    if (liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.cancelSubscribe(orderId);
    const liqPayOrderResult = await LiqPayOrderResult(result).save();
    if (result.status === 'success') await liqPayOrder.updateOne({_id: orderId}, {$set: {cancelled: {value: true, ref: liqPayOrderResult._id}}});
    console.log(result);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};