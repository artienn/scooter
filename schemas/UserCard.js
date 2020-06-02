const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserCard = new Schema({
    token: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    cardNumberLastSymbols: String,
    confirm: Boolean,
    orderId: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('user_card', UserCard);