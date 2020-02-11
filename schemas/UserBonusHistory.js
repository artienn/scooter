const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserBonusHistory = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    amount: Number,
    type: String
}, {
    timestamps: true
});

module.exports = mongoose.model('user_bonus_history', UserBonusHistory);