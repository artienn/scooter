const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScooterCoordsHistory = new Schema({
    scooter: {
        type: Schema.Types.ObjectId,
        ref: 'scooter'
    },
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    },
    coords: [{
        lat: Number,
        lon: Number,
        updatedAt: Date
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('user_coords_history', ScooterCoordsHistory);