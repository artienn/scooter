const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserBalanceHistory = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    amount: Number,
    type: {
        type: String,
        enum: [
            'pay',
            'write_off_contract'
        ]
    },
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contracts'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('user_balance_history', UserBalanceHistory);