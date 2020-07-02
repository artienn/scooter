const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SystemQueue = new Schema({
    type: {
        type: String,
        enum: [
            'push',
            'sms'
        ]
    },
    text: String,
    firebaseIds: [String],
    phone: String
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('system_queue', SystemQueue);