const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Scooter = new Schema({
    blockId: String,
    free: Boolean,
    coords: {
        lat: Number,
        lon: Number,
        updatedAt: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('scooter', Scooter);