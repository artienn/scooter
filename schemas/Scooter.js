const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Scooter = new Schema({
    id: String,
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
    },
    lock: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('scooter', Scooter);