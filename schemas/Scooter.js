const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Scooter = new Schema({
    blockId: String,
    free: Boolean,
    coords: {
        lat: Number,
        lon: Number,
        updatedAt: Date
    },
    battery: {
        type: Number,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('scooter', Scooter);