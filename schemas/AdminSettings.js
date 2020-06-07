const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSettings = new Schema({
    phones: [String],
    scooterUserDistanceError: Number //m
}, {
    timestamps: true
});

module.exports = mongoose.model('admin_settings', AdminSettings);