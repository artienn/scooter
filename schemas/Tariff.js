const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Tariff = new Schema({
    type: {
        type: String,
        enum: [
            'normal'
        ]
    },
    price: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('tariff', Tariff);