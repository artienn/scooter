const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GoOutZoneOfScooterSchema = new Schema({
    scooter: {
        type: Schema.Types.ObjectId,
        ref: 'scooter'
    }
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('go_out_zone_of_scooter', GoOutZoneOfScooterSchema);