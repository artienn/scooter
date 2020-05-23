const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LiqPayOrderResult = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    order_id: String,
    saveToken: Boolean,
    cardNumberLastSymbols: String
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('liq_pay_order_result', LiqPayOrderResult);