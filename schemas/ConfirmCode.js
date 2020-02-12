const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfirmCode = new Schema({
    phone: String,
    code: String,
    user: Schema.Types.ObjectId
}, {
    timestamps: true
});

module.exports = mongoose.model('confirm_code', ConfirmCode);