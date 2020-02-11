const {BonusCode, UserBonusHistory} = require('../schemas');
const {notFound} = require('boom');

exports.replenishmentByBonusCode = async (user, data) => {
    const {bonusCode} = data;
    const bonusCodeObject = await BonusCode.findOne({code: bonusCode});
    if (!bonusCodeObject) throw notFound('Bonus code not found');
    await this.createUserBonusHistory(user, {type: 'bonus_code', amount: bonusCodeObject.amount});
    return {message: 'Ok'};
};

exports.createUserBonusHistory = async (user, data) => {
    const {type, amount} = data;
    const userBonusHistory = await UserBonusHistory({
        type,
        amount,
        user: user._id
    }).save();
    return userBonusHistory;
};