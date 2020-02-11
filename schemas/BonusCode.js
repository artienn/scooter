const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BonusCode = new Schema({
    code: String,
    amount: Number,
    active: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('bonus_code', BonusCode);