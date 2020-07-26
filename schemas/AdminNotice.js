const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminNotice = new Schema({
    viewed: {
        type: Boolean,
        default: false
    },
    text: String
}, {
    timestamps: true
});

module.exports = mongoose.model('admin_notice', AdminNotice);