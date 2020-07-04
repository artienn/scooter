const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Tariff = new Schema({
    type: {
        type: String,
        enum: [
            'start',
            'normal',
            'pause',
            'exit',
            'stop'
        ]
    },
    userType: String,
    name: String,
    price: Number,
    maxTime: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('tariff', Tariff);