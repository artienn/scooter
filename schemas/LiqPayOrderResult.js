const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LiqPayOrderResult = new Schema({
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('liq_pay_order_result', LiqPayOrderResult);