const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
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
    },
    fb: {
        access_token: String,
        firstName: String,
        lastName: String,
        email: String
    }
}, {
    timestamps: true
});

User.loadClass(require('../controllers').User);

module.exports = mongoose.model('user', User);