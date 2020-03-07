const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Tariff = new Schema({
    type: {
        type: String,
        enum: [
            'normal',
            'pause',
            'start',
            'exit',
            'stop'
        ]
    },
    name: String,
    price: Number,
    maxTime: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('tariff', Tariff);