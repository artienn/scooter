const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

User.loadClass(require('../controllers').User);

module.exports = mongoose.model('user', User);