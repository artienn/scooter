const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScooterCoords = new Schema({
    lat: Number,
    lot: Number,
    scooterId: String
}, {
    timestamps: true
});

module.exports = mongoose.model('scooter_coords', ScooterCoords);