const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Zone = new Schema({
    coordinates: [[Number, Number]],
    name: String,
    type: String
}, {
    timestamps: true
});

module.exports = mongoose.model('zone', Zone);