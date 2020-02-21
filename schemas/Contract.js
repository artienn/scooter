const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Contract = new Schema({
    scooter: {
        type: Schema.Types.ObjectId,
        ref: 'scooter'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    active: Boolean,
    rate: {
        updatedAt: Date,
        value: {
            type: String,
            enum: [
                'start',
                'normal',
                'pause',
                'stop',
                'exit'
            ]
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('contract', Contract);