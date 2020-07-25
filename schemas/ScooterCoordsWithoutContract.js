const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScooterCoordsWithoutContract = new Schema({
    scooter: {
        type: Schema.Types.ObjectId,
        ref: 'scooter'
    },
    lat: Number,
    lon: Number,
    smsSend: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('user_coords_without_contract', ScooterCoordsWithoutContract);