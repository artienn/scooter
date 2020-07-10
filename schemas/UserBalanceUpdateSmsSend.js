const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserBalanceUpdateSmsSend = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contracts'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('user_balance_update_sms_send', UserBalanceUpdateSmsSend);