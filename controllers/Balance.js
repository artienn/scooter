const {BonusCode, UserBonusHistory, UserCard, Promocode, Tariff, LiqPayOrder, User, UserBalanceHistory} = require('../schemas');
const {notFound, badImplementation, badRequest, paymentRequired, conflict} = require('boom');
const mongoose = require('mongoose');
const liqPay = require('../libs/liqPay');

exports.getActivePromocode = async (code, catchFlag = true) => {
    const promocode = await Promocode.findOne({code, active: true});
    if (!promocode && catchFlag) throw notFound('Promocode not found');
    return {promocode};
};

exports.putPromocode = async (code, active, contractStatus, salePercent) => {
    let promocode = await Promocode.findOne({code});
    if (!promocode) {
        promocode = new Promocode({code});
    }
    if (active === true || active === false) promocode.active = active;
    if (contractStatus) promocode.contractStatus = contractStatus;
    if (salePercent || salePercent === 0) promocode.salePercent = salePercent;
    await promocode.save();
};

exports.getPromocodes = async () => {
    const promocodes = await Promocode.find();
    return {promocodes};
};

exports.updateTariff = async (type, name = '', price = 1, maxTime = null, userType) => {
    if (!type) throw badRequest('Enter tariff type');
    let tariff = await Tariff.findOne({type});
    if (!tariff) {
        tariff = new Tariff({
            type
        });
    }
    if (name) tariff.name = name;
    if (userType) tariff.userType = userType;
    if (price) tariff.price = price;
    if (maxTime) tariff.maxTime = maxTime;
    await tariff.save();
    return {message: 'ok'};
};

exports.getTariffs = async (user) => {
    let type = null;
    if (user) {
        if (user.type === 'vip') type = 'vip';
        else type = 'normal';
    }
    const query = {};
    if (type) query.userType = type;
    const tariffs = await Tariff.find(query);
    return {tariffs};
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

exports.createLiqPayOrderResult = async (data) => {
    return mongoose.model('liq_pay_order_result')(data).save();
};

exports.putUserBalance = async (userId, amount, type) => {
    return Promise.all([
        User.updateOne({_id: userId}, {$inc: {balance: amount}}),
        UserBalanceHistory({user: userId, type, amount})
    ]);
};

exports.callbackPayment = async (query) => {
    const {data, signature} = query;
    console.log(data, signature);
    if (!data || !signature) throw badRequest('');
    const check = liqPay.callbackPayment(data, signature);
    if (!check) throw badImplementation('Server error');
    let json = new Buffer(data, 'base64').toString('utf8');
    console.log(json);
    json = json.replace(' ', '');
    if (typeof json === 'string')
        json = JSON.parse(json);
    console.log('JSON', json);
    await exports.createLiqPayOrderResult(json);
    const {order_id, status, amount} = json;
    const liqPayOrder = await LiqPayOrder.findOne({_id: order_id});
    if (liqPayOrder && liqPayOrder.user && (status === 'wait_accept' || status === 'success')) {
        await exports.putUserBalance(liqPayOrder.user, amount, 'pay');
    }
    // if (order_id) {
    //     await UserCard.updateOne({orderId: order_id}, {$set: {confirm: true, token: 'oasdoiasjdoijasoidjaosijdiajsdio'}});
    // }
    return json;
};  

// exports.subscribe = async (user, data) => {
//     const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
//     const {amount, description, cardNumber, cardMonth, cardYear, cvv, cardId} = data;
//     if (!cardId && (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv)) throw badRequest('Enter correct data');
//     let token = null;
//     if (cardId) {
//         const {card} = await exports.getCardById(user, cardId);
//         token = card.token;
//     }
//     const liqPayOrder = await mongoose.model('liq_pay_order')({description, amount, user: user._id, type: 'subscribe'}).save();
//     const result = await liqPay.subscribe(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv, token);
//     const liqPayOrderResult = await LiqPayOrderResult({...result, id: liqPayOrder._id}).save();
//     console.log(liqPayOrderResult);
//     if (result.result !== 'ok') throw paymentRequired(result.err_description);
//     return result;
// };

exports.pay = async (user, type = 'pay', amount, description, cardNumberLastSymbols, result_url, cardId) => {
    let card = null;
    if (cardId) {
        const cardResult = await exports.getCardById(user, cardId);
        card = cardResult.card;
    }
    const order = await mongoose.model('liq_pay_order')({
        user: user._id,
        amount, 
        description,
        type,
        cardNumberLastSymbols,
        result_url
    }).save();
    if (cardNumberLastSymbols && !card) {
        await exports.createUserCard(user, null, cardNumberLastSymbols, String(order._id));
    }
    const result = await liqPay.pay(user.phone.slice(1), amount, description, String(order._id), result_url, card ? card.token : null);
    return result;
};

// exports.hold = async (user, data) => {
//     const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
//     const LiqPayOrder = mongoose.model('liq_pay_order');
//     const {amount, description, cardNumber, cardMonth, cardYear, cvv, cardId} = data;
//     if (!cardId && (!amount || !description || !cardMonth || !cardNumber || !cardYear || !cvv)) throw badRequest('Enter correct data');
//     let token = null;
//     if (cardId) {
//         const {card} = await exports.getCardById(user, cardId);
//         token = card.token;
//     }
//     const liqPayOrder = await LiqPayOrder({description, amount, user: user._id, type: 'hold'}).save();
//     const result = liqPay.hold(user.phone.slice(1), amount, description, liqPayOrder._id, cardNumber, cardMonth, cardYear, cvv, token);
//     return result;
// };

// exports.holdCompletion = async (user, data) => {
//     const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
//     const LiqPayOrder = mongoose.model('liq_pay_order');
//     const {orderId} = data;
//     const liqPayOrderResult = await LiqPayOrderResult.findOne({order_id: orderId}).lean();
//     console.log(liqPayOrderResult);
//     if (!liqPayOrderResult) throw notFound('Order not found');
//     console.log(liqPayOrderResult.status);
//     if (liqPayOrderResult.status !== 'hold_wait') throw badRequest('Action is not the hold');
//     await LiqPayOrder({user: user._id, type: 'hold_completion'});
//     const result = await liqPay.holdCompletion(orderId);
//     await LiqPayOrderResult(result).save();
//     if (result.result !== 'ok') throw paymentRequired(result.err_description);
//     return result;
// };

// exports.status = async (user, data) => {
//     const LiqPayOrder = mongoose.model('liq_pay_order');
//     const {orderId} = data;
//     if (!orderId) throw badRequest('Enter correct data');
//     const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id});
//     if (!liqPayOrder) throw notFound('Order is not found');
//     const result = await liqPay.status(orderId);
//     console.log(result);
//     if (result.result !== 'ok') throw paymentRequired(result.err_description);
//     return result;
// };

exports.cancelPay = async (user, orderId) => {
    const LiqPayOrder = mongoose.model('liq_pay_order');
    if (!orderId) throw badRequest('Enter correct data');
    const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id});
    if (!liqPayOrder) throw notFound('Order is not found');
    const result = await liqPay.cancelPayment(orderId);
    if (liqPayOrder.type === 'hold') await LiqPayOrder.deleteOne({_id: orderId});
    return result;
};  

exports.getLastHold = async (user) => {
    const liqPayOrders = await LiqPayOrder.find({user: user._id, type: 'hold'}).sort({createdAt: -1});
    let result;
    if (liqPayOrders && liqPayOrders[0] && liqPayOrders[0]._id) result = await exports.cancelPay(user, liqPayOrders[0]._id);
    return result;
};

// exports.cancelHold = async (user, data) => {
//     const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
//     const LiqPayOrder = mongoose.model('liq_pay_order');
//     const {orderId} = data;
//     if (!orderId) throw badRequest('Enter correct data');
//     const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id, type: 'hold'});
//     if (!liqPayOrder) throw notFound('Order is not found');
//     const result = await liqPay.cancelPayment(orderId);
//     const liqPayOrderResult = await LiqPayOrderResult(result).save();
//     if (result.status === 'success') await liqPayOrder.updateOne({_id: orderId}, {$set: {cancelled: {value: true, ref: liqPayOrderResult._id}}}).save();
//     console.log(result);
//     if (result.result !== 'ok') throw paymentRequired(result.err_description);
//     return result;
// };

// exports.cancelSubscribe = async (user, data) => {
//     const LiqPayOrderResult = mongoose.model('liq_pay_order_result');
//     const LiqPayOrder = mongoose.model('liq_pay_order');
//     const {orderId} = data;
//     if (!orderId) throw badRequest('Enter correct data');
//     const liqPayOrder = await LiqPayOrder.findOne({_id: orderId, user: user._id, type: 'subscribe'});
//     if (liqPayOrder) throw notFound('Order is not found');
//     const result = await liqPay.cancelSubscribe(orderId);
//     const liqPayOrderResult = await LiqPayOrderResult(result).save();
//     if (result.status === 'success') await liqPayOrder.updateOne({_id: orderId}, {$set: {cancelled: {value: true, ref: liqPayOrderResult._id}}});
//     console.log(result);
//     if (result.result !== 'ok') throw paymentRequired(result.err_description);
//     return result;
// };

exports.createUserCard = async (user, card_token, cardNumberLastSymbols, orderId) => {
    const userCard = await UserCard({
        cardNumberLastSymbols,
        user: user._id,
        token: card_token || null,
        confirm: card_token ? true : false,
        orderId
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
    const cards = await UserCard.find({user: user._id, confirm: true}, {token: 0});
    return {cards};
};

exports.getCardById = async (user, cardId) => {
    const card = await UserCard.findOne({user: user._id, _id: cardId});
    if (!card) throw notFound('Card not found');
    return {card};
};