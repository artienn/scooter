const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractHistory = new Schema({
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    },
    type: String,
    start: Date,
    end: Date,
    price: Number,
    salePercent: Number,
    click: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('contract_history', ContractHistory);