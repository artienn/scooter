const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Scooter = new Schema({
    lockId: String,
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
    },
    batteryFlag: {
        type: Number,
        min: 1,
        max: 3
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('scooter', Scooter);