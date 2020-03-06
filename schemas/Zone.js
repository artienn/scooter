const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Zone = new Schema({
    area: [{
        lat: Number,
        lon: Number
    }],
    name: String,
    type: String
}, {
    timestamps: true
});

module.exports = mongoose.model('zone', Zone);