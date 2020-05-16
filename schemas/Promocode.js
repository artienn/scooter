const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {enumStatuses} = require('../config');

const Promocode = new Schema({
    code: String,
    active: Boolean,
    contractStatus: {
        type: String,
        enum: enumStatuses
    },
    salePercent: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('promocode', Promocode);