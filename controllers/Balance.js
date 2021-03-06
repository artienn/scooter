const {BonusCode, UserBonusHistory, UserCard, Promocode} = require('../schemas');
const {notFound, badImplementation, badRequest, paymentRequired, conflict} = require('boom');
const mongoose = require('mongoose');
const liqPay = require('../libs/liqPay');

exports.getActivePromocode = async (code, catchFlag = true) => {
    const promocode = await Promocode.findOne({code, active: true});
    if (!promocode && catchFlag) throw notFound('Promocode not found');
    return {promocode};
};

// exports.replenishmentByBonusCode = async (user, data) => {
//     const {bonusCode} = data;
//     const bonusCodeObject = await BonusCode.findOne({code: bonusCode, active: true});
//     if (!bonusCodeObject) throw notFound('Bonus code not found');
//     await this.createUserBonusHistory(user, {type: 'bonus_code', amount: bonusCodeObject.amount});
//     await BonusCode.updateOne({code: bonusCode}, {$set: {active: false}});
//     return {message: 'Ok'};
// };

// exports.createUserBonusHistory = async (user, data) => {
//     const User = mongoose.model('user');
//     const {type, amount} = data;
//     const [userBonusHistory] = await Promise.all([
//         UserBonusHistory({
//             type,
//             amount,
//             user: user._id
//         }).save(),
//         User.updateOne({_id: user._id}, {$inc: {balance: amount}})
//     ]);
//     return userBonusHistory;
// };

exports.createOrder = async (user, order_id, saveToken = false, cardNumberLastSymbols) => {
    let order = await mongoose.model('liq_pay_order_result').findOne({order_id});
    if (!order) order = new mongoose.model('liq_pay_order_result')({
        order_id,
        saveToken,
        cardNumberLastSymbols
    });
    order.user = user._id;
    await order.save();
    return {message: 'ok'};
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
    const {token} = json;
    return json;
};  

exports.subscribe = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const {amount, description, cardNumber, cardMonth, cardYear, cvv, cardId} = data;
    if (!cardId && (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv)) throw badRequest('Enter correct data');
    let token = null;
    if (cardId) {
        const {card} = await exports.getCardById(user, cardId);
        token = card.token;
    }
    const liqPayOrder = await mongoose.model('liq_pay_order')({description, amount, user: user._id, type: 'subscribe'}).save();
    const result = await liqPay.subscribe(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv, token);
    const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id}).save();
    console.log(liqPayOrderResult);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.hold = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {amount, description, cardNumber, cardMonth, cardYear, cvv, cardId} = data;
    if (!cardId && (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv)) throw badRequest('Enter correct data');
    let token = null;
    if (cardId) {
        const {card} = await exports.getCardById(user, cardId);
        token = card.token;
    }
    const liqPayOrder = await LiqPayOrder({description, amount, user: user._id, type: 'hold'}).save();
    const result = await liqPay.hold(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv, token);
    const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id}).save();
    console.log(liqPayOrderResult);
    if (result.result !== 'ok') throw paymentRequired(result.err_description);
    return result;
};

exports.holdCompletion = async (user, data) => {
    const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
    const LiqPayOrder = mongoose.model('liq_pay_order');
    const {orderId} = data;
    const liqPayOrderResult = await LiqPayOrderResult.findOne({order_id: orderId}).lean();
    console.log(liqPayOrderResult);
    if (!liqPayOrderResult) throw notFound('Order not found');
    console.log(liqPayOrderResult.status);
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

exports.createUserCard = async (user, amount, description, cardNumber, cardMonth, cardYear, cvv) => {
    const data = {
        amount, 
        description, 
        cardNumber, 
        cardMonth, 
        cardYear, 
        cvv
    };
    const result = await exports.hold(user, data);
    await exports.cancelHold(user, {orderId: result.order_id});
    const {card_token} = result;
    if (!card_token) {
        console.error('Не удалось привязать карту', result);
        throw badRequest('Не удалось привязать карту');
    }
    const userCard = await UserCard({
        cardNumberLastSymbols: cardNumber.slice(-4),
        user: user._id,
        token: card_token
    }).save();
    return {cardNumberLastSymbols: userCard.cardNumberLastSymbols};
};

exports.deleteCard = async (user, cardId) => {
    const card = await UserCard.findOne({_id: cardId, user: user._id});
    if (!card) throw notFound('Card not found');
    await UserCard.deleteOne({_id: cardId, user: user._id});
    return {message: 'ok'};
};

exports.getUserCards = async (user) => {
    const cards = await UserCard.find({user: user._id}, {token: 0});
    return {cards};
};

exports.getCardById = async (user, cardId) => {
    const card = await UserCard.findOne({user: user._id, _id: cardId});
    if (!card) throw notFound('Card not found');
    return {card};
};