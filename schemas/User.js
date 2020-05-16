const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    phone: {
        type: String
    },
    password: {
        type: String
    },
    balance: {
        type: Number,
        default: 0
    },
    fb: {
        id: String,
        access_token: String,
        firstName: String,
        lastName: String,
        email: String
    },
    firstName: String,
    lastName: String,
    middleName: String,
    email: String,
    birthday: Date,
    firebaseIds: [String]
}, {
    timestamps: true
});

User.loadClass(require('../controllers').User);

module.exports = mongoose.model('user', User);