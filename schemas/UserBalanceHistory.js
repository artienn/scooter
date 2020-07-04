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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('user_balance_history', UserBalanceHistory);