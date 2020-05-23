const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LiqPayOrder = new Schema({
    amount: Number,
    description: String,
    type: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    cardNumberLastSymbols: String,
    result_url: String,
    cancelled: {
        value: {
            type: Boolean,
            default: false
        },
        ref: {
            type: Schema.Types.ObjectId,
            ref: 'liq_pay_order_result'
        }
    }
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('liq_pay_order', LiqPayOrder);