const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    email: String,
    phone: String
}, {
    timestamps: true
});

User.loadClass(require('../controllers').User);

module.exports = mongoose.model('user', User);