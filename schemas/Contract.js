const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {enumStatuses} = require('../config');

const Contract = new Schema({
    scooter: {
        type: Schema.Types.ObjectId,
        ref: 'scooter'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    period: Number, //seconds
    tariff: {
        type: Schema.Types.ObjectId,
        ref: 'tariff'
    },
    active: Boolean,
    cableImg: String,
    closedLockImg: String,
    status: {
        updatedAt: Date,
        value: {
            type: String,
            enum: enumStatuses
        }
    },
    promocode: String,
    contractStatusPromocode: String,
    salePercentPromocode: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('contract', Contract);