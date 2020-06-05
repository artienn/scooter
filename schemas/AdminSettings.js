const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSettings = new Schema({
    phones: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model('admin_settings', AdminSettings);