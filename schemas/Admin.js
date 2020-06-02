const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Admin = new Schema({
    login: String,
    password: String
}, {
    timestamps: true
});

module.exports = mongoose.model('admin', Admin);