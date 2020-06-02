const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserCoords = new Schema({
    lat: Number,
    lot: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('user_coords', UserCoords);