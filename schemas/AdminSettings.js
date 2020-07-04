const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSettings = new Schema({
    phones: [String],
    scooterUserDistanceError: Number, //m
    UserBalanceMinAmount: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('admin_settings', AdminSettings);